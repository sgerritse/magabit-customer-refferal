import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { OnboardingSection } from "@/components/dashboard/OnboardingSection";
import { useAuth } from "@/hooks/useAuth";
import { useWelcomeVideo } from "@/hooks/useWelcomeVideo";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const GettingStarted = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useAuth();
  const { settings: videoSettings, isLoading: videoLoading } = useWelcomeVideo();
  const [firstName, setFirstName] = useState<string>("");
  const navigate = useNavigate();

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadUserName = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .rpc('get_user_decrypted', { target_user_id: user.id });

        if (!error && data && data.length > 0) {
          setFirstName(data[0].first_name || "");
        }
      }
    };

    loadUserName();
  }, [user]);

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
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to DadderUp{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="text-foreground mt-2">Follow these steps to begin your DadderUp journey! 🎉</p>
        </div>

        {/* Welcome Video */}
        {videoSettings && videoSettings.is_enabled && videoSettings.video_url && (
          <Card className="overflow-hidden border-card-border shadow-lg bg-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">
                {videoSettings.heading_text || "Watch this quick tutorial video!"}
              </h2>
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(videoSettings.video_url)}`}
                  title="Welcome Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <OnboardingSection />
      </div>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default GettingStarted;
