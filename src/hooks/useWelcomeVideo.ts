import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WelcomeVideoSettings {
  id: string;
  video_url: string | null;
  is_enabled: boolean;
  heading_text: string | null;
  created_at: string;
  updated_at: string;
}

export const useWelcomeVideo = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["welcome-video-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("welcome_video_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as WelcomeVideoSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<WelcomeVideoSettings>) => {
      // Get the existing record (should always exist due to default row)
      const { data: existing } = await supabase
        .from("welcome_video_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (!existing) {
        throw new Error("Welcome video settings not found. Please contact support.");
      }

      // Update existing record
      const { data, error } = await supabase
        .from("welcome_video_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-video-settings"] });
      toast({
        title: "Success",
        description: "Welcome video settings updated successfully",
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
