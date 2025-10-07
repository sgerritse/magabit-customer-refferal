import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

interface ReferralVisitsFilters {
  dateRange: number; // days back
  linkType?: string;
  converted?: boolean | null;
  page?: number;
  pageSize?: number;
}

export interface ReferralVisitWithLink {
  id: string;
  visited_at: string;
  ip_address_hash: string | null;
  user_agent_truncated: string | null;
  converted: boolean;
  link_type: string;
  country_code: string | null;
  state_code: string | null;
}

export const useReferralVisits = (filters: ReferralVisitsFilters) => {
  return useQuery({
    queryKey: ["referral-visits", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDate = subDays(new Date(), filters.dateRange).toISOString();
      const offset = ((filters.page || 1) - 1) * (filters.pageSize || 20);

      // Join with referral_links to get link_type
      let query = supabase
        .from("referral_visits")
        .select(`
          id,
          visited_at,
          ip_address_hash,
          user_agent_truncated,
          converted,
          country_code,
          state_code,
          referral_links!inner(link_type)
        `, { count: "exact" })
        .eq("referrer_user_id", user.id)
        .gte("visited_at", startDate)
        .order("visited_at", { ascending: false });

      if (filters.linkType && filters.linkType !== "all") {
        query = query.eq("referral_links.link_type", filters.linkType);
      }

      if (filters.converted !== null && filters.converted !== undefined) {
        query = query.eq("converted", filters.converted);
      }

      query = query.range(offset, offset + (filters.pageSize || 20) - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Transform the data to flatten the link_type
      const transformedData = (data || []).map((visit: any) => ({
        id: visit.id,
        visited_at: visit.visited_at,
        ip_address_hash: visit.ip_address_hash,
        user_agent_truncated: visit.user_agent_truncated,
        converted: visit.converted,
        link_type: visit.referral_links?.link_type || "unknown",
        country_code: visit.country_code,
        state_code: visit.state_code,
      })) as ReferralVisitWithLink[];

      return {
        visits: transformedData,
        totalCount: count || 0,
        currentPage: filters.page || 1,
        pageSize: filters.pageSize || 20,
      };
    },
  });
};
