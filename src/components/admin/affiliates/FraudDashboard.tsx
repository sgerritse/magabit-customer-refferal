import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Ban, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import DOMPurify from "dompurify";

interface FraudAlert {
  id: string;
  type: string;
  user_id: string;
  user_name: string;
  description: string;
  severity: string;
  created_at: string;
  data: any;
}

interface FlaggedLandingPage {
  id: string;
  user_id: string;
  user_name: string;
  custom_content: string;
  spam_keywords_found: string[];
  created_at: string;
}

export const FraudDashboard = () => {
  const [velocityViolations, setVelocityViolations] = useState<FraudAlert[]>([]);
  const [ipDuplicates, setIpDuplicates] = useState<any[]>([]);
  const [flaggedPages, setFlaggedPages] = useState<FlaggedLandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    setLoading(true);

    // Get affiliate settings for velocity limits
    const { data: settings } = await supabase
      .from("affiliate_settings")
      .select("*")
      .single();

    const maxReferralsPerHour = settings?.max_referrals_per_hour || 10;
    const maxReferralsPerDay = settings?.max_referrals_per_day || 50;

    // Find users exceeding velocity limits
    const { data: visits } = await supabase
      .from("referral_visits")
      .select("referrer_user_id, visited_at, profiles!inner(display_name)")
      .gte("visited_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("visited_at", { ascending: false });

    const userVisitCounts = visits?.reduce((acc: any, visit: any) => {
      const userId = visit.referrer_user_id;
      if (!acc[userId]) {
        acc[userId] = {
          hourly: 0,
          daily: 0,
          user_name: visit.profiles?.display_name || "Unknown",
        };
      }
      acc[userId].daily++;
      
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(visit.visited_at) > hourAgo) {
        acc[userId].hourly++;
      }
      return acc;
    }, {});

    const violations = Object.entries(userVisitCounts || {})
      .filter(([_, counts]: any) => 
        counts.hourly > maxReferralsPerHour || counts.daily > maxReferralsPerDay
      )
      .map(([userId, counts]: any) => ({
        id: userId,
        type: "velocity_limit",
        user_id: userId,
        user_name: counts.user_name,
        description: `Exceeded limits: ${counts.hourly}/hr (max ${maxReferralsPerHour}), ${counts.daily}/day (max ${maxReferralsPerDay})`,
        severity: counts.hourly > maxReferralsPerHour * 2 ? "high" : "medium",
        created_at: new Date().toISOString(),
        data: counts,
      }));

    // Send fraud alerts for new violations
    for (const violation of violations) {
      await sendFraudAlert('velocity_limit', {
        user_id: violation.user_id,
        user_name: violation.user_name,
        hourly_count: violation.data.hourly,
        daily_count: violation.data.daily,
        max_hourly: maxReferralsPerHour,
        max_daily: maxReferralsPerDay
      });
    }

    setVelocityViolations(violations);

    // Find duplicate IPs with multiple conversions
    const { data: conversions } = await supabase
      .from("referral_visits")
      .select("visitor_ip, converted, referrer_user_id, profiles!inner(display_name)")
      .eq("converted", true)
      .not("visitor_ip", "is", null);

    const ipCounts = conversions?.reduce((acc: any, visit: any) => {
      const ip = visit.visitor_ip;
      if (!acc[ip]) {
        acc[ip] = { count: 0, users: new Set(), user_names: [] };
      }
      acc[ip].count++;
      acc[ip].users.add(visit.referrer_user_id);
      if (visit.profiles?.display_name && !acc[ip].user_names.includes(visit.profiles.display_name)) {
        acc[ip].user_names.push(visit.profiles.display_name);
      }
      return acc;
    }, {});

    const suspiciousIps = Object.entries(ipCounts || {})
      .filter(([_, data]: any) => data.count >= 3)
      .map(([ip, data]: any) => ({
        ip,
        conversion_count: data.count,
        unique_ambassadors: data.users.size,
        ambassador_names: data.user_names.join(", "),
      }));

    // Send fraud alerts for suspicious IPs
    for (const ipData of suspiciousIps) {
      await sendFraudAlert('duplicate_ip', {
        ip_address: ipData.ip,
        conversion_count: ipData.conversion_count,
        unique_ambassadors: ipData.unique_ambassadors
      });
    }

    setIpDuplicates(suspiciousIps);

    // Check landing pages for spam keywords
    const spamKeywords = Array.isArray(settings?.spam_keywords) 
      ? settings.spam_keywords 
      : (settings?.spam_keywords as any)?.keywords || [];
    
    const { data: landingPages } = await supabase
      .from("ambassador_landing_pages")
      .select("*, profiles!inner(display_name)")
      .in("status", ["pending", "approved"]);

    const flagged = landingPages
      ?.filter((page: any) => {
        const content = (page.custom_content || "").toLowerCase();
        const foundKeywords = (spamKeywords as string[]).filter((keyword: string) =>
          content.includes(keyword.toLowerCase())
        );
        return foundKeywords.length > 0;
      })
      .map((page: any) => {
        const content = (page.custom_content || "").toLowerCase();
        const foundKeywords = (spamKeywords as string[]).filter((keyword: string) =>
          content.includes(keyword.toLowerCase())
        );
        return {
          id: page.id,
          user_id: page.user_id,
          user_name: page.profiles?.display_name || "Unknown",
          custom_content: page.custom_content,
          spam_keywords_found: foundKeywords,
          created_at: page.created_at,
        };
      }) || [];

    // Send fraud alerts for flagged pages
    for (const page of flagged) {
      await sendFraudAlert('spam_content', {
        page_id: page.id,
        user_id: page.user_id,
        user_name: page.user_name,
        keywords: page.spam_keywords_found
      });
    }

    setFlaggedPages(flagged);
    setLoading(false);
  };

  const handleFlagLandingPage = async (id: string, userId: string) => {
    const { error } = await supabase
      .from("ambassador_landing_pages")
      .update({ 
        status: "rejected", 
        rejection_reason: "Flagged for spam content",
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to flag landing page");
    } else {
      // Queue notification to ambassador
      await supabase.from('notification_queue').insert({
        user_id: userId,
        notification_type: 'landing_page_rejected',
        channel: 'email',
        data: {
          reason: 'Contains spam keywords',
          page_id: id
        }
      });

      toast.success("Landing page flagged and ambassador notified");
      loadFraudData();
    }
  };

  const sendFraudAlert = async (type: string, details: any) => {
    // Get all admin users from user_roles table
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins) {
      // Queue notification for each admin
      for (const admin of admins) {
        await supabase.from('notification_queue').insert({
          user_id: admin.user_id,
          notification_type: 'fraud_alert',
          channel: 'email',
          data: {
            alert_type: type,
            details,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Log in security audit
      await supabase.from('security_audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'FRAUD_DETECTED',
        target_user_id: details.user_id,
        new_values: { alert_type: type, details }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fraud Prevention Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage suspicious activities</p>
        </div>
        <Button onClick={loadFraudData} variant="outline">
          <Shield className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="velocity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="velocity">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Velocity Limits ({velocityViolations.length})
          </TabsTrigger>
          <TabsTrigger value="ip">
            <Ban className="w-4 h-4 mr-2" />
            Duplicate IPs ({ipDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="spam">
            <Shield className="w-4 h-4 mr-2" />
            Spam Content ({flaggedPages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="velocity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users Exceeding Velocity Limits</CardTitle>
            </CardHeader>
            <CardContent>
              {velocityViolations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No velocity limit violations detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {velocityViolations.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{alert.user_name}</p>
                            <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review User
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious IP Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {ipDuplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No suspicious IP activity detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ipDuplicates.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm mb-2">{item.ip}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.conversion_count} conversions from {item.unique_ambassadors} ambassador(s)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ambassadors: {item.ambassador_names}
                          </p>
                        </div>
                        <Badge variant="destructive">Suspicious</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spam" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landing Pages with Spam Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              {flaggedPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No spam content detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flaggedPages.map((page) => (
                    <div key={page.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{page.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(page.created_at), "PPp")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleFlagLandingPage(page.id, page.user_id)}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Flag & Reject
                        </Button>
                      </div>
                      <div className="mb-2">
                        <Badge variant="destructive" className="mr-2">
                          Keywords: {page.spam_keywords_found.join(", ")}
                        </Badge>
                      </div>
                      <div
                        className="text-sm bg-muted p-3 rounded max-h-32 overflow-y-auto"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(page.custom_content, {
                            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'div', 'b', 'i'],
                            ALLOWED_ATTR: ['class'],
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
