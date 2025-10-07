import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PlanDisplayConfig {
  id: string;
  product_source: 'woocommerce' | 'internal';
  product_id: string;
  custom_title: string | null;
  custom_description: string | null;
  custom_features: string[];
  show_on_plans_page: boolean;
  display_order: number;
  is_active: boolean;
  last_synced_at: string | null;
  original_data: any;
  created_at: string;
  updated_at: string;
}

export const usePlanDisplayConfigs = () => {
  return useQuery({
    queryKey: ['plan-display-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_display_configs')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as PlanDisplayConfig[];
    },
  });
};

export const useVisiblePlans = () => {
  return useQuery({
    queryKey: ['visible-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_display_configs')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_plans_page', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as PlanDisplayConfig[];
    },
  });
};

export const useCreatePlanConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<PlanDisplayConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('plan_display_configs')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-display-configs'] });
      queryClient.invalidateQueries({ queryKey: ['visible-plans'] });
      toast({
        title: 'Success',
        description: 'Plan configuration created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePlanConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlanDisplayConfig> }) => {
      const { data, error } = await supabase
        .from('plan_display_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-display-configs'] });
      queryClient.invalidateQueries({ queryKey: ['visible-plans'] });
      toast({
        title: 'Success',
        description: 'Plan configuration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePlanConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plan_display_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-display-configs'] });
      queryClient.invalidateQueries({ queryKey: ['visible-plans'] });
      toast({
        title: 'Success',
        description: 'Plan configuration deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};