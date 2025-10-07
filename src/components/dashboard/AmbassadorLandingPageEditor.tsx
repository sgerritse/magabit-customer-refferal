import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAmbassadorLandingPage } from "@/hooks/useAmbassadorLandingPage";
import { Loader2, AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Spam keywords from affiliate_settings
const SPAM_KEYWORDS = [
  'click here', 'free money', 'urgent', 'act now', 'limited time',
  'guaranteed', 'risk free', 'no obligation', 'winner', 'congratulations',
  'cash bonus', 'earn money fast', 'work from home', 'get rich'
];

export const AmbassadorLandingPageEditor = () => {
  const { landingPage, isLoading, saveLandingPage } = useAmbassadorLandingPage();
  const [enabled, setEnabled] = useState(landingPage?.enabled || false);
  const [youtubeUrl, setYoutubeUrl] = useState(landingPage?.youtube_url || '');
  const [customContent, setCustomContent] = useState(landingPage?.custom_content || '');
  const [saving, setSaving] = useState(false);
  const [spamWarning, setSpamWarning] = useState<string[]>([]);

  // WYSIWYG Image Upload Handler
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        toast.info("Uploading image...");
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `landing-pages/${fileName}`;

        const { data, error } = await supabase.storage
          .from('challenge-media')
          .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('challenge-media')
          .getPublicUrl(filePath);

        const quill = (window as any).quill;
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', urlData.publicUrl);
        }
        
        toast.success("Image uploaded successfully!");
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error("Failed to upload image");
      }
    };
  };

  // Check for spam keywords whenever content changes
  useEffect(() => {
    const contentText = customContent.toLowerCase().replace(/<[^>]*>/g, ' ');
    const detectedSpam = SPAM_KEYWORDS.filter(keyword => 
      contentText.includes(keyword.toLowerCase())
    );
    setSpamWarning(detectedSpam);
  }, [customContent]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLandingPage.mutateAsync({ enabled, youtube_url: youtubeUrl, custom_content: customContent });
    } finally {
      setSaving(false);
    }
  };

  const statusBadges = {
    draft: <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Draft</Badge>,
    pending: <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Clock className="w-3 h-3" /> Pending Approval</Badge>,
    approved: <Badge variant="outline" className="gap-1 border-green-500 text-green-600"><CheckCircle className="w-3 h-3" /> Approved</Badge>,
    rejected: <Badge variant="outline" className="gap-1 border-red-500 text-red-600"><AlertCircle className="w-3 h-3" /> Rejected</Badge>
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Personalized Landing Page Settings</CardTitle>
          {landingPage && statusBadges[landingPage.status]}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rejection Notice */}
        {landingPage?.status === 'rejected' && landingPage.rejection_reason && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Revision Required:</strong> {landingPage.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-landing">Enable Custom Landing Page</Label>
            <p className="text-sm text-muted-foreground">Create a personalized page for your referrals</p>
          </div>
          <Switch 
            id="enable-landing"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Spam Warning */}
            {spamWarning.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Spam Keywords Detected:</strong> Your content contains words that may trigger spam filters: <strong>{spamWarning.join(', ')}</strong>. 
                  This may result in your landing page being rejected or flagged for review.
                </AlertDescription>
              </Alert>
            )}

            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube Video URL (Optional)</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Embed a video to introduce yourself to your referrals</p>
            </div>

            {/* Custom Content WYSIWYG */}
            <div className="space-y-2">
              <Label>Custom Bio / Message</Label>
              <div className="border rounded-md">
                <ReactQuill
                  value={customContent}
                  onChange={setCustomContent}
                  modules={quillModules}
                  theme="snow"
                  placeholder="Share your story and why you love DadderUp..."
                  className="min-h-[200px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Add images by clicking the image icon in the editor</p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {landingPage?.status === 'draft' ? 'Submit for Approval' : 'Update & Resubmit'}
            </Button>

            {landingPage?.status === 'approved' && landingPage.user_id && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Your landing page is live! Share your custom ambassador page.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
