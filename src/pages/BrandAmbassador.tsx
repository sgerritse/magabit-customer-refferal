import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Share2, TrendingUp, Users, DollarSign, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data
const mockReferralLinks = [
  { 
    id: '1', 
    type: 'Main', 
    code: 'DEMO123', 
    url: 'https://dadderup.com/ref/DEMO123',
    clicks: 847,
    conversions: 25
  },
  { 
    id: '2', 
    type: 'Shop', 
    code: 'SHOP456', 
    url: 'https://shop.dadderup.com/ref/SHOP456',
    clicks: 312,
    conversions: 10
  },
  { 
    id: '3', 
    type: 'Landing', 
    code: 'LAND789', 
    url: 'https://dadderup.com/ambassador/demo',
    clicks: 88,
    conversions: 3
  }
];

const mockStats = {
  totalClicks: 1247,
  totalConversions: 38,
  conversionRate: 3.0,
  totalEarnings: 456.78
};

const mockRecentActivity = [
  { id: '1', date: '2 days ago', linkType: 'Main', clicks: 15, status: 'Converted' },
  { id: '2', date: '3 days ago', linkType: 'Shop', clicks: 8, status: 'Pending' },
  { id: '3', date: '5 days ago', linkType: 'Main', clicks: 23, status: 'Converted' },
  { id: '4', date: '1 week ago', linkType: 'Landing', clicks: 12, status: 'Pending' },
  { id: '5', date: '1 week ago', linkType: 'Shop', clicks: 19, status: 'Converted' },
];

const BrandAmbassador = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">DadderUp</h1>
              <p className="text-muted-foreground mt-1">Brand Ambassador Demo</p>
            </div>
            <Badge variant="outline" className="bg-primary text-primary-foreground border-primary">
              Demo Mode
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Share DadderUp and Earn Commissions</h2>
          <p className="text-muted-foreground">Use your personalized referral links to track clicks, conversions, and earnings</p>
        </div>

        {/* Referral Links Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Links
            </CardTitle>
            <CardDescription>Share these links with your audience to earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockReferralLinks.map((link) => (
              <div key={link.id} className="p-4 border border-card-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{link.type}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {link.clicks} clicks · {link.conversions} conversions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono text-foreground">
                    {link.url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(link.url, link.id)}
                    className="shrink-0"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">{mockStats.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">{mockStats.totalConversions}</div>
              <p className="text-xs text-muted-foreground mt-1">Total signups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">{mockStats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Click to conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-card-foreground">${mockStats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time commissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest referral clicks and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Link Type</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-muted-foreground">{activity.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.linkType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.clicks}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={activity.status === 'Converted' ? 'default' : 'secondary'}
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>This is a static demonstration of the Brand Ambassador feature</p>
        </div>
      </footer>
    </div>
  );
};

export default BrandAmbassador;
