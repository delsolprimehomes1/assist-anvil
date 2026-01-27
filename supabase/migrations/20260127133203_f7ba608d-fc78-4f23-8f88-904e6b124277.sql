-- Insert new business-focused zones
INSERT INTO public.zone_config (zone_key, label, description, color, display_order) VALUES
  ('producing', 'Producing', 'Business written this month', '#22C55E', 0),
  ('investing', 'Investing', 'Buying leads but no closed business yet', '#8B5CF6', 1)
ON CONFLICT (zone_key) DO NOTHING;

-- Update existing display orders to accommodate new zones
UPDATE public.zone_config SET display_order = display_order + 2 WHERE zone_key NOT IN ('producing', 'investing');