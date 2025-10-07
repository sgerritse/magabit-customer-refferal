import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  step_order: number;
  is_active: boolean;
  enable_video_url?: boolean;
  video_url?: string;
  cta_buttons?: Array<{
    text: string;
    url: string;
    url_type: "internal" | "external" | "mark_complete";
    open_in_new_window?: boolean;
    color?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const useOnboardingSteps = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: steps, isLoading } = useQuery({
    queryKey: ["onboarding-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .select("*")
        .eq("is_active", true)
        .order("step_order", { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(step => ({
        ...step,
        cta_buttons: (step.cta_buttons as any) || [],
      })) as OnboardingStep[];
    },
  });

  const createStep = useMutation({
    mutationFn: async (step: Omit<OnboardingStep, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .insert(step)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({
        title: "Success",
        description: "Onboarding step created successfully",
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

  const updateStep = useMutation({
    mutationFn: async ({ id, ...step }: Partial<OnboardingStep> & { id: string }) => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .update(step)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({
        title: "Success",
        description: "Onboarding step updated successfully",
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

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("onboarding_steps")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({
        title: "Success",
        description: "Onboarding step deleted successfully",
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

  const reorderSteps = useMutation({
    mutationFn: async (steps: { id: string; step_order: number }[]) => {
      const updates = steps.map(({ id, step_order }) =>
        supabase
          .from("onboarding_steps")
          .update({ step_order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({
        title: "Success",
        description: "Steps reordered successfully",
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

  // Fetch user's progress on onboarding steps
  const { data: userProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ["user-onboarding-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_onboarding_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mark step as complete
  const markStepComplete = useMutation({
    mutationFn: async (stepId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_onboarding_progress")
        .upsert({
          user_id: user.id,
          onboarding_step_id: stepId,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-onboarding-progress", user?.id] });
      toast({
        title: "Progress saved",
        description: "Step marked as complete!",
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

  // Check if a step is completed
  const isStepCompleted = (stepId: string) => {
    return userProgress?.some(
      (progress) => progress.onboarding_step_id === stepId && progress.completed
    ) || false;
  };

  return {
    steps: steps || [],
    isLoading,
    userProgress: userProgress || [],
    isProgressLoading,
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
    markStepComplete,
    isStepCompleted,
  };
};