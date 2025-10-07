import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, FileText, Zap, Send, Info } from "lucide-react";

export const PushNotifications = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Recommended Setup:</strong> For web push notifications, I recommend using{" "}
          <a href="https://firebase.google.com/docs/cloud-messaging" target="_blank" rel="noopener noreferrer" className="underline">
            Firebase Cloud Messaging (FCM)
          </a>
          . It's free, reliable, and works across all browsers and platforms. You'll need to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create a Firebase project</li>
            <li>Enable Cloud Messaging</li>
            <li>Add your web app and get the config</li>
            <li>Generate a VAPID key for web push</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send Push
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Cloud Messaging Configuration</CardTitle>
              <CardDescription>
                Configure Firebase for web push notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                <Switch id="push-enabled" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-api-key">Firebase API Key</Label>
                <Input id="fcm-api-key" placeholder="AIzaSy..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-auth-domain">Auth Domain</Label>
                <Input id="fcm-auth-domain" placeholder="your-app.firebaseapp.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-project-id">Project ID</Label>
                <Input id="fcm-project-id" placeholder="your-project-id" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-sender-id">Sender ID</Label>
                <Input id="fcm-sender-id" placeholder="123456789" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-app-id">App ID</Label>
                <Input id="fcm-app-id" placeholder="1:123456789:web:..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fcm-vapid">VAPID Key (for web push)</Label>
                <Input id="fcm-vapid" placeholder="Your VAPID key" />
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                <li>Create a new project or select existing one</li>
                <li>Enable Cloud Messaging in Project Settings</li>
                <li>Copy your Firebase config from Project Settings → General → Your apps</li>
                <li>Generate a VAPID key in Project Settings → Cloud Messaging</li>
                <li>Paste the configuration values above</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Push Notification Templates</CardTitle>
              <CardDescription>
                Create templates with title, body, icon, and action URL
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <Button>+ Add New Template</Button>
              <div className="text-sm text-foreground/70">
                No templates created yet. Templates support variables and can include images, actions, and deep links.
              </div>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers">
          <Card>
            <CardHeader>
              <CardTitle>Push Notification Triggers</CardTitle>
              <CardDescription>
                Set up automated push notifications based on events
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <Button>+ Add New Trigger</Button>
              <div className="space-y-3">
                <p className="text-sm font-medium">Suggested Triggers:</p>
                <ul className="text-sm text-foreground/70 space-y-2">
                  <li>• Badge Earned - Instant notification when badge is earned</li>
                  <li>• New Challenge Available - Alert users about new content</li>
                  <li>• Streak Reminder - Daily reminder to maintain streak</li>
                  <li>• Community Activity - Notify about likes, comments, reactions</li>
                  <li>• Weekly Digest - Summary notification once per week</li>
                  <li>• Milestone Celebration - Special achievements</li>
                  <li>• Re-engagement - Bring back inactive users</li>
                </ul>
              </div>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
              <CardDescription>
                Send an immediate push notification to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="push-recipients">Recipients</Label>
                <Input
                  id="push-recipients"
                  placeholder="All users, specific segment, or individual users"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="push-title">Title</Label>
                <Input id="push-title" placeholder="Notification title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="push-body">Body</Label>
                <Textarea
                  id="push-body"
                  placeholder="Notification message"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="push-icon">Icon URL (optional)</Label>
                <Input id="push-icon" placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="push-action">Action URL (optional)</Label>
                <Input id="push-action" placeholder="https://dadderup.com/..." />
              </div>

              <Button>Send Push Notification</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
