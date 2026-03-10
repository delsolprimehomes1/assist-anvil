
-- Create agency_codes table
CREATE TABLE public.agency_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create agency_managers table
CREATE TABLE public.agency_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_code_id uuid NOT NULL REFERENCES public.agency_codes(id) ON DELETE CASCADE,
  manager_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_managers ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read (needed for unauthenticated onboarding form)
CREATE POLICY "Anyone can view agency codes" ON public.agency_codes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view agency managers" ON public.agency_managers FOR SELECT TO public USING (true);

-- RLS: Only admins can modify
CREATE POLICY "Admins can manage agency codes" ON public.agency_codes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage agency managers" ON public.agency_managers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed existing agency codes
INSERT INTO public.agency_codes (code, label, display_order) VALUES
  ('100', 'Lifeco Agency Direct', 1),
  ('200', NULL, 2),
  ('300', NULL, 3),
  ('400', 'Meletia Agency', 4),
  ('500', NULL, 5),
  ('600', NULL, 6),
  ('700', NULL, 7),
  ('800', NULL, 8),
  ('900', NULL, 9),
  ('1000', NULL, 10),
  ('1500', NULL, 11);

-- Seed existing managers
INSERT INTO public.agency_managers (agency_code_id, manager_name, display_order)
SELECT ac.id, m.name, m.ord
FROM public.agency_codes ac
JOIN (VALUES
  ('100', 'K. Jenson', 1),
  ('100', 'E. Young Smith', 2),
  ('200', 'Chepe G.', 1),
  ('300', 'Leah G.', 1),
  ('400', 'J. Meletia', 1),
  ('500', 'Aaron C.', 1),
  ('600', 'Tara H.', 1),
  ('700', 'Eric H.', 1),
  ('800', 'Adrian E.', 1),
  ('900', 'M. Jaramillo', 1),
  ('1000', 'R. Pitterman', 1),
  ('1500', 'Jason L.', 1)
) AS m(code, name, ord) ON ac.code = m.code;
