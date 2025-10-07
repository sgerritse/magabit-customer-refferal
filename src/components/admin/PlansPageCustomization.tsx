import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { usePlansPageSettings } from "@/hooks/usePlansPageSettings";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

export const PlansPageCustomization = () => {
  const { settings, isLoading, updateSettings } = usePlansPageSettings();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoHeading, setVideoHeading] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [videoDescription, setVideoDescription] = useState("");
  const [enableDelay, setEnableDelay] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [enableCtaButton, setEnableCtaButton] = useState(false);
  const [ctaButtonText, setCtaButtonText] = useState("");

  useEffect(() => {
    if (settings) {
      setVideoUrl(settings.video_url || "");
      setVideoHeading(settings.video_heading || "");
      setShowVideo(settings.show_video || false);
      setVideoDescription(settings.video_description || "");
      setEnableDelay(settings.enable_delay || false);
      setDelaySeconds(settings.delay_seconds || 0);
      setEnableCtaButton(settings.enable_cta_button || false);
      setCtaButtonText(settings.cta_button_text || "Continue to Plans");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      video_url: videoUrl,
      video_heading: videoHeading,
      show_video: showVideo,
      video_description: videoDescription,
      enable_delay: enableDelay,
      delay_seconds: delaySeconds,
      enable_cta_button: enableCtaButton,
      cta_button_text: ctaButtonText,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans Page Customization</CardTitle>
        <CardDescription>
          Configure the video bridge section that appears above plan selection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-video">Enable Video Section</Label>
            <p className="text-sm text-muted-foreground">
              Show video bridge above plan cards
            </p>
          </div>
          <Switch
            id="show-video"
            checked={showVideo}
            onCheckedChange={setShowVideo}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-heading">Video Section Heading</Label>
          <div className="border-2 border-gray-300 rounded-md">
            <ReactQuill
              theme="snow"
              value={videoHeading}
              onChange={setVideoHeading}
              placeholder="e.g., Watch Our Introduction Video"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'align': [] }],
                  ['clean']
                ]
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Format your heading with colors, styles, and alignment
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-url">YouTube Video URL</Label>
          <Textarea
            id="video-url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            rows={2}
          />
          <p className="text-sm text-muted-foreground">
            Enter the full YouTube video URL
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-description">Video Description (Optional)</Label>
          <Textarea
            id="video-description"
            placeholder="Optional description text below the video"
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-delay">Enable Timer Delay</Label>
            <p className="text-sm text-muted-foreground">
              Delay showing the plans section for a set time
            </p>
          </div>
          <Switch
            id="enable-delay"
            checked={enableDelay}
            onCheckedChange={setEnableDelay}
          />
        </div>

        {enableDelay && (
          <div className="space-y-2">
            <Label htmlFor="delay-seconds">Delay Before Showing Plans (seconds)</Label>
            <Input
              id="delay-seconds"
              type="number"
              min="0"
              placeholder="0"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              Number of seconds to wait before showing the "Choose Your Plan" section
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-cta">Enable CTA Button</Label>
            <p className="text-sm text-muted-foreground">
              Show a button that reveals the plans section when clicked
            </p>
          </div>
          <Switch
            id="enable-cta"
            checked={enableCtaButton}
            onCheckedChange={setEnableCtaButton}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta-text">CTA Button Text</Label>
          <Input
            id="cta-text"
            placeholder="e.g., Continue to Plans"
            value={ctaButtonText}
            onChange={(e) => setCtaButtonText(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Text displayed on the button that reveals the plans
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateSettings.isPending}
          className="w-full sm:w-auto"
        >
          {updateSettings.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};
