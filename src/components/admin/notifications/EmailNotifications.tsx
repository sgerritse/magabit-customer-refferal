import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, FileText, Zap, Send, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../RichTextEditor.css";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { EmailTriggerManager } from "./EmailTriggerManager";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const EmailNotifications = () => {
  const [mailgunSettings, setMailgunSettings] = useState({
    fromEmail: "",
    fromName: "DadderUp",
    enabled: false,
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendEmailForm, setSendEmailForm] = useState({
    recipients: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setMailgunSettings({
          fromEmail: data.from_email || "",
          fromName: data.from_name || "DadderUp",
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
        from_email: mailgunSettings.fromEmail,
        from_name: mailgunSettings.fromName,
        enabled: mailgunSettings.enabled,
      };

      if (settingsId) {
        const { error } = await supabase
          .from('email_notification_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_notification_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success("Email settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);

      const recipientList = sendEmailForm.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (recipientList.length === 0) {
        toast.error("Please enter at least one recipient email");
        return;
      }

      if (!sendEmailForm.subject || !sendEmailForm.message) {
        toast.error("Subject and message are required");
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          recipients: recipientList,
          subject: sendEmailForm.subject,
          message: sendEmailForm.message,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success(`Email sent successfully to ${recipientList.length} recipient(s)`);
      setSendEmailForm({ recipients: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
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
          Send Email
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Update:</strong> Mailgun API credentials are now stored as secure environment variables.
            Contact your administrator to configure <code>MAILGUN_API_KEY</code> and <code>MAILGUN_DOMAIN</code> in Supabase Edge Function secrets.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure email settings (API keys stored securely in environment)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-enabled" className="flex flex-col space-y-1">
                <span>Enable Email Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Master switch for all email notifications
                </span>
              </Label>
              <Switch
                id="email-enabled"
                checked={mailgunSettings.enabled}
                onCheckedChange={(checked) =>
                  setMailgunSettings({ ...mailgunSettings, enabled: checked })
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
                <li>• <code className="bg-muted px-1.5 py-0.5 rounded">MAILGUN_API_KEY</code> - Configured in Supabase</li>
                <li>• <code className="bg-muted px-1.5 py-0.5 rounded">MAILGUN_DOMAIN</code> - Configured in Supabase</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="noreply@dadderup.com"
                value={mailgunSettings.fromEmail}
                onChange={(e) =>
                  setMailgunSettings({ ...mailgunSettings, fromEmail: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="DadderUp"
                value={mailgunSettings.fromName}
                onChange={(e) =>
                  setMailgunSettings({ ...mailgunSettings, fromName: e.target.value })
                }
              />
            </div>

            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Create and manage email templates for different notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTemplateManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="triggers">
        <Card>
          <CardHeader>
            <CardTitle>Email Triggers</CardTitle>
            <CardDescription>
              Set up automated email triggers based on user actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTriggerManager />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="send">
        <Card>
          <CardHeader>
            <CardTitle>Send One-Off Email</CardTitle>
            <CardDescription>
              Send a custom email to users or user segments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Input
                id="recipients"
                placeholder="Enter email addresses (comma-separated)"
                value={sendEmailForm.recipients}
                onChange={(e) =>
                  setSendEmailForm({ ...sendEmailForm, recipients: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Email subject"
                value={sendEmailForm.subject}
                onChange={(e) =>
                  setSendEmailForm({ ...sendEmailForm, subject: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <ReactQuill
                theme="snow"
                value={sendEmailForm.message}
                onChange={(value) =>
                  setSendEmailForm({ ...sendEmailForm, message: value })
                }
                placeholder="Email content (HTML supported)"
                className="bg-white rounded-md"
              />
            </div>

            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
