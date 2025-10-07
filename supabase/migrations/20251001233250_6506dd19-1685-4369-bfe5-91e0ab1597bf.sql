-- Create table for Stripe API credentials
CREATE TABLE IF NOT EXISTS public.stripe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_secret_key TEXT,
  stripe_publishable_key TEXT,
  webhook_secret TEXT,
  enabled BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stripe_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage Stripe settings
CREATE POLICY "Admins can view stripe settings"
  ON public.stripe_settings
  FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert stripe settings"
  ON public.stripe_settings
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update stripe settings"
  ON public.stripe_settings
  FOR UPDATE
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Trigger to update updated_at
CREATE TRIGGER update_stripe_settings_updated_at
  BEFORE UPDATE ON public.stripe_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for WooCommerce API credentials
CREATE TABLE IF NOT EXISTS public.woocommerce_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url TEXT NOT NULL,
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.woocommerce_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage WooCommerce settings
CREATE POLICY "Admins can view woocommerce settings"
  ON public.woocommerce_settings
  FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert woocommerce settings"
  ON public.woocommerce_settings
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update woocommerce settings"
  ON public.woocommerce_settings
  FOR UPDATE
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Trigger to update updated_at
CREATE TRIGGER update_woocommerce_settings_updated_at
  BEFORE UPDATE ON public.woocommerce_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();