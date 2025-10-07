-- Update existing WooCommerce plan display configs to use parent_product_id-variation_id format
-- This migration updates product_id for WooCommerce products to include the parent product ID

DO $$
DECLARE
  config_record RECORD;
  new_product_id TEXT;
  parent_id TEXT;
  variation_id TEXT;
BEGIN
  -- Loop through all WooCommerce plan configs
  FOR config_record IN 
    SELECT id, product_id, original_data 
    FROM plan_display_configs 
    WHERE product_source = 'woocommerce'
  LOOP
    -- Extract parent_product_id and variation_id from original_data
    parent_id := config_record.original_data->>'parent_product_id';
    variation_id := config_record.original_data->>'variation_id';
    
    -- If we have both parent_product_id and variation_id, update the product_id
    IF parent_id IS NOT NULL AND variation_id IS NOT NULL THEN
      new_product_id := parent_id || '-' || variation_id;
      
      -- Only update if the format is different from current product_id
      IF config_record.product_id != new_product_id THEN
        UPDATE plan_display_configs
        SET product_id = new_product_id,
            updated_at = now()
        WHERE id = config_record.id;
        
        RAISE NOTICE 'Updated product_id from % to % for config %', 
          config_record.product_id, new_product_id, config_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;