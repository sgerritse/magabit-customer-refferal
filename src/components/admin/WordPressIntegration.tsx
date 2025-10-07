import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const WordPressIntegration = () => {
  const [siteUrl, setSiteUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async () => {
    if (!siteUrl || !apiKey) {
      toast.error("Please enter both Site URL and API Key");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-woocommerce-products', {
        body: { siteUrl, apiKey }
      });

      if (error) throw error;

      setTestResult({
        success: true,
        message: `Successfully connected! Found ${data?.length || 0} products.`
      });
      toast.success("Connection successful!");
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to connect to WordPress site"
      });
      toast.error("Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    toast.success("Settings saved! (Would be implemented with proper secret storage)");
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress/WooCommerce Connection</CardTitle>
          <CardDescription>
            Connect your WordPress site to enable automatic conversion tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-url">WordPress Site URL</Label>
            <Input
              id="site-url"
              placeholder="https://yoursite.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Your DadderUp WordPress API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generate this in your WordPress admin: Settings → DadderUp Integration
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={testing} variant="outline">
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
            <Button onClick={saveSettings} disabled={!testResult?.success}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to integrate with WordPress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Step 1: Install WordPress Plugin</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Download the DadderUp WordPress plugin</li>
              <li>Go to <strong>Plugins → Add New → Upload Plugin</strong></li>
              <li>Upload the plugin ZIP file and activate</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Step 2: Configure Plugin</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to <strong>Settings → DadderUp Integration</strong></li>
              <li>Click <strong>Generate API Key</strong></li>
              <li>Copy the API key and paste it above</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Step 3: Add Tracking Script</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>The plugin automatically adds the tracking script</li>
              <li>Or manually add to <strong>header.php</strong> (see Tracking Widget tab)</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Step 4: Configure WooCommerce Webhook</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to <strong>WooCommerce → Settings → Advanced → Webhooks</strong></li>
              <li>Click <strong>Add Webhook</strong></li>
              <li>Set Topic to <strong>Order Created</strong></li>
              <li>Set Delivery URL to: <code className="bg-muted px-1 rounded text-xs">https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-conversion</code></li>
              <li>Click <strong>Save Webhook</strong></li>
            </ol>
          </div>

          <Button variant="outline" asChild className="w-full">
            <a href="/docs/WORDPRESS_INTEGRATION.md" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full WordPress Documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Activity</CardTitle>
          <CardDescription>Monitor incoming conversion events from WordPress</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-sm">
              Webhook logging will be displayed here once configured. Check the Edge Function logs for real-time debugging.
            </AlertDescription>
          </Alert>
          <Button variant="outline" asChild className="w-full mt-4">
            <a 
              href="https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/functions/track-conversion/logs" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Edge Function Logs
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
