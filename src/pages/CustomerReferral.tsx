import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Share2, TrendingUp, Users, DollarSign, Copy, Check, Facebook, Linkedin, Mail, MessageCircle } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Mock data
const mockReferralLinks = [{
  id: '1',
  type: 'MAGAbit+ Fractional',
  price: '$1,200.00',
  commission: '$120.00',
  url: 'https://magabit.net/username/shop/magabit-fractional',
  clicks: 547,
  conversions: 18
}, {
  id: '2',
  type: 'MAGAbit+ Pro',
  price: '$12,000.00',
  commission: '$1,200.00',
  url: 'https://magabit.net/username/shop/magabit-pro-plus',
  clicks: 312,
  conversions: 8
}];
const mockStats = {
  totalClicks: 859,
  totalConversions: 26,
  conversionRate: 3.0,
  totalEarnings: 117600.00
};
const mockRecentActivity = [{
  id: '1',
  date: '2 days ago',
  linkType: 'MAGAbit+ Fractional',
  clicks: 15,
  status: 'Converted'
}, {
  id: '2',
  date: '3 days ago',
  linkType: 'MAGAbit+ Pro',
  clicks: 8,
  status: 'Pending'
}, {
  id: '3',
  date: '5 days ago',
  linkType: 'MAGAbit+ Fractional',
  clicks: 23,
  status: 'Converted'
}, {
  id: '4',
  date: '1 week ago',
  linkType: 'MAGAbit+ Pro',
  clicks: 12,
  status: 'Converted'
}, {
  id: '5',
  date: '1 week ago',
  linkType: 'MAGAbit+ Fractional',
  clicks: 19,
  status: 'Pending'
}];
const CustomerReferral = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharePreview, setSharePreview] = useState<{
    platform: string;
    message: string;
    url: string;
    linkType: string;
  } | null>(null);
  const [editedMessage, setEditedMessage] = useState<string>('');
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard"
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (url: string, linkType: string, platform: string, price: string, commission: string) => {
    let message = '';
    
    switch (platform) {
      case 'x':
        message = `⚡ Start mining real Bitcoin with MAGAbit! ${linkType} package - Trusted U.S.-based mining infrastructure. Bitcoin delivered directly to your wallet: ${url}`;
        break;
      case 'facebook':
        message = `⚡ Start mining real Bitcoin with MAGAbit! I'm using the ${linkType} package for trusted U.S.-based mining infrastructure. Real BTC delivered directly to your own wallet—no waiting, no middlemen. Join a community of Independent Bitcoin Owners!\n\n${url}`;
        break;
      case 'linkedin':
        message = `I've discovered MAGAbit's ${linkType} package for Bitcoin mining. It's a community of Independent Bitcoin Owners with trusted U.S.-based mining infrastructure. Real Bitcoin delivered directly to your own wallet with full ownership from day one. Worth checking out!\n\n${url}`;
        break;
      case 'whatsapp':
        message = `⚡ Start mining real Bitcoin with MAGAbit's ${linkType} package! Join a community of Independent Bitcoin Owners. Real BTC delivered directly to your wallet—no waiting, no middlemen: ${url}`;
        break;
      case 'email':
        message = `Hi!\n\nI wanted to share an amazing Bitcoin mining opportunity with you through MAGAbit.\n\nMAGAbit is a community of Independent Bitcoin Owners earning real BTC through trusted U.S.-based mining infrastructure. The ${linkType} package at ${price} delivers real Bitcoin directly to your own wallet—no waiting, no middlemen.\n\nYou'll have full ownership and control of your Bitcoin from day one.\n\nCheck it out here: ${url}\n\nLet me know if you have any questions about mining Bitcoin with MAGAbit!\n\nBest regards`;
        break;
    }

    setSharePreview({ platform, message, url, linkType });
    setEditedMessage(message);
  };

  const confirmShare = () => {
    if (!sharePreview || !editedMessage.trim()) return;

    const { platform, url } = sharePreview;
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(url);

    switch (platform) {
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(editedMessage)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(editedMessage)}`;
        break;
      case 'email':
        const subject = encodeURIComponent(`Start Mining Bitcoin with MAGAbit - ${sharePreview.linkType}`);
        shareUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(editedMessage)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setSharePreview(null);
    
    toast({
      title: "Shared successfully!",
      description: `Your referral link has been shared on ${platform === 'x' ? 'X' : platform}.`,
    });
  };
  return <div className="min-h-screen customer-referral-bg">
      {/* Header */}
      <header className="border-b border-border bg-card">
        
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Section */}
        <div className="text-center space-y-2">
          
          
        </div>

        {/* Referral Links Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Customer Referral Links
            </CardTitle>
            <CardDescription>Share these links with your audience to earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockReferralLinks.map(link => <div key={link.id} className="p-4 border border-border rounded-lg bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-medium">{link.type}</Badge>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">{link.price}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-300">
                        <span className="text-sm font-semibold text-green-700">{link.commission}</span>
                        <span className="text-xs text-green-600">commission</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {link.clicks} clicks · {link.conversions} conversions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded text-sm font-mono text-gray-900 bg-slate-100">
                    {link.url}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => handleCopyLink(link.url, link.id)} className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    {copiedId === link.id ? <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </> : <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>}
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground">Share on:</span>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleShare(link.url, link.type, 'facebook', link.price, link.commission)} className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(link.url, link.type, 'x', link.price, link.commission)} className="h-9 w-9 p-0 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600">
                      <XIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(link.url, link.type, 'linkedin', link.price, link.commission)} className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(link.url, link.type, 'whatsapp', link.price, link.commission)} className="h-9 w-9 p-0 hover:bg-green-50 hover:border-green-400 hover:text-green-600">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(link.url, link.type, 'email', link.price, link.commission)} className="h-9 w-9 p-0 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockStats.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockStats.totalConversions}</div>
              <p className="text-xs text-muted-foreground mt-1">Total purchases</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockStats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Click to conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest referral clicks and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentActivity.map(activity => <TableRow key={activity.id}>
                    <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{activity.linkType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.clicks}</TableCell>
                    <TableCell>
                      <Badge className={activity.status === 'Converted' ? 'bg-success text-success-foreground hover:bg-success/90' : 'bg-accent text-accent-foreground hover:bg-accent/90'}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      
      {/* Share Preview Dialog */}
      <Dialog open={!!sharePreview} onOpenChange={() => setSharePreview(null)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sharePreview?.platform === 'x' && <XIcon className="h-5 w-5" />}
              {sharePreview?.platform === 'facebook' && <Facebook className="h-5 w-5" />}
              {sharePreview?.platform === 'linkedin' && <Linkedin className="h-5 w-5" />}
              {sharePreview?.platform === 'whatsapp' && <MessageCircle className="h-5 w-5" />}
              {sharePreview?.platform === 'email' && <Mail className="h-5 w-5" />}
              Share on {sharePreview?.platform === 'x' ? 'X' : sharePreview?.platform.charAt(0).toUpperCase() + sharePreview?.platform.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Preview your message before sharing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Edit your message:</h4>
              <Textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="min-h-[150px] font-sans"
                placeholder="Enter your message..."
              />
              {sharePreview?.platform === 'x' ? (
                <p className={`text-xs mt-2 font-medium ${
                  editedMessage.length > 280 
                    ? 'text-red-600' 
                    : editedMessage.length > 260 
                    ? 'text-yellow-600' 
                    : 'text-muted-foreground'
                }`}>
                  {editedMessage.length > 280 && '❌ '}
                  {editedMessage.length > 260 && editedMessage.length <= 280 && '⚠ '}
                  {editedMessage.length} / 280 characters
                  {editedMessage.length > 280 && ' - Message too long'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  {editedMessage.length} characters
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSharePreview(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmShare}
              disabled={sharePreview?.platform === 'x' && editedMessage.length > 280}
            >
              Share Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default CustomerReferral;