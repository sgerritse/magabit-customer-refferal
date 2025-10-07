import { useEffect, useState } from "react";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { LogFormSection } from "@/components/dashboard/LogFormSection";
import { EncouragementFooter } from "@/components/dashboard/EncouragementFooter";
import { BadgeBackfill } from "@/components/dashboard/BadgeBackfill";
import { BadgesCard } from "@/components/dashboard/BadgesCard";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { useUserStats } from "@/hooks/useUserStats";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { pointsHistory, badges, totalPoints } = useUserStats();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isInUserMode, switchedUserId } = useAdminSwitch();
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const { user, loading } = useAuth();

  // Fetch logs count from Supabase for effective user (respects Admin Switch)
  useEffect(() => {
    if (!user) return;
    const effectiveUserId = (isInUserMode && switchedUserId) ? switchedUserId : user.id;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('answer_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId);
      if (!error) setLogsCount(count ?? 0);
      else setLogsCount(0);
    };

    fetchCount();
  }, [user, isInUserMode, switchedUserId]);
  
  // Check if user is new (no points, badges, or logs)
  const isNewUser = totalPoints === 0 && badges.length === 0 && (logsCount ?? 0) === 0;

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <BadgeBackfill />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
        <HeroSection />
        
        <LogFormSection />
        <BadgesCard />
        
        <EncouragementFooter />
      </div>
      <AdminSwitchFooter />
    </div>
  );
};

export default Dashboard;