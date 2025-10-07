import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, BarChart3, Users, DollarSign, Image, Loader2, TrendingUp, Bell } from "lucide-react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { useReferralLinks } from "@/hooks/useReferralLinks";
import { useAmbassadorEarnings } from "@/hooks/useAmbassadorEarnings";
import { useAmbassadorAnalytics } from "@/hooks/useAmbassadorAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReferralLinkCard } from "@/components/dashboard/ReferralLinkCard";
import { AmbassadorLandingPageEditor } from "@/components/dashboard/AmbassadorLandingPageEditor";
import { W9Form } from "@/components/dashboard/W9Form";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { NotificationPreferences } from "@/components/dashboard/NotificationPreferences";
import { PayoutMethodSelector } from "@/components/dashboard/PayoutMethodSelector";
import { TierProgressCard } from "@/components/dashboard/TierProgressCard";
import { ReferralVisitLog } from "@/components/dashboard/ReferralVisitLog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from "date-fns";

const BrandAmbassador = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { links, isLoading: linksLoading, generateLinks, updateNotifications } = useReferralLinks();
  const { stats, earnings, statsLoading, requestPayout } = useAmbassadorEarnings();
  const { data: analytics, isLoading: analyticsLoading } = useAmbassadorAnalytics(30);

  // Fetch payout history
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["ambassador-payouts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ambassador_payouts")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch marketing creatives
  const { data: creatives } = useQuery({
    queryKey: ["marketing-creatives-list"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("marketing-creatives")
        .list("", { limit: 100 });

      if (error) throw error;

      return data.map((file) => ({
        ...file,
        url: supabase.storage.from("marketing-creatives").getPublicUrl(file.name).data.publicUrl,
      }));
    },
  });

  // Check W-9 status from tax_documents table
  const { data: taxDocument } = useQuery({
    queryKey: ["w9-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tax_documents")
        .select("id")
        .eq("user_id", user.id)
        .eq("tax_year", new Date().getFullYear())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!linksLoading && links.length === 0) {
      generateLinks.mutate();
    }
  }, [linksLoading, links.length]);

  const needsW9 = stats && stats.totalEarnings >= 600 && !taxDocument;

  const tierBadges = {
    bronze: <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">🥉 Bronze</Badge>,
    silver: <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">🥈 Silver</Badge>,
    gold: <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">🥇 Gold</Badge>
  };

  const handleRequestPayout = async () => {
    if (!stats?.availableBalance) {
      return;
    }
    await requestPayout.mutateAsync(stats.availableBalance);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <div className="pt-20 pb-8 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Brand Ambassador</h1>
                <p className="text-muted-foreground">Share DadderUp and earn commissions on every referral</p>
              </div>
              {stats && tierBadges[stats.currentTier]}
            </div>
          </div>

          <Tabs defaultValue="links" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8 text-black">
              <TabsTrigger value="links">
                <Share2 className="h-4 w-4 mr-2" />
                Links
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Bell className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="referrals">
                <Users className="h-4 w-4 mr-2" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="payouts">
                <DollarSign className="h-4 w-4 mr-2" />
                Payouts
              </TabsTrigger>
              <TabsTrigger value="creatives">
                <Image className="h-4 w-4 mr-2" />
                Creatives
              </TabsTrigger>
            </TabsList>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-6">
              {linksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <OnboardingChecklist />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {links.map((link) => (
                      <ReferralLinkCard
                        key={link.id}
                        link={link}
                        onUpdateNotifications={(notifications) => 
                          updateNotifications.mutate({ linkId: link.id, notifications })
                        }
                      />
                    ))}
                  </div>

                  {/* Landing Page Editor */}
                  <AmbassadorLandingPageEditor />
                </>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how you want to be notified about your referral activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {links.map((link) => (
                    <NotificationPreferences
                      key={link.id}
                      linkId={link.id}
                      linkType={link.link_type}
                      currentPreferences={link.notifications_enabled || {}}
                      onUpdate={() => {}}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-6">
              {needsW9 && <W9Form />}
              
              {statsLoading || analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalClicks || 0}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalConversions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analytics?.totalClicks ? ((analytics.totalConversions / analytics.totalClicks) * 100).toFixed(1) : 0}% conversion rate
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">${analytics?.totalEarnings.toFixed(2) || '0.00'}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <TierProgressCard />

                  <Card>
                    <CardHeader>
                      <CardTitle>Visits Over Last 30 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics?.visitsByDate || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" strokeWidth={2} />
                          <Line type="monotone" dataKey="conversions" stroke="hsl(var(--accent))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Conversions by Link Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics?.visitsByLinkType || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="conversions" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>Track conversions from your referral links (privacy-protected)</CardDescription>
                </CardHeader>
                <CardContent>
                  {earnings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No referrals yet</p>
                      <p className="text-sm mt-2">Share your links to start earning!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {earnings.slice(0, 20).map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(earning.earned_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm">Commission: ${earning.amount.toFixed(2)}</p>
                          </div>
                          <Badge variant={
                            earning.status === 'paid' ? 'default' :
                            earning.status === 'approved' ? 'outline' : 'secondary'
                          }>
                            {earning.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <ReferralVisitLog />
            </TabsContent>

            {/* Payouts Tab */}
            <TabsContent value="payouts" className="space-y-6">
              <PayoutMethodSelector />

              <Card>
                <CardHeader>
                  <CardTitle>Balance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Available Balance</p>
                          <p className="text-3xl font-bold text-green-600">${stats?.availableBalance.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-muted-foreground">Ready to withdraw</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Pending Balance</p>
                          <p className="text-3xl font-bold text-yellow-600">${stats?.pendingBalance.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-muted-foreground">Awaiting approval</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Earned (All Time)</p>
                          <p className="text-3xl font-bold">${stats?.totalEarnings.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {(stats?.availableBalance || 0) >= 1.00 ? (
                        <Button 
                          onClick={handleRequestPayout} 
                          className="w-full"
                          disabled={requestPayout.isPending}
                        >
                          {requestPayout.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Request Payout - ${stats?.availableBalance.toFixed(2)}
                        </Button>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Minimum payout amount is $1.00
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payoutsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : !payouts || payouts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payout history yet</p>
                      <p className="text-sm mt-2">Request your first payout when you reach $1.00</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">${Number(payout.amount).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Requested: {new Date(payout.requested_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              Method: {payout.payout_method.replace('_', ' ')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              payout.status === 'completed' ? 'default' :
                              payout.status === 'processing' ? 'outline' :
                              payout.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creatives Tab */}
            <TabsContent value="creatives">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Creatives</CardTitle>
                  <CardDescription>Download banners, images, and promotional materials to share DadderUp</CardDescription>
                </CardHeader>
                <CardContent>
                  {!creatives || creatives.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No marketing creatives available yet</p>
                      <p className="text-sm mt-2">Check back soon for promotional materials</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {creatives.map((creative) => (
                        <div key={creative.name} className="border rounded-lg p-4 space-y-3">
                          {creative.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                            <div className="aspect-video bg-muted rounded overflow-hidden">
                              <img 
                                src={creative.url} 
                                alt={creative.name.split("/").pop() || "Creative"} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-muted rounded flex items-center justify-center">
                              <Image className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold">{creative.name.split("/").pop()}</h4>
                            <p className="text-sm text-muted-foreground">
                              {creative.name.split(".").pop()?.toUpperCase()} • {format(new Date(creative.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => window.open(creative.url, "_blank")}
                            >
                              Preview
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = creative.url;
                                a.download = creative.name.split("/").pop() || creative.name;
                                a.click();
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BrandAmbassador;
