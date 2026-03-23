
CREATE TABLE public.carrier_quoting_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier text NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'quick-quote',
  requires_login boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  logo_url text,
  gradient text NOT NULL DEFAULT 'from-blue-500/20 via-cyan-500/10 to-transparent',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carrier_quoting_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active quoting links"
  ON public.carrier_quoting_links
  FOR SELECT
  TO authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage quoting links"
  ON public.carrier_quoting_links
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.carrier_quoting_links (carrier, name, url, type, requires_login, description, gradient, display_order) VALUES
  ('Mutual of Omaha', 'Mobile Quote System', 'https://www3.mutualofomaha.com/mobile-quotes/#/', 'quick-quote', false, 'Fast mobile quotes for client illustrations', 'from-blue-500/20 via-cyan-500/10 to-transparent', 1),
  ('Americo', 'Agent Portal', 'https://account.americoagent.com/Identity/Account/Login/?returnUrl=https%3a%2f%2ftools.americoagent.com%2f', 'agent-portal', true, 'Full agent portal with quoting tools', 'from-indigo-500/20 via-purple-500/10 to-transparent', 2),
  ('Americo', 'IUL Microsite', 'https://americoiul.com/', 'microsite', false, 'Indexed Universal Life product resources', 'from-violet-500/20 via-fuchsia-500/10 to-transparent', 3),
  ('Foresters Financial', 'Quote System', 'https://www.forestersmobile.com/login', 'quick-quote', false, 'Mobile-friendly quick quote generator', 'from-emerald-500/20 via-teal-500/10 to-transparent', 4),
  ('Assurity', 'Accidental Death Quote', 'https://quickstart.assurity.com/Agent-AccidentalDeath', 'quick-quote', false, 'Quick accidental death coverage quotes', 'from-orange-500/20 via-amber-500/10 to-transparent', 5),
  ('Royal Neighbors', 'Quick Quote', 'https://www.rnaquickquote.org/', 'quick-quote', false, 'Fast fraternal benefit quotes', 'from-rose-500/20 via-pink-500/10 to-transparent', 6),
  ('Transamerica', 'Immediate Solutions Quote', 'https://mytranswarequote.transamerica.com/Wl3.html?id=WL3IM', 'quick-quote', false, 'Whole life immediate solutions calculator', 'from-sky-500/20 via-blue-500/10 to-transparent', 7),
  ('F&G Life', 'IUL Microsite', 'https://success.fglife.com/product-materials?source=specialty-brokerage', 'microsite', false, 'IUL product materials and resources', 'from-lime-500/20 via-green-500/10 to-transparent', 8);
