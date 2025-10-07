import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, MessageSquare, BellOff } from "lucide-react";

interface NotificationPreferencesProps {
  linkId: string;
  linkType: string;
  currentPreferences: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  onUpdate: () => void;
}

export const NotificationPreferences = ({
  linkId,
  linkType,
  currentPreferences,
  onUpdate,
}: NotificationPreferencesProps) => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    push: currentPreferences.push ?? true,
    email: currentPreferences.email ?? true,
    sms: currentPreferences.sms ?? false,
  });
  const [muteAll, setMuteAll] = useState(false);
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [notificationTypes, setNotificationTypes] = useState({
    visits: true,
    conversions: true,
    highValue: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("referral_links")
        .update({
          notifications_enabled: preferences,
        })
        .eq("id", linkId);

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: `Notification preferences for ${linkType} link updated`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences - {linkType}
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about clicks and conversions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Mute */}
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-black" />
            <div>
              <Label htmlFor={`mute-all-${linkId}`} className="font-semibold text-black">Mute All Notifications</Label>
              <p className="text-xs text-black/70">
                Temporarily disable all notifications for this link
              </p>
            </div>
          </div>
          <Switch
            id={`mute-all-${linkId}`}
            checked={muteAll}
            onCheckedChange={setMuteAll}
          />
        </div>

        {!muteAll && (
          <>
            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-black">Notification Channels</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-black" />
                  <div>
                    <Label htmlFor={`push-${linkId}`} className="text-black">Push Notifications</Label>
                    <p className="text-xs text-black/70">
                      Instant notifications in your browser
                    </p>
                  </div>
                </div>
                <Switch
                  id={`push-${linkId}`}
                  checked={preferences.push}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, push: checked })
                  }
                />
              </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-black" />
            <div>
              <Label htmlFor={`email-${linkId}`} className="text-black">Email Notifications</Label>
              <p className="text-xs text-black/70">
                Daily digest of your referral activity
              </p>
            </div>
          </div>
          <Switch
            id={`email-${linkId}`}
            checked={preferences.email}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, email: checked })
            }
          />
        </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-black" />
                  <div>
                    <Label htmlFor={`sms-${linkId}`} className="text-black">SMS Notifications</Label>
                    <p className="text-xs text-black/70">
                      Text alerts for conversions (may incur charges)
                    </p>
                  </div>
                </div>
                <Switch
                  id={`sms-${linkId}`}
                  checked={preferences.sms}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, sms: checked })
                  }
                />
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-black">Notification Frequency</h4>
              <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant - Get notified immediately</SelectItem>
                  <SelectItem value="daily">Daily Digest - Once per day at 8am</SelectItem>
                  <SelectItem value="weekly">Weekly Summary - Every Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-black">Notification Types</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor={`visits-${linkId}`} className="text-sm font-normal text-black">
                  All Visits
                </Label>
                <Switch
                  id={`visits-${linkId}`}
                  checked={notificationTypes.visits}
                  onCheckedChange={(checked) =>
                    setNotificationTypes({ ...notificationTypes, visits: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor={`conversions-${linkId}`} className="text-sm font-normal text-black">
                  Conversions Only
                </Label>
                <Switch
                  id={`conversions-${linkId}`}
                  checked={notificationTypes.conversions}
                  onCheckedChange={(checked) =>
                    setNotificationTypes({ ...notificationTypes, conversions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor={`high-value-${linkId}`} className="text-sm font-normal text-black">
                  High-Value Conversions ($50+)
                </Label>
                <Switch
                  id={`high-value-${linkId}`}
                  checked={notificationTypes.highValue}
                  onCheckedChange={(checked) =>
                    setNotificationTypes({ ...notificationTypes, highValue: checked })
                  }
                />
              </div>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};
