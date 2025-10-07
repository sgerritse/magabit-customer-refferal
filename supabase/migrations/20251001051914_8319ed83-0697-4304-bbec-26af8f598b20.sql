-- Create billing_info table to store user billing details
CREATE TABLE public.billing_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Card information (non-sensitive)
  card_last_four TEXT,
  card_type TEXT, -- visa, mastercard, amex, etc.
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,
  
  -- Billing address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one billing info per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing info
CREATE POLICY "Users can view their own billing info"
ON public.billing_info
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own billing info
CREATE POLICY "Users can insert their own billing info"
ON public.billing_info
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own billing info
CREATE POLICY "Users can update their own billing info"
ON public.billing_info
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all billing info
CREATE POLICY "Admins can view all billing info"
ON public.billing_info
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_billing_info_updated_at
BEFORE UPDATE ON public.billing_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();