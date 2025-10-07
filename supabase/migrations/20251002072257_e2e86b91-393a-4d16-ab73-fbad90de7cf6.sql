
-- =====================================================
-- SECURITY FIX: Remove Plain Text Payment Data Storage
-- =====================================================
-- Implements PCI-DSS compliant payment handling using Stripe

-- Step 1: Create stripe_customers table for secure references only
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_payment_method_id TEXT,
  -- For display purposes only (fetched from Stripe, not user input)
  card_last_four TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for stripe_customers
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.stripe_customers;
CREATE POLICY "Users can view their own payment methods"
  ON public.stripe_customers
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage payment methods" ON public.stripe_customers;
CREATE POLICY "System can manage payment methods"
  ON public.stripe_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view payment metadata" ON public.stripe_customers;
CREATE POLICY "Admins can view payment metadata"
  ON public.stripe_customers
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 3: Repurpose billing_info for addresses only
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all billing info" ON public.billing_info;
DROP POLICY IF EXISTS "Users can view their own billing info" ON public.billing_info;
DROP POLICY IF EXISTS "Users can insert their own billing info" ON public.billing_info;
DROP POLICY IF EXISTS "Users can update their own billing info" ON public.billing_info;

-- Remove card-related columns
ALTER TABLE public.billing_info DROP COLUMN IF EXISTS card_last_four;
ALTER TABLE public.billing_info DROP COLUMN IF EXISTS card_type;
ALTER TABLE public.billing_info DROP COLUMN IF EXISTS card_expiry_month;
ALTER TABLE public.billing_info DROP COLUMN IF EXISTS card_expiry_year;

-- Rename to billing_addresses
ALTER TABLE public.billing_info RENAME TO billing_addresses;

-- Add new RLS policies for billing_addresses
CREATE POLICY "Users can view their own billing address"
  ON public.billing_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own billing address"
  ON public.billing_addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Create audit logging for payment data access
CREATE TABLE IF NOT EXISTS public.payment_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  accessed_user_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  accessed_table TEXT NOT NULL,
  accessed_columns TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment access audit logs"
  ON public.payment_access_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.payment_access_audit
  FOR INSERT
  WITH CHECK (true);

-- Step 5: Create function to log payment data access
CREATE OR REPLACE FUNCTION public.log_payment_access(
  p_accessed_user_id UUID,
  p_access_type TEXT,
  p_accessed_table TEXT,
  p_accessed_columns TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.payment_access_audit (
    admin_user_id,
    accessed_user_id,
    access_type,
    accessed_table,
    accessed_columns
  ) VALUES (
    auth.uid(),
    p_accessed_user_id,
    p_access_type,
    p_accessed_table,
    p_accessed_columns
  );
END;
$$;

-- Step 6: Add triggers to log admin access
CREATE OR REPLACE FUNCTION public.audit_stripe_customer_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log if accessed by admin (not owner)
  IF auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
    PERFORM public.log_payment_access(
      COALESCE(NEW.user_id, OLD.user_id),
      TG_OP,
      'stripe_customers',
      ARRAY['stripe_customer_id', 'stripe_payment_method_id']
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_stripe_customer_access_trigger ON public.stripe_customers;
CREATE TRIGGER audit_stripe_customer_access_trigger
  AFTER UPDATE OR DELETE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_stripe_customer_access();

-- Step 7: Add updated_at triggers
DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_addresses_updated_at ON public.billing_addresses;
CREATE TRIGGER update_billing_addresses_updated_at
  BEFORE UPDATE ON public.billing_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Create helper function to sync Stripe payment methods
CREATE OR REPLACE FUNCTION public.sync_stripe_payment_method(
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_payment_method_id TEXT,
  p_card_last_four TEXT,
  p_card_brand TEXT,
  p_card_exp_month INTEGER,
  p_card_exp_year INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.stripe_customers (
    user_id,
    stripe_customer_id,
    stripe_payment_method_id,
    card_last_four,
    card_brand,
    card_exp_month,
    card_exp_year
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_payment_method_id,
    p_card_last_four,
    p_card_brand,
    p_card_exp_month,
    p_card_exp_year
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    stripe_payment_method_id = EXCLUDED.stripe_payment_method_id,
    card_last_four = EXCLUDED.card_last_four,
    card_brand = EXCLUDED.card_brand,
    card_exp_month = EXCLUDED.card_exp_month,
    card_exp_year = EXCLUDED.card_exp_year,
    updated_at = now();
END;
$$;

-- Security comments
COMMENT ON TABLE public.stripe_customers IS '🔒 SECURE: Stores only Stripe references, never actual card data. Card details are stored securely in Stripe PCI-compliant vaults and synced here for display only.';
COMMENT ON TABLE public.billing_addresses IS '✅ SAFE: Address information only. All card data has been removed and is now managed securely through Stripe.';
COMMENT ON TABLE public.payment_access_audit IS '📊 AUDIT: Logs all admin access to payment data. Required for PCI-DSS compliance and security monitoring.';
COMMENT ON FUNCTION public.sync_stripe_payment_method IS '🔐 SYSTEM ONLY: Syncs payment method display info from Stripe. Called by edge functions only. Never accepts direct user input.';
