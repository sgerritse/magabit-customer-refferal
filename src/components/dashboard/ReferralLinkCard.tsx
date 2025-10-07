import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share2, Facebook, Twitter, Linkedin, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ReferralLink } from "@/hooks/useReferralLinks";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReferralLinkCardProps {
  link: ReferralLink;
  onUpdateNotifications: (notifications: ReferralLink['notifications_enabled']) => void;
}

export const ReferralLinkCard = ({ link, onUpdateNotifications }: ReferralLinkCardProps) => {
  const [copied, setCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<'facebook' | 'twitter' | 'linkedin' | 'email' | 'whatsapp' | 'messenger'>('facebook');

  const linkTypeLabels = {
    'main': 'Main Referral Link',
    'shop': 'Shop Link',
    'waitlist-a': 'Waitlist A',
    'waitlist-b': 'Waitlist B'
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link.full_url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareMessage = () => {
    const messages = {
      facebook: `Hey friends! I'm loving DadderUp - an amazing community helping dads level up their parenting game. 👨‍👧‍👦 Whether you're a new dad or experienced father, this community has incredible challenges, support, and resources. Check it out and join me!`,
      twitter: `Just joined @DadderUp - the #1 community for dads who want to level up! 💪 Daily challenges, supportive community, and real growth. Join me: ${link.full_url} #DadLife #Parenting #FatheringWithPurpose`,
      linkedin: `As a father, I'm constantly looking for ways to improve and grow - both personally and as a parent. I recently discovered DadderUp, and it's been a game-changer for my parenting journey.\n\nWhat I love:\n✅ Daily challenges that push me to be better\n✅ Supportive community of like-minded dads\n✅ Practical advice and resources\n✅ Accountability and growth\n\nIf you're a father looking to level up your parenting game, I highly recommend checking it out: ${link.full_url}`,
      email: `Subject: Join Me on DadderUp - A Community for Dads\n\nHey there!\n\nI wanted to share something that's been really helpful for me as a dad - DadderUp.\n\nIt's a community focused on helping fathers grow, connect, and become the best dads they can be. They have daily challenges, a supportive community, and tons of resources.\n\nI think you'd really enjoy it. Check it out here:\n${link.full_url}\n\nLet me know what you think!\n\nCheers`,
      whatsapp: `Hey! 👋 Check out DadderUp - an awesome community for dads who want to level up their parenting game! 👨‍👧‍👦 I've been using it and it's been super helpful. Join me: ${link.full_url}`,
      messenger: `Hey! I found this great community called DadderUp for dads looking to grow and improve. Really helpful challenges and support. You should check it out! ${link.full_url}`
    };
    return messages[sharePlatform];
  };

  const shareNow = () => {
    const message = getShareMessage();
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.full_url)}&quote=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link.full_url)}`,
      email: `mailto:?subject=Join Me on DadderUp&body=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link.full_url)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(window.location.href)}`
    };
    
    if (sharePlatform === 'messenger') {
      navigator.clipboard.writeText(link.full_url);
      toast.info("Link copied! Open Messenger and paste it to share.");
      return;
    }
    
    window.open(urls[sharePlatform], '_blank', 'width=600,height=400');
  };

  return (
    <>
      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{linkTypeLabels[link.link_type]}</span>
            <Button size="sm" variant="outline" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Display */}
          <div className="space-y-2">
            <Label>Your Referral Link</Label>
            <div className="flex gap-2">
              <Input value={link.full_url} readOnly className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Total Clicks</Label>
              <p className="text-2xl font-bold">{link.clicks_count}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Conversions</Label>
              <p className="text-2xl font-bold">{link.conversions_count}</p>
            </div>
          </div>

          {link.last_click_at && (
            <p className="text-xs text-muted-foreground">
              Last click: {format(new Date(link.last_click_at), 'PPp')}
            </p>
          )}

          {/* Notification Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Notification Preferences</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor={`push-${link.id}`} className="text-sm font-normal">Push</Label>
              <Switch 
                id={`push-${link.id}`}
                checked={link.notifications_enabled.push}
                onCheckedChange={(checked) => onUpdateNotifications({ ...link.notifications_enabled, push: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`sms-${link.id}`} className="text-sm font-normal">SMS</Label>
              <Switch 
                id={`sms-${link.id}`}
                checked={link.notifications_enabled.sms}
                onCheckedChange={(checked) => onUpdateNotifications({ ...link.notifications_enabled, sms: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`email-${link.id}`} className="text-sm font-normal">Email</Label>
              <Switch 
                id={`email-${link.id}`}
                checked={link.notifications_enabled.email}
                onCheckedChange={(checked) => onUpdateNotifications({ ...link.notifications_enabled, email: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={sharePlatform === 'facebook' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('facebook')}
                className="flex-col h-auto py-4"
              >
                <Facebook className="w-6 h-6 mb-1" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant={sharePlatform === 'twitter' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('twitter')}
                className="flex-col h-auto py-4"
              >
                <Twitter className="w-6 h-6 mb-1" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant={sharePlatform === 'linkedin' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('linkedin')}
                className="flex-col h-auto py-4"
              >
                <Linkedin className="w-6 h-6 mb-1" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant={sharePlatform === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('whatsapp')}
                className="flex-col h-auto py-4"
              >
                <MessageCircle className="w-6 h-6 mb-1" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant={sharePlatform === 'messenger' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('messenger')}
                className="flex-col h-auto py-4"
              >
                <Send className="w-6 h-6 mb-1" />
                <span className="text-xs">Messenger</span>
              </Button>
              <Button
                variant={sharePlatform === 'email' ? 'default' : 'outline'}
                onClick={() => setSharePlatform('email')}
                className="flex-col h-auto py-4"
              >
                <Mail className="w-6 h-6 mb-1" />
                <span className="text-xs">Email</span>
              </Button>
            </div>

            <div className="p-4 bg-card text-card-foreground rounded-lg border">
              <Label className="text-xs text-muted-foreground mb-2 block">Message Preview</Label>
              <p className="text-sm whitespace-pre-line">{getShareMessage()}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(getShareMessage());
                  toast.success("Message copied!");
                }}
              >
                Copy Message
              </Button>
              <Button className="flex-1" onClick={shareNow}>
                Share Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
