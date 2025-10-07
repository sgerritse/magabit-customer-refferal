import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube } from "lucide-react";
import { YouTubeTab } from "@/components/dashboard/YouTubeTab";

const Podcasts = () => {
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
          <h1 className="text-3xl font-bold text-foreground">Podcasts & Videos</h1>
          <p className="text-primary-foreground/80 mt-2">Watch inspiring content and learn from other dads!</p>
        </div>

        <Card className="card-gradient border-card-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-accent/10 rounded-xl">
                <Youtube className="w-6 h-6 text-accent" />
              </div>
              <span>DadderUp Podcast</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <YouTubeTab />
          </CardContent>
        </Card>
      </div>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default Podcasts;
