import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripeSettings {
  id?: string;
  webhook_secret: string;
  enabled: boolean;
  test_mode: boolean;
}

export const StripeSettings = () => {
  const [settings, setSettings] = useState<StripeSettings>({
    webhook_secret: "",
    enabled: false,
    test_mode: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          webhook_secret: data.webhook_secret || "",
          enabled: data.enabled || false,
          test_mode: data.test_mode || true,
        });
      }
    } catch (error) {
      console.error("Error loading Stripe settings:", error);
      toast.error("Failed to load Stripe settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (settings.id) {
        const { error } = await supabase
          .from('stripe_settings')
          .update({
            webhook_secret: settings.webhook_secret,
            enabled: settings.enabled,
            test_mode: settings.test_mode,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('stripe_settings')
          .insert({
            webhook_secret: settings.webhook_secret,
            enabled: settings.enabled,
            test_mode: settings.test_mode,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      toast.success("Stripe settings saved successfully");
    } catch (error) {
      console.error("Error saving Stripe settings:", error);
      toast.error("Failed to save Stripe settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading Stripe settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Update:</strong> Stripe API keys are now stored as secure environment variables.
          Contact your administrator to configure <code>STRIPE_SECRET_KEY</code> in Supabase Edge Function secrets.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Configuration</CardTitle>
          <CardDescription>
            Configure Stripe integration settings (API keys stored securely in environment)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label>Enable Stripe Integration</Label>
              <p className="text-sm text-muted-foreground">
                Turn on to start accepting payments through Stripe
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label>Test Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use test API keys for development
              </p>
            </div>
            <Switch
              checked={settings.test_mode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, test_mode: checked })
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
              <li>• <code className="bg-muted px-1.5 py-0.5 rounded">STRIPE_SECRET_KEY</code> - Already configured</li>
              <li>• <code className="bg-muted px-1.5 py-0.5 rounded">STRIPE_PUBLISHABLE_KEY</code> - Already configured</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Get your keys from{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard → Developers → API Keys
              </a>
            </p>
          </div>

          <div className="p-4 bg-muted/50 border border-border rounded-md space-y-3 text-sm">
            <p className="font-medium text-foreground">Webhook Endpoint URL:</p>
            <code className="block p-3 bg-card text-card-foreground rounded text-xs break-all font-mono border">
              https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/stripe-webhook
            </code>
            <p className="text-muted-foreground">
              Add this endpoint in{" "}
              <a
                href="https://dashboard.stripe.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Stripe Dashboard → Developers → Webhooks
              </a>
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-2">
            <a
              href="https://dashboard.stripe.com/test/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              → Stripe Dashboard
            </a>
            <a
              href="https://dashboard.stripe.com/test/products"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              → Manage Products & Prices
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
