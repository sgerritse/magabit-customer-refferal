-- Create plan_display_configs table for unified package management
CREATE TABLE IF NOT EXISTS public.plan_display_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_source TEXT NOT NULL CHECK (product_source IN ('woocommerce', 'internal')),
  product_id TEXT NOT NULL,
  custom_title TEXT,
  custom_description TEXT,
  custom_features JSONB DEFAULT '[]'::jsonb,
  show_on_plans_page BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  original_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_source, product_id)
);

-- Enable RLS
ALTER TABLE public.plan_display_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active plans"
  ON public.plan_display_configs
  FOR SELECT
  USING (is_active = true AND show_on_plans_page = true);

CREATE POLICY "Admins can manage all plan configs"
  ON public.plan_display_configs
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_plan_display_configs_updated_at
  BEFORE UPDATE ON public.plan_display_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_plan_display_configs_visible 
  ON public.plan_display_configs(show_on_plans_page, display_order) 
  WHERE is_active = true;