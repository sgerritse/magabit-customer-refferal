import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Ban, CheckCircle, Shield, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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

export const FraudDashboardEnhanced = () => {
  const [velocityViolations, setVelocityViolations] = useState<FraudAlert[]>([]);
  const [ipDuplicates, setIpDuplicates] = useState<any[]>([]);
  const [flaggedPages, setFlaggedPages] = useState<FlaggedLandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [whitelistedIPs, setWhitelistedIPs] = useState<Array<{ip: string, reason: string}>>([]);
  const [newWhitelistIP, setNewWhitelistIP] = useState("");
  const [newWhitelistReason, setNewWhitelistReason] = useState("");

  useEffect(() => {
    loadFraudData();
    loadWhitelistedIPs();
  }, [dateRange]);

  const loadWhitelistedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('whitelisted_ips')
        .select('ip_address, reason')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWhitelistedIPs(data.map(row => ({ ip: row.ip_address as string, reason: row.reason || '' })));
    } catch (error) {
      console.error('Error loading whitelisted IPs:', error);
    }
  };

  const loadFraudData = async () => {
    setLoading(true);

    const { data: settings } = await supabase
      .from("affiliate_settings")
      .select("*")
      .single();

    const maxReferralsPerHour = settings?.max_referrals_per_hour || 10;
    const maxReferralsPerDay = settings?.max_referrals_per_day || 50;

    const { data: visits } = await supabase
      .from("referral_visits")
      .select("referrer_user_id, visited_at, visitor_ip, converted, conversion_value, profiles!inner(display_name)")
      .gte("visited_at", dateRange.from.toISOString())
      .lte("visited_at", dateRange.to.toISOString())
      .order("visited_at", { ascending: false });

    // Velocity violations
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

    setVelocityViolations(violations);

    // IP duplicates (excluding whitelisted)
    const ipCounts = visits?.reduce((acc: any, visit: any) => {
      const ip = visit.visitor_ip;
      if (!ip || whitelistedIPs.some(w => w.ip === ip)) return acc;
      
      if (visit.converted) {
        if (!acc[ip]) {
          acc[ip] = { count: 0, users: new Set(), user_names: [] };
        }
        acc[ip].count++;
        acc[ip].users.add(visit.referrer_user_id);
        if (visit.profiles?.display_name && !acc[ip].user_names.includes(visit.profiles.display_name)) {
          acc[ip].user_names.push(visit.profiles.display_name);
        }
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

    setIpDuplicates(suspiciousIps);

    // Spam detection
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

    if (!error) {
      await supabase.from('notification_queue').insert({
        user_id: userId,
        notification_type: 'landing_page_rejected',
        channel: 'email',
        data: { reason: 'Contains spam keywords', page_id: id }
      });

      toast.success("Landing page flagged");
      loadFraudData();
    }
  };

  const addWhitelistIP = async () => {
    if (!newWhitelistIP || whitelistedIPs.some(w => w.ip === newWhitelistIP)) {
      toast.error("IP already whitelisted or invalid");
      return;
    }

    try {
      const { error } = await supabase
        .from('whitelisted_ips')
        .insert({ ip_address: newWhitelistIP, reason: newWhitelistReason || null });

      if (error) throw error;

      toast.success("IP whitelisted");
      setNewWhitelistIP("");
      setNewWhitelistReason("");
      loadWhitelistedIPs();
      loadFraudData();
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const removeWhitelistIP = async (ip: string) => {
    try {
      const { error } = await supabase
        .from('whitelisted_ips')
        .delete()
        .eq('ip_address', ip);

      if (error) throw error;

      toast.success("IP removed");
      loadWhitelistedIPs();
      loadFraudData();
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const exportToCSV = (type: 'velocity' | 'ip' | 'spam') => {
    let csvContent = '';
    let filename = '';

    if (type === 'velocity') {
      csvContent = [
        ['User Name', 'Hourly Count', 'Daily Count', 'Severity'].join(','),
        ...velocityViolations.map(v => [
          v.user_name,
          v.data.hourly,
          v.data.daily,
          v.severity
        ].join(','))
      ].join('\n');
      filename = 'velocity-violations.csv';
    } else if (type === 'ip') {
      csvContent = [
        ['IP Address', 'Conversions', 'Unique Ambassadors', 'Ambassador Names'].join(','),
        ...ipDuplicates.map(ip => [
          ip.ip,
          ip.conversion_count,
          ip.unique_ambassadors,
          `"${ip.ambassador_names}"`
        ].join(','))
      ].join('\n');
      filename = 'suspicious-ips.csv';
    } else {
      csvContent = [
        ['User Name', 'Keywords Found', 'Created At'].join(','),
        ...flaggedPages.map(p => [
          p.user_name,
          `"${p.spam_keywords_found.join(', ')}"`,
          format(new Date(p.created_at), 'yyyy-MM-dd')
        ].join(','))
      ].join('\n');
      filename = 'spam-content.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fraud Prevention Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage suspicious activities</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div>
                  <Label>From</Label>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  />
                </div>
                <div>
                  <Label>To</Label>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={loadFraudData} variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* IP Whitelist Management */}
      <Card>
        <CardHeader>
          <CardTitle>IP Whitelist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address..."
              value={newWhitelistIP}
              onChange={(e) => setNewWhitelistIP(e.target.value)}
            />
            <Button onClick={addWhitelistIP}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {whitelistedIPs.map((item) => (
              <Badge key={item.ip} variant="secondary" className="gap-2">
                {item.ip}
                <button onClick={() => removeWhitelistIP(item.ip)} className="ml-1">×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="velocity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="velocity">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Velocity ({velocityViolations.length})
          </TabsTrigger>
          <TabsTrigger value="ip">
            <Ban className="w-4 h-4 mr-2" />
            IPs ({ipDuplicates.length})
          </TabsTrigger>
          <TabsTrigger value="spam">
            <Shield className="w-4 h-4 mr-2" />
            Spam ({flaggedPages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="velocity" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Velocity Limit Violations</CardTitle>
              {velocityViolations.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => exportToCSV('velocity')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {velocityViolations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No violations detected</p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Suspicious IP Addresses</CardTitle>
              {ipDuplicates.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => exportToCSV('ip')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {ipDuplicates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No suspicious activity detected</p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Spam Content</CardTitle>
              {flaggedPages.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => exportToCSV('spam')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {flaggedPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No spam detected</p>
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
                        <Badge variant="destructive">
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
