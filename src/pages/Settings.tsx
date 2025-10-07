import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Lock, Mail, Shield, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { updateWordPressPassword, getWordPressErrorMessage } from "@/services/wordpressApi";
import { z } from "zod";
import { PrivacySettings } from "@/components/dashboard/PrivacySettings";
import { ActiveSessions } from "@/components/dashboard/ActiveSessions";

// Zod validation schema for password change
const passwordChangeSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { preferences, isLoading: prefsLoading, savePreferences } = useNotificationPreferences();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [wpUserId, setWpUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load WordPress user ID
  useEffect(() => {
    const loadWpUserId = async () => {
      if (!user) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('wp_user_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userData?.wp_user_id) {
        setWpUserId(userData.wp_user_id);
      }
    };
    
    loadWpUserId();
  }, [user]);

  // Load preferences from database
  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.email_enabled);
      setSmsNotifications(preferences.sms_enabled);
      setPushNotifications(preferences.push_enabled);
      setWeeklyDigest(preferences.weekly_digest);
    }
  }, [preferences]);

  const handleSaveSettings = () => {
    savePreferences.mutate({
      email_enabled: emailNotifications,
      sms_enabled: smsNotifications,
      push_enabled: pushNotifications,
      weekly_digest: weeklyDigest,
    });
  };

  const handleChangePassword = async () => {
    // Validate passwords with Zod
    try {
      passwordChangeSchema.parse({ newPassword, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsChangingPassword(true);
    try {
      // Update Supabase password first
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Sync with WordPress if user has a WordPress ID
      if (wpUserId) {
        const wpResult = await updateWordPressPassword({
          user_id: wpUserId,
          new_password: newPassword,
        });

        if (!wpResult.success) {
          console.error('WordPress password sync error:', wpResult);
          toast({
            title: "Warning",
            description: `Password updated but WordPress sync failed: ${getWordPressErrorMessage(wpResult.code)}`,
            variant: "default",
          });
        } else {
          toast({
            title: "Password Updated",
            description: "Your password has been successfully changed and synced with WordPress",
          });
        }
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully changed",
        });
      }
      
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
    navigate('/auth');
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-primary-foreground/80 mt-2">Manage your account preferences and settings</p>
        </div>

        {/* Notifications */}
        <Card className="card-gradient border-card-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-accent" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose how you want to receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about your challenges and achievements
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get browser notifications for new challenges
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive text messages for challenges and reminders
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your progress
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
            </div>

            <Button 
              onClick={handleSaveSettings} 
              className="w-full"
              disabled={savePreferences.isPending || prefsLoading}
            >
              {savePreferences.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <PrivacySettings />

        {/* Active Sessions */}
        <ActiveSessions />

        {/* Privacy Policy */}
        <Card className="card-gradient border-card-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle>Privacy Policy</CardTitle>
            </div>
            <CardDescription>
              Learn about how we protect your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-card-foreground">
                Your privacy is important to us. By default, all your challenge responses are private unless you choose to share them with the community.
              </p>
            </div>
            <Button variant="outline" className="w-full">
              View Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="card-gradient border-card-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>
              Manage your account and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your new password below. It must be at least 6 characters long.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default Settings;
