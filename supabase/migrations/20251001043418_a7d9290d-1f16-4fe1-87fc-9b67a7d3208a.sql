-- Create packages table
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  billing_period text NOT NULL, -- 'trial', 'monthly', 'yearly'
  trial_days integer DEFAULT 0,
  trial_price numeric(10,2) DEFAULT 0,
  regular_price numeric(10,2), -- Original price before discount
  stripe_price_id text, -- Stripe Price ID
  woocommerce_product_id text, -- WooCommerce Product ID
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
  ON public.packages
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage packages
CREATE POLICY "Admins can insert packages"
  ON public.packages
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update packages"
  ON public.packages
  FOR UPDATE
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete packages"
  ON public.packages
  FOR DELETE
  USING (get_current_user_role() = 'admin');

-- Create user_subscriptions table to track user package selections
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.packages(id),
  status text NOT NULL DEFAULT 'pending', -- pending, active, cancelled, expired
  stripe_subscription_id text,
  woocommerce_subscription_id text,
  trial_ends_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (get_current_user_role() = 'admin');

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default packages
INSERT INTO public.packages (name, description, price, billing_period, trial_days, trial_price, regular_price, features) VALUES
  ('7-Day Trial', '7-day trial for $1, then $99/month', 99.00, 'monthly', 7, 1.00, 199.00, '["Access to all features", "7-day trial period", "Upgrades to monthly after trial"]'::jsonb),
  ('Monthly Plan', 'Monthly subscription', 99.00, 'monthly', 0, 0, 199.00, '["Access to all features", "Monthly billing", "Cancel anytime"]'::jsonb),
  ('Yearly Plan', 'Yearly subscription with savings', 829.00, 'yearly', 0, 0, 2388.00, '["Access to all features", "Yearly billing", "Best value", "Save over 30%"]'::jsonb);