import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, FileText, Zap, Send, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SMSNotifications = () => {
  const [twilioSettings, setTwilioSettings] = useState({
    enabled: false,
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [smsRecipients, setSmsRecipients] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_notification_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setTwilioSettings({
          enabled: data.enabled || false,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsData = {
        enabled: twilioSettings.enabled,
      };

      if (settingsId) {
        const { error } = await supabase
          .from('sms_notification_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('sms_notification_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success("SMS settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleSendSMS = async () => {
    if (!smsRecipients.trim() || !smsMessage.trim()) {
      toast.error("Please enter both recipients and message");
      return;
    }

    if (smsMessage.length > 160) {
      toast.error("Message must be 160 characters or less");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers: smsRecipients,
          message: smsMessage,
        },
      });

      if (error) throw error;

      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.length - successCount;

      if (failCount === 0) {
        toast.success(`SMS sent successfully to ${successCount} recipient(s)`);
        setSmsRecipients("");
        setSmsMessage("");
      } else {
        toast.warning(`Sent to ${successCount}, failed for ${failCount} recipient(s)`);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-white">
        <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
          <Settings className="w-4 h-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
          <FileText className="w-4 h-4" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="triggers" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
          <Zap className="w-4 h-4" />
          Triggers
        </TabsTrigger>
        <TabsTrigger value="send" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
          <Send className="w-4 h-4" />
          Send SMS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Update:</strong> Twilio credentials are now stored as secure environment variables.
            Contact your administrator to configure <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, and <code>TWILIO_PHONE_NUMBER</code> in Supabase Edge Function secrets.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>SMS Configuration</CardTitle>
            <CardDescription>
              Configure SMS settings (Twilio credentials stored securely in environment)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
              <Switch
                id="sms-enabled"
                checked={twilioSettings.enabled}
                onCheckedChange={(checked) =>
                  setTwilioSettings({ ...twilioSettings, enabled: checked })
                }
              />
            </div>

            <div className="p-4 bg-card border rounded-md space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Required Environment Variables</h3>
                <a
                  href="https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/settings/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  Configure in Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code className="bg-muted px-1.5 py-0.5 rounded">TWILIO_ACCOUNT_SID</code> - Configured in Supabase</li>
                <li>• <code className="bg-muted px-1.5 py-0.5 rounded">TWILIO_AUTH_TOKEN</code> - Configured in Supabase</li>
                <li>• <code className="bg-muted px-1.5 py-0.5 rounded">TWILIO_PHONE_NUMBER</code> - Configured in Supabase</li>
              </ul>
            </div>

            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <CardTitle>SMS Templates</CardTitle>
            <CardDescription>
              Create and manage SMS templates for different notifications (160 char limit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button>+ Add New Template</Button>
              <div className="text-sm text-foreground/70">
                No templates created yet. Keep messages under 160 characters.
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="triggers">
        <Card>
          <CardHeader>
            <CardTitle>SMS Triggers</CardTitle>
            <CardDescription>
              Set up automated SMS triggers based on user actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button>+ Add New Trigger</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="send">
        <Card>
          <CardHeader>
            <CardTitle>Send One-Off SMS</CardTitle>
            <CardDescription>
              Send a custom SMS to users or user segments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-recipients">Recipients</Label>
              <Input
                id="sms-recipients"
                placeholder="Enter phone numbers (comma-separated), e.g. +1234567890"
                value={smsRecipients}
                onChange={(e) => setSmsRecipients(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-message">Message (160 char limit)</Label>
              <Textarea
                id="sms-message"
                placeholder="Your SMS message"
                maxLength={160}
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
              <p className="text-xs text-foreground/60">{smsMessage.length}/160 characters</p>
            </div>

            <Button onClick={handleSendSMS} disabled={sending}>
              {sending ? "Sending..." : "Send SMS"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
