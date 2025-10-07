import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WooCommerceProduct {
  id: number;
  parent_product_id: number | null;
  variation_id: number | null;
  name: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  price: string;
  currency: string;
  status: string;
  type: string;
  subscription_price: string;
  subscription_period: string;
  subscription_period_interval: string;
  subscription_length: string;
  subscription_sign_up_fee: string;
  subscription_trial_length: string;
  subscription_trial_period: string;
  billing_cycle: string;
  has_trial: boolean;
  trial_info: string;
  has_signup_fee: boolean;
  attributes?: Record<string, string>;
}

export const useWooCommerceProducts = () => {
  return useQuery({
    queryKey: ['woocommerce-products'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-woocommerce-products');

      if (error) throw error;
      return data as WooCommerceProduct[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};
