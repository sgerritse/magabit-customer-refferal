import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Globe, Users, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const PrivacySettings = () => {
  const { user } = useAuth();
  const [defaultPrivacy, setDefaultPrivacy] = useState<'private' | 'public'>('private');
  const [communityOptIn, setCommunityOptIn] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Load privacy preferences from localStorage (or could be from DB)
  useEffect(() => {
    const savedPreference = localStorage.getItem('dadderup-default-privacy');
    if (savedPreference === 'public' || savedPreference === 'private') {
      setDefaultPrivacy(savedPreference);
    }
    
    const savedOptIn = localStorage.getItem('dadderup-community-opt-in');
    if (savedOptIn !== null) {
      setCommunityOptIn(savedOptIn === 'true');
    }
  }, []);

  const handleSavePreferences = () => {
    setIsUpdating(true);
    try {
      localStorage.setItem('dadderup-default-privacy', defaultPrivacy);
      localStorage.setItem('dadderup-community-opt-in', String(communityOptIn));
      
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkPrivacyUpdate = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to update all your past posts to private? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('answer_logs')
        .update({ privacy: 'private' })
        .eq('user_id', user.id)
        .eq('privacy', 'public');

      if (error) throw error;

      toast({
        title: "Posts Updated",
        description: "All your past posts have been set to private.",
      });
    } catch (error) {
      console.error('Error updating posts:', error);
      toast({
        title: "Error",
        description: "Failed to update posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <Card className="card-gradient border-card-border">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-accent" />
          <CardTitle>Privacy Settings</CardTitle>
        </div>
        <CardDescription>
          Control who can see your challenge responses and community participation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Post Privacy */}
        <div className="space-y-3">
          <Label htmlFor="default-privacy" className="text-base font-medium">
            Default Post Privacy
          </Label>
          <Select value={defaultPrivacy} onValueChange={(value: 'private' | 'public') => setDefaultPrivacy(value)}>
            <SelectTrigger id="default-privacy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Private (Recommended)</span>
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose the default privacy setting for all new challenge responses. You can always change this for individual posts.
          </p>
        </div>

        {/* Community Opt-In */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="community-opt-in" className="text-base font-medium">
                Community Participation
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to participate in the DadderUp community and see other dads' posts.
              </p>
            </div>
            <Switch
              id="community-opt-in"
              checked={communityOptIn}
              onCheckedChange={setCommunityOptIn}
            />
          </div>
          {!communityOptIn && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Community Features Disabled</AlertTitle>
              <AlertDescription>
                You won't see community posts, but you can still complete challenges privately.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSavePreferences}
          className="w-full"
          disabled={isUpdating}
        >
          {isUpdating ? "Saving..." : "Save Privacy Settings"}
        </Button>

        {/* Bulk Update Section */}
        <div className="pt-4 border-t space-y-3">
          <div className="space-y-1">
            <Label className="text-base font-medium">Manage Past Posts</Label>
            <p className="text-sm text-muted-foreground">
              Update the privacy settings for all your previously submitted challenges.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBulkPrivacyUpdate}
            disabled={isBulkUpdating}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isBulkUpdating ? "Updating..." : "Set All Past Posts to Private"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
