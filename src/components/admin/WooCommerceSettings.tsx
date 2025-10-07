import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WooCommerceSettings {
  id?: string;
  site_url: string;
  enabled: boolean;
  last_sync_at?: string;
}

export const WooCommerceSettings = () => {
  const [settings, setSettings] = useState<WooCommerceSettings>({
    site_url: "https://dadderup.com",
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('woocommerce_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          site_url: data.site_url || "https://dadderup.com",
          enabled: data.enabled || false,
          last_sync_at: data.last_sync_at,
        });
      }
    } catch (error) {
      console.error("Error loading WooCommerce settings:", error);
      toast({
        title: "Error",
        description: "Failed to load WooCommerce settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.site_url) {
      toast({
        title: "Validation Error",
        description: "Site URL is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (settings.id) {
        const { error } = await supabase
          .from('woocommerce_settings')
          .update({
            site_url: settings.site_url,
            enabled: settings.enabled,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('woocommerce_settings')
          .insert({
            site_url: settings.site_url,
            enabled: settings.enabled,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSettings({
            ...settings,
            id: data.id,
          });
        }
      }

      toast({
        title: "Success",
        description: "WordPress settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving WooCommerce settings:", error);
      toast({
        title: "Error",
        description: "Failed to save WordPress settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading WordPress settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Update:</strong> WooCommerce API keys are now stored as secure environment variables.
          Contact your administrator to configure <code>WOOCOMMERCE_API_KEY</code> and <code>WOOCOMMERCE_SITE_URL</code> in Supabase Edge Function secrets.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>WordPress API Configuration</CardTitle>
          <CardDescription>
            Configure your DadderUp custom API (API key stored securely in environment)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label>Enable WordPress Integration</Label>
              <p className="text-sm text-muted-foreground">
                Turn on to sync with your WordPress site
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_url">WordPress Site URL *</Label>
            <Input
              id="site_url"
              type="url"
              value={settings.site_url}
              onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Your WordPress site URL (configured for dadderup.com)
            </p>
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
              <li>• <code className="bg-muted px-1.5 py-0.5 rounded">WOOCOMMERCE_API_KEY</code> - Already configured</li>
              <li>• <code className="bg-muted px-1.5 py-0.5 rounded">WOOCOMMERCE_SITE_URL</code> - Already configured</li>
            </ul>
          </div>

          {settings.last_sync_at && (
            <div className="text-sm text-muted-foreground">
              Last synced: {new Date(settings.last_sync_at).toLocaleString()}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
