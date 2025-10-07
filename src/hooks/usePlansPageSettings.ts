import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PlansPageSettings {
  id: string;
  video_url: string | null;
  video_heading: string | null;
  show_video: boolean;
  video_description: string | null;
  enable_delay: boolean;
  delay_seconds: number;
  enable_cta_button: boolean;
  cta_button_text: string | null;
  created_at: string;
  updated_at: string;
}

export const usePlansPageSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["plans-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans_page_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PlansPageSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<PlansPageSettings>) => {
      const { data: existing } = await supabase
        .from("plans_page_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        throw new Error("Plans page settings not found. Please contact support.");
      }

      const { data, error } = await supabase
        .from("plans_page_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-page-settings"] });
      toast({
        title: "Success",
        description: "Plans page settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
};
