import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AmbassadorEarning {
  id: string;
  user_id: string;
  amount: number;
  commission_rate: number;
  commission_type: 'percentage' | 'flat';
  product_id: string | null;
  subscription_id: string | null;
  status: 'pending' | 'approved' | 'paid' | 'reversed';
  earned_at: string;
  tier_at_earning: string | null;
}

export interface AmbassadorStats {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalConversions: number;
  totalClicks: number;
  currentTier: 'bronze' | 'silver' | 'gold';
}

export const useAmbassadorEarnings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["ambassador-earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("ambassador_earnings")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as AmbassadorEarning[];
    },
    enabled: !!user?.id,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["ambassador-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get earnings summary
      const { data: earningsData } = await supabase
        .from("ambassador_earnings")
        .select("amount, status")
        .eq("user_id", user.id);

      const totalEarnings = earningsData?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const availableBalance = earningsData?.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const pendingBalance = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;

      // Get visit stats
      const { data: visitsData } = await supabase
        .from("referral_visits")
        .select("converted")
        .eq("referrer_user_id", user.id);

      const totalClicks = visitsData?.length || 0;
      const totalConversions = visitsData?.filter(v => v.converted).length || 0;

      // Get tier
      const { data: tierData } = await supabase
        .from("ambassador_tiers")
        .select("current_tier")
        .eq("user_id", user.id)
        .single();

      return {
        totalEarnings,
        availableBalance,
        pendingBalance,
        totalConversions,
        totalClicks,
        currentTier: (tierData?.current_tier || 'bronze') as 'bronze' | 'silver' | 'gold'
      } as AmbassadorStats;
    },
    enabled: !!user?.id,
  });

  // Request payout
  const requestPayout = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check payout method
      const { data: payoutMethod } = await supabase
        .from("ambassador_payout_methods")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!payoutMethod || !payoutMethod.payout_method) {
        throw new Error("Please set up your payout method first");
      }

      const { error } = await supabase
        .from("ambassador_payouts")
        .insert({
          user_id: user.id,
          amount,
          payout_method: payoutMethod.payout_method,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambassador-stats", user?.id] });
      toast.success("Payout requested successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    earnings: earnings || [],
    stats,
    earningsLoading,
    statsLoading,
    requestPayout
  };
};
