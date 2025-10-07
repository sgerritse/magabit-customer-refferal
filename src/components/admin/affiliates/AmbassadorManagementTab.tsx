import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RejectLandingPageDialog } from "@/components/admin/RejectLandingPageDialog";
import { TierManagementDialog } from "./TierManagementDialog";
import DOMPurify from "dompurify";

interface Ambassador {
  user_id: string;
  display_name: string;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  current_tier: string;
}

interface LandingPageSubmission {
  id: string;
  user_id: string;
  user_name: string;
  youtube_url: string | null;
  custom_content: string | null;
  status: string;
  created_at: string;
}

export const AmbassadorManagementTab = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPageSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load ambassadors with stats
    const { data: refData } = await supabase
      .from("referral_visits")
      .select("referrer_user_id, converted, conversion_value");

    const userStats = refData?.reduce((acc: any, visit) => {
      const userId = visit.referrer_user_id;
      if (!userId) return acc;
      
      if (!acc[userId]) {
        acc[userId] = { clicks: 0, conversions: 0, earnings: 0 };
      }
      acc[userId].clicks++;
      if (visit.converted) {
        acc[userId].conversions++;
        acc[userId].earnings += parseFloat(visit.conversion_value?.toString() || '0');
      }
      return acc;
    }, {});

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    // Get tier data
    const { data: tierData } = await supabase
      .from("ambassador_tiers")
      .select("user_id, current_tier");

    const ambassadorList = Object.keys(userStats || {}).map(userId => ({
      user_id: userId,
      display_name: profilesData?.find(p => p.user_id === userId)?.display_name || 'Unknown',
      total_clicks: userStats[userId].clicks,
      total_conversions: userStats[userId].conversions,
      total_earnings: userStats[userId].earnings,
      current_tier: tierData?.find(t => t.user_id === userId)?.current_tier || 'bronze'
    }));

    setAmbassadors(ambassadorList);

    // Load landing page submissions
    const { data: lpData } = await supabase
      .from("ambassador_landing_pages")
      .select(`
        *,
        profiles!ambassador_landing_pages_user_id_fkey(display_name)
      `)
      .eq("status", "pending");

    setLandingPages((lpData || []).map((lp: any) => ({
      id: lp.id,
      user_id: lp.user_id,
      user_name: lp.profiles?.display_name || 'Unknown',
      youtube_url: lp.youtube_url,
      custom_content: lp.custom_content,
      status: lp.status,
      created_at: lp.created_at
    })));

    setLoading(false);
  };

  const handleApproveLandingPage = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("ambassador_landing_pages")
        .update({ 
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", id);

      if (error) throw error;
      
      // Queue notification to ambassador
      const page = landingPages.find(p => p.id === id);
      if (page) {
        await supabase.from("notification_queue").insert({
          user_id: page.user_id,
          notification_type: "landing_page_approved",
          channel: "email",
          data: {
            message: "Your landing page has been approved and is now live!"
          }
        });
      }

      toast.success("Landing page approved!");
      loadData();
    } catch (error: any) {
      toast.error(`Failed to approve: ${error.message}`);
    }
  };

  const handleRejectLandingPage = async (reason: string) => {
    if (!selectedPageId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("ambassador_landing_pages")
        .update({ 
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", selectedPageId);

      if (error) throw error;

      // Queue notification to ambassador
      const page = landingPages.find(p => p.id === selectedPageId);
      if (page) {
        await supabase.from("notification_queue").insert({
          user_id: page.user_id,
          notification_type: "landing_page_rejected",
          channel: "email",
          data: {
            message: `Your landing page was rejected. Reason: ${reason}`,
            rejection_reason: reason
          }
        });
      }

      toast.success("Landing page rejected");
      setSelectedPageId(null);
      loadData();
    } catch (error: any) {
      toast.error(`Failed to reject: ${error.message}`);
    }
  };

  const openRejectDialog = (id: string) => {
    setSelectedPageId(id);
    setRejectDialogOpen(true);
  };

  const openTierDialog = (ambassador: Ambassador) => {
    setSelectedAmbassador(ambassador);
    setTierDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <RejectLandingPageDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectLandingPage}
      />
      
      {selectedAmbassador && (
        <TierManagementDialog
          open={tierDialogOpen}
          onOpenChange={setTierDialogOpen}
          userId={selectedAmbassador.user_id}
          userName={selectedAmbassador.display_name}
          currentTier={selectedAmbassador.current_tier}
          onSuccess={loadData}
        />
      )}
      
      {/* Landing Page Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {landingPages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending submissions</p>
          ) : (
            <div className="space-y-4">
              {landingPages.map((lp) => (
                <div key={lp.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{lp.user_name}</p>
                      <p className="text-sm text-muted-foreground">Submitted {format(new Date(lp.created_at), 'PPp')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleApproveLandingPage(lp.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openRejectDialog(lp.id)}>
                        <XCircle className="w-4 h-4 mr-1 text-destructive" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {lp.youtube_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">YouTube URL:</Label>
                      <p className="text-sm">{lp.youtube_url}</p>
                    </div>
                  )}

                  {lp.custom_content && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Custom Content:</Label>
                      <div 
                        className="mt-2 p-3 bg-muted rounded max-h-48 overflow-y-auto" 
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(lp.custom_content, {
                            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'b', 'i'],
                            ALLOWED_ATTR: ['href', 'target', 'class', 'style'],
                          })
                        }} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ambassador List */}
      <Card>
        <CardHeader>
          <CardTitle>All Ambassadors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ambassadors.map((amb) => (
              <div key={amb.user_id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <p className="font-semibold">{amb.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {amb.total_clicks} clicks • {amb.total_conversions} conversions • ${amb.total_earnings.toFixed(2)} earned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{amb.current_tier}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openTierDialog(amb)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {ambassadors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No ambassadors yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
