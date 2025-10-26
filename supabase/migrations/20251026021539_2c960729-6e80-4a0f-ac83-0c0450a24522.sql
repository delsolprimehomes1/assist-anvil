-- Create enum types for status fields
CREATE TYPE license_status AS ENUM ('active', 'expiring_soon', 'expired', 'pending');
CREATE TYPE contract_status AS ENUM ('active', 'pending', 'terminated');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'completed', 'abandoned');
CREATE TYPE document_type AS ENUM ('license', 'contract', 'eo_insurance', 'ce_certificate', 'other');
CREATE TYPE resource_type AS ENUM ('carrier_portal', 'license_lookup', 'ce_provider', 'document', 'link');

-- Agent Profiles Table (extends profiles)
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  npn_number TEXT UNIQUE,
  agency_name TEXT,
  upline_manager TEXT,
  resident_state TEXT,
  resident_license_number TEXT,
  resident_license_exp DATE,
  ce_due_date DATE,
  goal_states TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Non-Resident Licenses Table
CREATE TABLE public.non_resident_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  license_number TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  status license_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carrier Contracts Table
CREATE TABLE public.carrier_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  carrier_type TEXT[] DEFAULT '{}',
  writing_number TEXT,
  contract_level NUMERIC(5,2),
  contract_start_date DATE,
  contract_status contract_status DEFAULT 'pending',
  upline_imo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier_contract_id UUID REFERENCES public.carrier_contracts(id) ON DELETE CASCADE,
  product_line TEXT NOT NULL,
  product_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compliance Records Table
CREATE TABLE public.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  eo_insurance_exp DATE,
  eo_insurance_provider TEXT,
  eo_policy_number TEXT,
  aml_training_date DATE,
  background_check_date DATE,
  ce_hours_completed BOOLEAN DEFAULT false,
  ce_hours_required INTEGER DEFAULT 0,
  ce_hours_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Business Goals Table
CREATE TABLE public.business_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_title TEXT NOT NULL,
  action_steps TEXT[] DEFAULT '{}',
  target_date DATE,
  status goal_status DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources Table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resource_type resource_type NOT NULL,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compliance Documents Table
CREATE TABLE public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  related_id UUID,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_non_resident_licenses_agent_id ON public.non_resident_licenses(agent_id);
CREATE INDEX idx_non_resident_licenses_expiration ON public.non_resident_licenses(expiration_date);
CREATE INDEX idx_carrier_contracts_agent_id ON public.carrier_contracts(agent_id);
CREATE INDEX idx_carrier_contracts_carrier_id ON public.carrier_contracts(carrier_id);
CREATE INDEX idx_products_agent_id ON public.products(agent_id);
CREATE INDEX idx_products_contract_id ON public.products(carrier_contract_id);
CREATE INDEX idx_business_goals_agent_id ON public.business_goals(agent_id);
CREATE INDEX idx_resources_agent_id ON public.resources(agent_id);
CREATE INDEX idx_compliance_documents_agent_id ON public.compliance_documents(agent_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_non_resident_licenses_updated_at
  BEFORE UPDATE ON public.non_resident_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_contracts_updated_at
  BEFORE UPDATE ON public.carrier_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at
  BEFORE UPDATE ON public.compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_goals_updated_at
  BEFORE UPDATE ON public.business_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at
  BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_resident_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_profiles
CREATE POLICY "Users can view own agent profile"
  ON public.agent_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own agent profile"
  ON public.agent_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own agent profile"
  ON public.agent_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all agent profiles"
  ON public.agent_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for non_resident_licenses
CREATE POLICY "Users can view own licenses"
  ON public.non_resident_licenses FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own licenses"
  ON public.non_resident_licenses FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own licenses"
  ON public.non_resident_licenses FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own licenses"
  ON public.non_resident_licenses FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all licenses"
  ON public.non_resident_licenses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for carrier_contracts
CREATE POLICY "Users can view own contracts"
  ON public.carrier_contracts FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own contracts"
  ON public.carrier_contracts FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own contracts"
  ON public.carrier_contracts FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own contracts"
  ON public.carrier_contracts FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all contracts"
  ON public.carrier_contracts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for compliance_records
CREATE POLICY "Users can view own compliance records"
  ON public.compliance_records FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own compliance records"
  ON public.compliance_records FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own compliance records"
  ON public.compliance_records FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all compliance records"
  ON public.compliance_records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for business_goals
CREATE POLICY "Users can view own goals"
  ON public.business_goals FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own goals"
  ON public.business_goals FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own goals"
  ON public.business_goals FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own goals"
  ON public.business_goals FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all goals"
  ON public.business_goals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for resources
CREATE POLICY "Users can view own resources"
  ON public.resources FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own resources"
  ON public.resources FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own resources"
  ON public.resources FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all resources"
  ON public.resources FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for compliance_documents
CREATE POLICY "Users can view own documents"
  ON public.compliance_documents FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own documents"
  ON public.compliance_documents FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update own documents"
  ON public.compliance_documents FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can delete own documents"
  ON public.compliance_documents FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all documents"
  ON public.compliance_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for compliance-documents bucket
CREATE POLICY "Users can view own compliance documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'compliance-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own compliance documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'compliance-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own compliance documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'compliance-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own compliance documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'compliance-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all compliance documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'compliance-documents' AND
    public.has_role(auth.uid(), 'admin')
  );