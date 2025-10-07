-- ============================================
-- SECURITY FIX: Move W9 Tax Data to Separate Table
-- ============================================

-- Create tax_documents table with strict access controls
CREATE TABLE IF NOT EXISTS public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_id_type TEXT NOT NULL CHECK (tax_id_type IN ('ssn', 'ein')),
  tax_id_last_four TEXT NOT NULL CHECK (length(tax_id_last_four) = 4),
  w9_file_path TEXT NOT NULL,
  w9_submitted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  tax_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tax_year)
);

-- Enable RLS on tax_documents
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

-- Create audit log table for tax data access
CREATE TABLE IF NOT EXISTS public.tax_document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  accessed_user_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.tax_document_access_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user can access tax data
CREATE OR REPLACE FUNCTION public.can_access_tax_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() = target_user_id OR 
    public.has_role(auth.uid(), 'admin');
$$;

-- Security definer function to get tax document with audit logging
CREATE OR REPLACE FUNCTION public.get_tax_document_secure(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  tax_id_type TEXT,
  tax_id_last_four TEXT,
  w9_submitted_date TIMESTAMPTZ,
  tax_year INTEGER,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt
  IF auth.uid() != target_user_id AND public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.tax_document_access_logs (
      admin_user_id,
      accessed_user_id,
      access_type
    ) VALUES (
      auth.uid(),
      target_user_id,
      'VIEW_TAX_DOCUMENT'
    );
  END IF;

  -- Return data if authorized
  IF public.can_access_tax_data(target_user_id) THEN
    RETURN QUERY
    SELECT 
      td.id,
      td.user_id,
      td.tax_id_type,
      td.tax_id_last_four,
      td.w9_submitted_date,
      td.tax_year,
      td.is_verified
    FROM public.tax_documents td
    WHERE td.user_id = target_user_id
    ORDER BY td.tax_year DESC;
  ELSE
    RAISE EXCEPTION 'Unauthorized access to tax documents';
  END IF;
END;
$$;

-- RLS Policies for tax_documents table
CREATE POLICY "Users can insert own tax documents"
ON public.tax_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tax documents"
ON public.tax_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tax documents with logging"
ON public.tax_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tax document verification"
ON public.tax_documents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tax_document_access_logs
CREATE POLICY "Admins can view access logs"
ON public.tax_document_access_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert access logs"
ON public.tax_document_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Migrate existing W9 data from profiles to tax_documents
INSERT INTO public.tax_documents (
  user_id,
  tax_id_type,
  tax_id_last_four,
  w9_file_path,
  w9_submitted_date,
  tax_year
)
SELECT 
  user_id,
  COALESCE(tax_id_type, 'ssn'),
  tax_id_last_four,
  w9_file_path,
  COALESCE(w9_submitted_date, now()),
  EXTRACT(YEAR FROM COALESCE(w9_submitted_date, now()))::INTEGER
FROM public.profiles
WHERE w9_submitted = true 
  AND tax_id_last_four IS NOT NULL 
  AND w9_file_path IS NOT NULL
ON CONFLICT (user_id, tax_year) DO NOTHING;

-- Drop W9 columns from profiles table (sensitive data should not be in profiles)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS w9_submitted;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS w9_submitted_date;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tax_id_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tax_id_last_four;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS w9_file_path;

-- Update storage policies for tax-documents bucket (ensure it's private)
-- First, check if policies exist and drop them
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload own tax documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own tax documents" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all tax documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create strict storage policies
CREATE POLICY "Users can upload own tax documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tax-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own tax documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tax-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all tax documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tax-documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_tax_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tax_documents_updated_at
BEFORE UPDATE ON public.tax_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_tax_documents_updated_at();

-- Create audit trigger for tax document modifications
CREATE OR REPLACE FUNCTION public.audit_tax_document_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admins modify tax documents
  IF TG_OP = 'UPDATE' AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      admin_user_id,
      action,
      target_user_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'ADMIN_UPDATE_TAX_DOCUMENT',
      NEW.user_id,
      jsonb_build_object(
        'is_verified', OLD.is_verified,
        'verified_by', OLD.verified_by
      ),
      jsonb_build_object(
        'is_verified', NEW.is_verified,
        'verified_by', NEW.verified_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_tax_document_modification
AFTER UPDATE ON public.tax_documents
FOR EACH ROW
EXECUTE FUNCTION public.audit_tax_document_modification();

COMMENT ON TABLE public.tax_documents IS 'Stores W9 tax information separately from profiles with strict access controls and audit logging';
COMMENT ON FUNCTION public.get_tax_document_secure IS 'Security definer function that logs admin access to tax documents';