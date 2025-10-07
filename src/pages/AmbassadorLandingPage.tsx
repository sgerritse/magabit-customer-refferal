import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

export default function AmbassadorLandingPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [landingPage, setLandingPage] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadLandingPage();
  }, [username]);

  const loadLandingPage = async () => {
    if (!username) {
      navigate("/");
      return;
    }

    try {
      // Get public ambassador profile (only returns approved ambassadors)
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_public_ambassador_profile", { p_username: username });

      if (profileError || !profileData || profileData.length === 0) {
        toast.error("Ambassador not found");
        navigate("/");
        return;
      }

      const ambassadorProfile = profileData[0];
      setProfile(ambassadorProfile);

      // Load their landing page
      const { data: pageData, error: pageError } = await supabase
        .from("ambassador_landing_pages")
        .select("*")
        .eq("user_id", ambassadorProfile.user_id)
        .eq("status", "approved")
        .eq("enabled", true)
        .single();

      if (pageError || !pageData) {
        toast.error("This ambassador's page is not available");
        navigate("/");
        return;
      }

      setLandingPage(pageData);

      // Track the visit
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      
      if (refCode) {
        await supabase.functions.invoke("track-visit", {
          body: {
            referralCode: refCode,
            visitorIp: "client-side",
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            landingPageUrl: window.location.href,
          },
        });
      }
    } catch (error) {
      console.error("Error loading landing page:", error);
      toast.error("Failed to load ambassador page");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!landingPage || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-12 h-12 rounded-full border-2 border-primary"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {profile.display_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  DadderUp Brand Ambassador
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/register")} size="lg">
              Join DadderUp
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* YouTube Video */}
        {landingPage.youtube_url && (
          <Card className="mb-12">
            <CardContent className="p-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={landingPage.youtube_url.replace("watch?v=", "embed/")}
                  title="Ambassador Video"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Content */}
        {landingPage.custom_content && (
          <Card className="mb-12">
            <CardContent className="p-8 prose prose-lg max-w-none dark:prose-invert">
              <div
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(landingPage.custom_content, {
                    ALLOWED_TAGS: ['iframe', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'b', 'i', 'img'],
                    ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'href', 'target', 'class', 'style', 'alt'],
                    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                  })
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Join the DadderUp Community?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your journey to becoming a better father with daily
              challenges, community support, and personal growth.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="text-lg px-8"
              >
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/plans")}
                className="text-lg px-8"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} DadderUp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
