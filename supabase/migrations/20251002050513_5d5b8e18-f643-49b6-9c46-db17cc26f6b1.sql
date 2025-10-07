-- Update custom_features for Monthly plan (product_id: 296-655)
UPDATE plan_display_configs
SET custom_features = '["Access to all features", "Monthly billing", "Cancel anytime"]'::jsonb
WHERE product_id = '296-655' AND product_source = 'woocommerce';

-- Update custom_features for Yearly plan (product_id: 296-656)
UPDATE plan_display_configs
SET custom_features = '["Access to all features", "Yearly billing", "Best value", "Save over 30%"]'::jsonb
WHERE product_id = '296-656' AND product_source = 'woocommerce';