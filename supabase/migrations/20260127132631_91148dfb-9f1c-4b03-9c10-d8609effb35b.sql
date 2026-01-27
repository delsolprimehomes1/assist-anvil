-- Create zone_config table for customizable zone colors and meanings
CREATE TABLE public.zone_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  color text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zone_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view zone configs
CREATE POLICY "Anyone can view zone configs"
  ON public.zone_config FOR SELECT
  USING (true);

-- Only admins can manage zone configs
CREATE POLICY "Admins can manage zone configs"
  ON public.zone_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_zone_config_updated_at
  BEFORE UPDATE ON public.zone_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default zone configurations
INSERT INTO public.zone_config (zone_key, label, description, color, display_order) VALUES
  ('red', 'Critical', 'License expired or expiring within 7 days', '#EF4444', 1),
  ('blue', 'Onboarding', 'New agent, verification incomplete', '#3B82F6', 2),
  ('black', 'Inactive', 'No activity for 7+ days', '#64748B', 3),
  ('yellow', 'Warning', 'Pending contracts or license expiring soon', '#F59E0B', 4),
  ('green', 'Active', 'All systems operational', '#10B981', 5);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_config;