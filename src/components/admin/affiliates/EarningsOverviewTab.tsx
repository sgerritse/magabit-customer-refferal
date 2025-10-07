import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, TrendingUp, Users } from "lucide-react";

export const EarningsOverviewTab = () => {
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalAmbassadors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: earningsData } = await supabase
      .from("ambassador_earnings")
      .select("amount, status, user_id");

    const totalPending = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
    const totalApproved = earningsData?.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
    const totalPaid = earningsData?.filter(e => e.status === 'paid').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
    const uniqueUsers = new Set(earningsData?.map(e => e.user_id)).size;

    setStats({
      totalPending,
      totalApproved,
      totalPaid,
      totalAmbassadors: uniqueUsers
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ambassadors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAmbassadors}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalPending.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved (Unpaid)</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalApproved.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalPaid.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};
