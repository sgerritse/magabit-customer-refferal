import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LoadingWidgetSettings {
  logo_url: string;
  logo_size: number;
  bg_color: string;
  text_color: string;
  spinner_color: string;
  loading_text: string;
}

export interface ThemeSettings {
  id: string;
  theme_name: string;
  light_theme: Record<string, string>;
  dark_theme: Record<string, string>;
  loading_widget_settings: LoadingWidgetSettings;
  updated_at: string;
  updated_by: string | null;
}

export const useThemeSettings = () => {
  const queryClient = useQueryClient();

  // Fetch theme settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["theme-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("theme_name", "default")
        .maybeSingle();

      if (error) throw error;
      
      // Cast the data with proper type handling for loading_widget_settings
      if (data) {
        return {
          ...data,
          loading_widget_settings: data.loading_widget_settings as unknown as LoadingWidgetSettings,
        } as ThemeSettings;
      }
      return null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update theme settings
  const updateSettings = useMutation({
    mutationFn: async (updates: {
      light_theme?: Record<string, string>;
      dark_theme?: Record<string, string>;
      loading_widget_settings?: LoadingWidgetSettings;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("theme_settings")
        .update({
          ...updates,
          // Cast loading_widget_settings to satisfy Supabase's Json type
          ...(updates.loading_widget_settings && {
            loading_widget_settings: updates.loading_widget_settings as any
          }),
          updated_by: userData.user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("theme_name", "default")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme-settings"] });
      toast({
        title: "Success",
        description: "Theme settings saved successfully",
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
    error,
    updateSettings,
  };
};
