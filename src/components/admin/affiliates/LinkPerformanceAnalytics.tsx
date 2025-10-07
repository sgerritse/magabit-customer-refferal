import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, MousePointerClick, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LinkPerformance {
  link_type: string;
  clicks: number;
  conversions: number;
  conversion_rate: number;
  total_earnings: number;
  avg_conversion_value: number;
}

interface TopPerformer {
  user_id: string;
  display_name: string;
  link_type: string;
  conversions: number;
  earnings: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const LinkPerformanceAnalytics = () => {
  const [linkPerformance, setLinkPerformance] = useState<LinkPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Get all referral visits with link information
    const { data: visits } = await supabase
      .from("referral_visits")
      .select(`
        converted,
        conversion_value,
        referrer_user_id,
        referral_link_id,
        referral_links!inner(link_type)
      `);

    // Calculate performance by link type
    const performanceMap = visits?.reduce((acc: any, visit: any) => {
      const type = visit.referral_links?.link_type || 'unknown';
      if (!acc[type]) {
        acc[type] = {
          link_type: type,
          clicks: 0,
          conversions: 0,
          total_earnings: 0,
        };
      }
      acc[type].clicks++;
      if (visit.converted) {
        acc[type].conversions++;
        acc[type].total_earnings += parseFloat(visit.conversion_value?.toString() || '0');
      }
      return acc;
    }, {});

    const performance = Object.values(performanceMap || {}).map((perf: any) => ({
      ...perf,
      conversion_rate: perf.clicks > 0 ? (perf.conversions / perf.clicks) * 100 : 0,
      avg_conversion_value: perf.conversions > 0 ? perf.total_earnings / perf.conversions : 0,
    })) as LinkPerformance[];

    setLinkPerformance(performance.sort((a, b) => b.conversion_rate - a.conversion_rate));

    // Get top performers
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    const performerMap = visits?.reduce((acc: any, visit: any) => {
      if (!visit.converted) return acc;
      
      const linkType = visit.referral_links?.link_type || 'unknown';
      const key = `${visit.referrer_user_id}-${linkType}`;
      if (!acc[key]) {
        acc[key] = {
          user_id: visit.referrer_user_id,
          link_type: linkType,
          conversions: 0,
          earnings: 0,
        };
      }
      acc[key].conversions++;
      acc[key].earnings += parseFloat(visit.conversion_value?.toString() || '0');
      return acc;
    }, {});

    const performers = Object.values(performerMap || {})
      .map((p: any) => ({
        ...p,
        display_name: profilesData?.find(prof => prof.user_id === p.user_id)?.display_name || 'Unknown',
      }))
      .sort((a: any, b: any) => b.conversions - a.conversions)
      .slice(0, 10) as TopPerformer[];

    setTopPerformers(performers);
    setLoading(false);
  };

  const formatLinkType = (type: string) => {
    const typeMap: Record<string, string> = {
      main: 'Main',
      shop: 'Shop',
      'waitlist-a': 'Waitlist A',
      'waitlist-b': 'Waitlist B',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Link Performance Analytics</h3>
        <p className="text-muted-foreground">Compare referral link performance across different link types</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {linkPerformance.reduce((sum, p) => sum + p.clicks, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {linkPerformance.reduce((sum, p) => sum + p.conversions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${linkPerformance.reduce((sum, p) => sum + p.total_earnings, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate by Link Type */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Link Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={linkPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="link_type" tickFormatter={formatLinkType} />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                labelFormatter={formatLinkType}
              />
              <Bar dataKey="conversion_rate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Link Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clicks Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={linkPerformance}
                  dataKey="clicks"
                  nameKey="link_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => formatLinkType(entry.link_type)}
                >
                  {linkPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {linkPerformance.map((perf, index) => (
                <div key={perf.link_type} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <p className="font-medium">{formatLinkType(perf.link_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {perf.clicks} clicks • {perf.conversions} conversions
                      </p>
                    </div>
                  </div>
                  <Badge>{perf.conversion_rate.toFixed(1)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Ambassadors by Link Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div key={`${performer.user_id}-${performer.link_type}`} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{performer.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatLinkType(performer.link_type)} • {performer.conversions} conversions
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">${performer.earnings.toFixed(2)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
