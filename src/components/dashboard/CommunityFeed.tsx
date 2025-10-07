import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageCircle, Youtube, Share2 } from "lucide-react";
import { CommunityPosts } from "./CommunityPosts";
import { DiscordTab } from "./DiscordTab";
import { YouTubeTab } from "./YouTubeTab";
import { SocialMediaTab } from "./SocialMediaTab";

export const CommunityFeed = () => {
  return (
    <section data-section="community-feed">
      <Card className="card-gradient border-card-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <span>DadderUp Community Hub</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="examples" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="examples" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Examples</span>
              </TabsTrigger>
              <TabsTrigger 
                value="social-media" 
                data-tab="social-media"
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="discord" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Community Chat</span>
              </TabsTrigger>
              <TabsTrigger value="podcast" className="flex items-center space-x-2">
                <Youtube className="w-4 h-4" />
                <span className="hidden sm:inline">Podcast</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="examples" className="mt-6">
              <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
                <CommunityPosts day={1} />
              </div>
            </TabsContent>
            
            <TabsContent value="social-media" className="mt-6">
              <SocialMediaTab />
            </TabsContent>
            
            <TabsContent value="discord" className="mt-6">
              <DiscordTab />
            </TabsContent>
            
            <TabsContent value="podcast" className="mt-6">
              <YouTubeTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};