import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const TrackingWidgetGenerator = () => {
  const [copied, setCopied] = useState(false);
  
  const scriptTag = `<script src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/tracking.js"></script>`;
  
  const exampleUsage = `<!-- Add to WordPress header.php or any HTML page -->
${scriptTag}

<!-- Track conversion after signup/purchase -->
<script>
  // After successful signup or purchase:
  DadderUpTracking.trackConversion(
    'user-id-123',      // User ID
    49.99,              // Order value
    'product-abc',      // Product ID (optional)
    'sub-xyz'           // Subscription ID (optional)
  );
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    toast.success("Script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            JavaScript Tracking Widget
          </CardTitle>
          <CardDescription>
            Embed this script on any website to track referral visits automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Installation</h3>
            <p className="text-sm text-muted-foreground">
              Copy and paste this code into the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section of your website:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {scriptTag}
              </pre>
              <Button
                size="icon"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* How It Works */}
          <Alert>
            <AlertDescription>
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Detects <code className="bg-background px-1 rounded">?ref=CODE</code> in URL</li>
                <li>Stores referral code in cookie for 30 days</li>
                <li>Automatically tracks visits to our database</li>
                <li>Works across all pages and subdomains</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Example Usage */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Track Conversions</h3>
            <p className="text-sm text-muted-foreground">
              Call this function after successful signup or purchase:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre">
              {exampleUsage}
            </pre>
          </div>

          {/* WordPress Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">WordPress Installation</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to <strong>Appearance → Theme Editor</strong></li>
              <li>Open <code className="bg-background px-1 rounded">header.php</code></li>
              <li>Paste the script tag before <code className="bg-background px-1 rounded">&lt;/head&gt;</code></li>
              <li>Click <strong>Update File</strong></li>
            </ol>
          </div>

          {/* Documentation Link */}
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <a href="/docs/TRACKING_WIDGET_API.md" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Documentation
              </a>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="/docs/WORDPRESS_INTEGRATION.md" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                WordPress Guide
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test Your Integration</CardTitle>
          <CardDescription>Verify the tracking widget is working correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To test the tracking widget:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Add <code className="bg-muted px-1 rounded">?ref=YOUR_CODE</code> to any page URL</li>
            <li>Open browser DevTools (F12) → Console tab</li>
            <li>Look for: <code className="bg-muted px-1 rounded">[DadderUp Tracking] Visit tracked successfully</code></li>
            <li>Check the Analytics tab to see the visit recorded</li>
          </ol>
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Debug Mode:</strong> The widget automatically logs to the browser console. Check for any error messages if tracking isn't working.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
