import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTierProgress = () => {
  return useQuery({
    queryKey: ["tier-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch tier settings
      const { data: settings } = await supabase
        .from("affiliate_settings")
        .select("bronze_threshold, silver_threshold, gold_threshold, bronze_rate, silver_rate, gold_rate")
        .single();

      // Fetch current tier
      const { data: tierData } = await supabase
        .from("ambassador_tiers")
        .select("current_tier, monthly_conversions")
        .eq("user_id", user.id)
        .single();

      const currentTier = tierData?.current_tier || "bronze";
      const monthlyConversions = tierData?.monthly_conversions || 0;

      // Calculate progress
      const thresholds = {
        bronze: settings?.bronze_threshold || 0,
        silver: settings?.silver_threshold || 10,
        gold: settings?.gold_threshold || 25,
      };

      const rates = {
        bronze: settings?.bronze_rate || 30,
        silver: settings?.silver_rate || 35,
        gold: settings?.gold_rate || 40,
      };

      let nextTier: string | null = null;
      let conversionsNeeded = 0;
      let progress = 0;

      if (currentTier === "bronze") {
        nextTier = "silver";
        conversionsNeeded = Math.max(0, thresholds.silver - monthlyConversions);
        progress = Math.min(100, (monthlyConversions / thresholds.silver) * 100);
      } else if (currentTier === "silver") {
        nextTier = "gold";
        conversionsNeeded = Math.max(0, thresholds.gold - monthlyConversions);
        progress = Math.min(100, ((monthlyConversions - thresholds.silver) / (thresholds.gold - thresholds.silver)) * 100);
      } else {
        nextTier = null;
        progress = 100;
      }

      return {
        currentTier,
        monthlyConversions,
        nextTier,
        conversionsNeeded,
        progress,
        thresholds,
        rates,
      };
    },
  });
};
