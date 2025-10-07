import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  trial_days: number;
  trial_price: number;
  regular_price: number | null;
  stripe_price_id: string | null;
  woocommerce_product_id: string | null;
  is_active: boolean;
  show_on_plans_page: boolean;
  features: string[];
}

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_plans_page', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as Package[];
    },
  });
};

export const useAllPackages = () => {
  return useQuery({
    queryKey: ['all-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Package[];
    },
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, userId }: { packageId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          package_id: packageId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });
};
