import { useState, useEffect } from "react";
import { Settings, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChallengesAdmin } from "@/components/admin/ChallengesAdmin";
import { ReactionsAdmin } from "@/components/admin/ReactionsAdmin";
import { ParentReactionsAdmin } from "@/components/admin/ParentReactionsAdmin";
import { BadgesAdmin } from "@/components/admin/BadgesAdmin";
import { LogsAdmin } from "@/components/admin/LogsAdmin";
import UsersAdmin from "@/components/admin/UsersAdmin";
import { OnboardingStepsAdmin } from "@/components/admin/OnboardingStepsAdmin";
import { WelcomeVideoAdmin } from "@/components/admin/WelcomeVideoAdmin";
import { UnifiedPackageManagement } from "@/components/admin/UnifiedPackageManagement";
import { PlansPageCustomization } from "@/components/admin/PlansPageCustomization";
import { StripeSettings } from "@/components/admin/StripeSettings";
import { WooCommerceSettings } from "@/components/admin/WooCommerceSettings";
import { PauseRemindersAdmin } from "@/components/admin/PauseRemindersAdmin";
import { NotificationsAdmin } from "@/components/admin/NotificationsAdmin";
import { AffiliatesAdmin } from "@/components/admin/AffiliatesAdmin";
import { ThemeSettings } from "@/components/admin/ThemeSettings";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminSwitch } from "@/contexts/AdminSwitchContext";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LoadingWidget, mapSettingsToProps } from "@/components/ui/loading-widget";
import { useThemeSettings } from "@/hooks/useThemeSettings";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("challenges");
  const [challengeFilter, setChallengeFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAdmin, loading } = useUserRole();
  const { isInUserMode } = useAdminSwitch();
  const { settings } = useThemeSettings();
  const navigate = useNavigate();

  // Redirect to dashboard if in user mode (users shouldn't see admin panel)
  useEffect(() => {
    if (isInUserMode) {
      navigate('/dashboard');
    }
  }, [isInUserMode, navigate]);

  const handleViewAnswers = (challengeTitle: string) => {
    setChallengeFilter(challengeTitle);
    setActiveTab("logs");
  };

  // Show loading state
  if (loading) {
    return (
      <LoadingWidget 
        {...mapSettingsToProps(settings?.loading_widget_settings)}
        loadingText="Checking permissions..." 
      />
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Sidebar Toggle - positioned at top of content area */}
          
          <NavigationBar onMenuClick={() => setDrawerOpen(true)} leftExtras={<SidebarTrigger className="h-8 w-8 border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 rounded-md" />} />
          <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
          
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
              {/* Admin Content */}
              <div className="space-y-6">
                {activeTab.startsWith("theme-") && <ThemeSettings activeSection={activeTab} />}
                {activeTab === "challenges" && <ChallengesAdmin onViewAnswers={handleViewAnswers} />}
                {activeTab === "reactions" && <ReactionsAdmin />}
                {activeTab === "parent-reactions" && <ParentReactionsAdmin />}
                {activeTab === "badges" && <BadgesAdmin />}
                {activeTab === "products-plans" && (
                  <div className="space-y-8">
                    <UnifiedPackageManagement />
                    <PlansPageCustomization />
                  </div>
                )}
                {activeTab === "pause-reminders" && <PauseRemindersAdmin />}
                {activeTab === "onboarding-video" && <WelcomeVideoAdmin />}
                {activeTab === "onboarding-steps" && <OnboardingStepsAdmin />}
                {activeTab === "users" && <UsersAdmin />}
                {activeTab === "logs" && (
                  <LogsAdmin challengeFilter={challengeFilter} onClearFilter={() => setChallengeFilter("all")} />
                )}
                {activeTab === "notifications-email" && <NotificationsAdmin section="email" />}
                {activeTab === "notifications-sms" && <NotificationsAdmin section="sms" />}
                {activeTab === "notifications-push" && <NotificationsAdmin section="push" />}
                {activeTab === "notifications-sequences" && <NotificationsAdmin section="sequences" />}
                {activeTab === "notifications-ambassador" && <NotificationsAdmin section="ambassador" />}
                {activeTab === "affiliates-settings" && <AffiliatesAdmin section="settings" />}
                {activeTab === "affiliates-payouts" && <AffiliatesAdmin section="payouts" />}
                {activeTab === "affiliates-ambassadors" && <AffiliatesAdmin section="ambassadors" />}
                {activeTab === "affiliates-earnings" && <AffiliatesAdmin section="earnings" />}
                {activeTab === "affiliates-tax" && <AffiliatesAdmin section="tax" />}
                {activeTab === "affiliates-creatives" && <AffiliatesAdmin section="creatives" />}
                {activeTab === "affiliates-analytics" && <AffiliatesAdmin section="analytics" />}
                {activeTab === "affiliates-fraud" && <AffiliatesAdmin section="fraud" />}
                {activeTab === "affiliates-tracking" && <AffiliatesAdmin section="tracking" />}
                {activeTab === "security" && <SecurityDashboard />}
                {activeTab === "api-stripe" && <StripeSettings />}
                {activeTab === "api-woocommerce" && <WooCommerceSettings />}
              </div>
            </div>
          </div>
          
          <AdminSwitchFooter />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;