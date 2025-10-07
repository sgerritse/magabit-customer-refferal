import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, MapPin, Crown } from "lucide-react";

export const DiscordTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-10 h-10 text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Join the DadderUp Discord Community</h3>
        <p className="text-muted-foreground mb-6">
          Connect with other dads in real-time and become part of our growing community
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">Real-Time Chat</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Chat with other dads instantly, share experiences, and get advice when you need it most.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <MessageCircle className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">Fatherhood Topics</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Discuss parenting challenges, celebrate wins, and learn from experienced fathers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">Nationwide Chapters</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Join local chapters and meet other dads in your area for in-person connections.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Crown className="w-5 h-5 text-accent" />
              <h4 className="font-semibold">Exclusive Access</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Get early access to new challenges, special events, and community initiatives.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 text-lg font-semibold"
          onClick={() => window.open('https://discord.gg/KBVvhkP3EE', '_blank')}
        >
          Join Discord Community
        </Button>
      </div>
    </div>
  );
};