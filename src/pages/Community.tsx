import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Share2, Users } from "lucide-react";
import { DiscordTab } from "@/components/dashboard/DiscordTab";
import { SocialMediaTab } from "@/components/dashboard/SocialMediaTab";

const Community = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Community Hub</h1>
          <p className="text-foreground mt-2">Connect with other dads, share experiences, and grow together!</p>
        </div>

        <Tabs defaultValue="social-media" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-lg">
            <TabsTrigger 
              value="social-media" 
              data-tab="social-media"
              className="flex items-center space-x-2 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger 
              value="discord" 
              className="flex items-center space-x-2 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Community Chat</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="social-media">
            <Card className="card-gradient border-card-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-accent/10 rounded-xl">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <span>DadderUp Community</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SocialMediaTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="discord">
            <Card className="card-gradient border-card-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-accent/10 rounded-xl">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <span>DadderUp Community</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DiscordTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default Community;
