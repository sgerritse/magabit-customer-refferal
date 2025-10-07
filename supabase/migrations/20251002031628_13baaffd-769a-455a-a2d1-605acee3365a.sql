-- Add WooCommerce product tracking columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS woocommerce_product_id text,
ADD COLUMN IF NOT EXISTS woocommerce_parent_product_id integer,
ADD COLUMN IF NOT EXISTS woocommerce_variation_id integer;

-- Add index for faster lookups by WooCommerce product ID
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_woocommerce_product_id 
ON public.user_subscriptions(woocommerce_product_id);

COMMENT ON COLUMN public.user_subscriptions.woocommerce_product_id IS 'WooCommerce product ID string';
COMMENT ON COLUMN public.user_subscriptions.woocommerce_parent_product_id IS 'WooCommerce parent product ID (for variations)';
COMMENT ON COLUMN public.user_subscriptions.woocommerce_variation_id IS 'WooCommerce variation ID (if applicable)';