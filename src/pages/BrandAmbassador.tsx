import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Share2, TrendingUp, Users, DollarSign, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data
const mockReferralLinks = [{
  id: '1',
  type: 'MAGAbit+ Fractional',
  price: '$1,200.00',
  url: 'https://magabit.net/username/shop/magabit-fractional',
  clicks: 547,
  conversions: 18
}, {
  id: '2',
  type: 'MAGAbit+ Pro',
  price: '$12,000.00',
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
const BrandAmbassador = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard"
    });
    setTimeout(() => setCopiedId(null), 2000);
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        
      </header>

      {/* Main Content */}
      

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>This is a static demonstration of the MLM referral feature</p>
        </div>
      </footer>
    </div>;
};
export default BrandAmbassador;