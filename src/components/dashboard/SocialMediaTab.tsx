import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Music, Video, Camera } from "lucide-react";

const socialMediaPlatforms = [
  {
    name: "Discord",
    description: "Join our community for real-time chat with other dads",
    icon: MessageCircle,
    url: "https://discord.gg/KBVvhkP3EE",
    color: "bg-[#5865F2] hover:bg-[#4752C4]"
  },
  {
    name: "YouTube",
    description: "Watch our latest videos and podcast episodes",
    icon: Video,
    url: "https://www.youtube.com/@dadderup",
    color: "bg-red-600 hover:bg-red-700"
  },
  {
    name: "TikTok",
    description: "Quick parenting tips and dad life content",
    icon: Music,
    url: "https://www.tiktok.com/@dadderup",
    color: "bg-black hover:bg-gray-800"
  },
  {
    name: "Instagram",
    description: "Daily inspiration and behind-the-scenes content",
    icon: Camera,
    url: "https://www.instagram.com/dadderup/",
    color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
  },
  {
    name: "Facebook",
    description: "Connect with our Facebook community",
    icon: ExternalLink,
    url: "https://www.facebook.com/share/176SvECSFT/?mibextid=wwXIfr",
    color: "bg-blue-600 hover:bg-blue-700"
  }
];

export const SocialMediaTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Follow DadderUp on Social Media</h3>
        <p className="text-muted-foreground">
          Stay connected and join our community across all platforms
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {socialMediaPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <Card key={platform.name} className="border-card-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${platform.color.includes('gradient') ? platform.color : `${platform.color.split(' ')[0]} text-white`}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-lg">{platform.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">
                  {platform.description}
                </p>
                <Button 
                  className={`w-full ${platform.color} text-white`}
                  onClick={() => window.open(platform.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Follow on {platform.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
          <h4 className="font-semibold mb-2">Why Follow Us?</h4>
          <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
            <div>📚 <strong>Daily Tips:</strong> Get practical parenting advice</div>
            <div>🎥 <strong>Exclusive Content:</strong> Behind-the-scenes and bonus material</div>
            <div>👥 <strong>Community:</strong> Connect with other dads worldwide</div>
          </div>
        </div>
      </div>
    </div>
  );
};