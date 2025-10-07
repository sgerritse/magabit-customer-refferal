-- Add show_on_plans_page column to packages table
ALTER TABLE public.packages 
ADD COLUMN show_on_plans_page boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.packages.show_on_plans_page IS 'Controls whether this package is visible on the public plans page';

-- Create index for better query performance
CREATE INDEX idx_packages_show_on_plans ON public.packages(show_on_plans_page) WHERE show_on_plans_page = true;