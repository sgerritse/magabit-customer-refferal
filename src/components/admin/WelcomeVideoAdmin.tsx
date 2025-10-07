import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { useWelcomeVideo } from "@/hooks/useWelcomeVideo";

export const WelcomeVideoAdmin = () => {
  const { settings, isLoading, updateSettings } = useWelcomeVideo();
  const [videoUrl, setVideoUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [headingText, setHeadingText] = useState("Watch this quick tutorial video!");

  useEffect(() => {
    if (settings) {
      setVideoUrl(settings.video_url || "");
      setIsEnabled(settings.is_enabled);
      setHeadingText(settings.heading_text || "Watch this quick tutorial video!");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      video_url: videoUrl,
      is_enabled: isEnabled,
      heading_text: headingText,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome / Onboarding Video</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome / Onboarding Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-video" className="text-base text-card-foreground">
              Enable Welcome Video
            </Label>
            <p className="text-sm text-muted-foreground">
              Show a video at the top of the Getting Started page
            </p>
          </div>
          <Switch
            id="enable-video"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heading-text" className="text-card-foreground">Video Heading Text</Label>
          <Input
            id="heading-text"
            type="text"
            value={headingText}
            onChange={(e) => setHeadingText(e.target.value)}
            placeholder="Watch this quick tutorial video!"
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            This heading appears above the video
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-url" className="text-card-foreground">YouTube Video URL</Label>
          <Input
            id="video-url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Enter the full YouTube video URL to display on the Getting Started page
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
