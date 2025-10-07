import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { StatsProvider } from "@/contexts/StatsContext";
import { ProgressSkeleton } from "@/components/ui/progress-skeleton";

const ProgressTracker = lazy(() => import("@/components/dashboard/ProgressTracker").then(m => ({ default: m.ProgressTracker })));
const LeaderboardTab = lazy(() => import("@/components/dashboard/LeaderboardTab").then(m => ({ default: m.LeaderboardTab })));

const Progress = () => {
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
    <StatsProvider>
      <div className="min-h-screen bg-background">
        <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
        <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
              <p className="text-foreground/80 mt-2">Track your points, badges, streaks, and see how you rank!</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Refresh
            </Button>
          </div>

          {/* Points and Badges */}
          <StatsSection />

          {/* Streak & Progress */}
          <Suspense fallback={<ProgressSkeleton />}>
            <ProgressTracker />
          </Suspense>

          {/* Leaderboard */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Leaderboard</h2>
            <Suspense fallback={<ProgressSkeleton />}>
              <LeaderboardTab />
            </Suspense>
          </div>
        </div>
        
        <AdminSwitchFooter />
      </div>
    </StatsProvider>
  );
};

export default Progress;
