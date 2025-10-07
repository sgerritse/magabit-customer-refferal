import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export const useAmbassadorAnalytics = (daysBack: number = 30) => {
  return useQuery({
    queryKey: ["ambassador-analytics", daysBack],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDate = subDays(new Date(), daysBack).toISOString();
      const endDate = new Date().toISOString();

      // Call the database function
      const { data, error } = await supabase.rpc("get_ambassador_analytics", {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      const analyticsData = data as any;

      // Transform the data for recharts
      const visitsByDate = analyticsData?.visits_by_date?.map((item: any) => ({
        date: format(new Date(item.date), "MMM dd"),
        visits: item.visits,
        conversions: item.conversions,
      })) || [];

      const visitsByLinkType = analyticsData?.visits_by_link_type?.map((item: any) => ({
        name: item.link_type === "main" ? "Main" : 
              item.link_type === "shop" ? "Shop" : 
              item.link_type === "waitlist_a" ? "Waitlist A" : 
              item.link_type === "waitlist_b" ? "Waitlist B" : "Other",
        visits: item.visits,
        conversions: item.conversions,
      })) || [];

      return {
        totalClicks: analyticsData?.total_clicks || 0,
        totalConversions: analyticsData?.total_conversions || 0,
        totalEarnings: Number(analyticsData?.total_earnings) || 0,
        visitsByDate,
        visitsByLinkType,
      };
    },
  });
};
