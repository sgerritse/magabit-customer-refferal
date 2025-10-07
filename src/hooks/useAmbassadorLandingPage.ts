import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AmbassadorLandingPage {
  id: string;
  user_id: string;
  enabled: boolean;
  youtube_url: string | null;
  custom_content: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const useAmbassadorLandingPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch landing page
  const { data: landingPage, isLoading } = useQuery({
    queryKey: ["ambassador-landing-page", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("ambassador_landing_pages")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AmbassadorLandingPage | null;
    },
    enabled: !!user?.id,
  });

  // Save landing page
  const saveLandingPage = useMutation({
    mutationFn: async ({ enabled, youtube_url, custom_content }: { 
      enabled: boolean; 
      youtube_url: string; 
      custom_content: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("ambassador_landing_pages")
        .upsert({
          user_id: user.id,
          enabled,
          youtube_url: youtube_url || null,
          custom_content: custom_content || null,
          status: 'pending'
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambassador-landing-page", user?.id] });
      toast.success("Landing page saved! Awaiting approval.");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  return {
    landingPage,
    isLoading,
    saveLandingPage
  };
};
