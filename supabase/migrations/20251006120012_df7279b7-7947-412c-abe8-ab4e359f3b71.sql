-- Phase 1: Payout Method Change Protections
-- Add tracking columns to ambassador_payout_methods
ALTER TABLE public.ambassador_payout_methods 
ADD COLUMN IF NOT EXISTS last_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS change_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create payout method changes audit log table
CREATE TABLE IF NOT EXISTS public.payout_method_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_method TEXT,
  new_method TEXT NOT NULL,
  old_details JSONB,
  new_details JSONB,
  ip_address INET,
  user_agent TEXT,
  flagged_as_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payout_method_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for payout_method_changes
CREATE POLICY "Users can view own payout changes"
ON public.payout_method_changes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payout changes"
ON public.payout_method_changes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert payout changes"
ON public.payout_method_changes FOR INSERT
WITH CHECK (true);

-- Function to detect payout method fraud
CREATE OR REPLACE FUNCTION public.detect_payout_method_fraud()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_change_count INTEGER;
  v_recent_changes INTEGER;
BEGIN
  -- Count total changes in last 30 days
  SELECT COUNT(*) INTO v_recent_changes
  FROM public.payout_method_changes
  WHERE user_id = NEW.user_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Flag as suspicious if more than 3 changes in 30 days
  IF v_recent_changes > 3 THEN
    INSERT INTO public.fraud_alerts (
      user_id,
      alert_type,
      severity,
      details
    ) VALUES (
      NEW.user_id,
      'suspicious_payout_changes',
      'high',
      jsonb_build_object(
        'changes_in_30_days', v_recent_changes,
        'new_method', NEW.payout_method
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log payout method changes
CREATE OR REPLACE FUNCTION public.log_payout_method_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_method TEXT;
  v_old_details JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_method := OLD.payout_method;
    v_old_details := jsonb_build_object(
      'bank_details_encrypted', CASE WHEN OLD.bank_details_encrypted IS NOT NULL THEN 'present' ELSE 'absent' END,
      'paypal_email_encrypted', CASE WHEN OLD.paypal_email_encrypted IS NOT NULL THEN 'present' ELSE 'absent' END
    );
    
    -- Update tracking columns
    NEW.last_changed_at := NOW();
    NEW.change_count := COALESCE(OLD.change_count, 0) + 1;
    NEW.verified_at := NULL; -- Reset verification on change
    
    -- Log the change
    INSERT INTO public.payout_method_changes (
      user_id,
      old_method,
      new_method,
      old_details,
      new_details
    ) VALUES (
      NEW.user_id,
      v_old_method,
      NEW.payout_method,
      v_old_details,
      jsonb_build_object(
        'bank_details_encrypted', CASE WHEN NEW.bank_details_encrypted IS NOT NULL THEN 'present' ELSE 'absent' END,
        'paypal_email_encrypted', CASE WHEN NEW.paypal_email_encrypted IS NOT NULL THEN 'present' ELSE 'absent' END
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    -- Set initial values
    NEW.last_changed_at := NOW();
    NEW.change_count := 0;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to check payout eligibility
CREATE OR REPLACE FUNCTION public.check_payout_eligibility(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout_method RECORD;
  v_total_pending NUMERIC;
  v_hours_since_change INTEGER;
  v_result JSONB;
BEGIN
  -- Get payout method
  SELECT * INTO v_payout_method
  FROM public.ambassador_payout_methods
  WHERE user_id = p_user_id;
  
  -- Check if payout method exists
  IF v_payout_method IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'no_payout_method',
      'message', 'Please set up a payout method first.'
    );
  END IF;
  
  -- Check if method is verified
  IF v_payout_method.is_verified = false THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'not_verified',
      'message', 'Your payout method needs to be verified by our team.'
    );
  END IF;
  
  -- Check 24-hour delay after method change
  v_hours_since_change := EXTRACT(EPOCH FROM (NOW() - v_payout_method.last_changed_at)) / 3600;
  
  IF v_hours_since_change < 24 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'recent_change',
      'message', 'For security, payouts are delayed 24 hours after changing your payout method.',
      'hours_remaining', 24 - v_hours_since_change
    );
  END IF;
  
  -- Calculate pending earnings
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pending
  FROM public.ambassador_earnings
  WHERE user_id = p_user_id
    AND status = 'approved'
    AND payout_id IS NULL;
  
  -- Check minimum payout amount
  IF v_total_pending < 1.00 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'minimum_not_met',
      'message', 'Minimum payout amount is $1.00.',
      'current_amount', v_total_pending
    );
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'eligible', true,
    'available_amount', v_total_pending,
    'message', 'You are eligible to request a payout.'
  );
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_payout_method_change ON public.ambassador_payout_methods;
CREATE TRIGGER trigger_log_payout_method_change
  BEFORE INSERT OR UPDATE ON public.ambassador_payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payout_method_change();

DROP TRIGGER IF EXISTS trigger_detect_payout_fraud ON public.ambassador_payout_methods;
CREATE TRIGGER trigger_detect_payout_fraud
  AFTER INSERT OR UPDATE ON public.ambassador_payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_payout_method_fraud();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payout_method_changes_user_created 
ON public.payout_method_changes(user_id, created_at DESC);