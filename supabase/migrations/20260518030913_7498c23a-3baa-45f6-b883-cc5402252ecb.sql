DO $$
DECLARE
  target_ids uuid[] := ARRAY[
    '1a6ade4c-69ba-4d6f-b0f9-6b8beef029e2', -- Mike Check
    '2185d72f-e1fa-4ffe-97a6-ea4e760a5ab2', -- Bryson Melvin
    '2df87d18-a77e-4457-8060-eed6c03faae4', -- Mike scott
    '814e8d0b-b4f2-4bbf-8672-3dfb3e425000', -- Johnathon moe
    '2884137b-db7b-4fbe-8357-546dea20acaa', -- Johnathon melvin
    '9cfa1370-1ecd-43de-bf22-11c81e818858', -- Johnathon Melvin
    '8940d370-1a61-4f43-a3f4-40800eef73d7', -- Johnathon Melvin
    '3352ede2-2dab-40ec-bc82-26d1fc0b43b9'  -- Kevin Smith
  ];
  protected_admin uuid := 'ec91a528-7668-4d83-a25d-a9a4cab0c3cd';
  target_emails text[];
BEGIN
  IF protected_admin = ANY(target_ids) THEN
    RAISE EXCEPTION 'Refusing to run: protected admin in target list';
  END IF;

  SELECT array_agg(email) INTO target_emails FROM public.profiles WHERE id = ANY(target_ids);

  DELETE FROM public.agent_performance_entries WHERE agent_id = ANY(target_ids);
  DELETE FROM public.agent_notes WHERE agent_id = ANY(target_ids) OR created_by = ANY(target_ids);
  DELETE FROM public.carrier_contracts WHERE agent_id = ANY(target_ids);
  DELETE FROM public.non_resident_licenses WHERE agent_id = ANY(target_ids);
  DELETE FROM public.compliance_records WHERE agent_id = ANY(target_ids);
  DELETE FROM public.compliance_documents WHERE agent_id = ANY(target_ids);
  DELETE FROM public.business_goals WHERE agent_id = ANY(target_ids);
  DELETE FROM public.products WHERE agent_id = ANY(target_ids);
  DELETE FROM public.resources WHERE agent_id = ANY(target_ids);
  DELETE FROM public.onboarding_requests WHERE user_id = ANY(target_ids);
  DELETE FROM public.password_reset_requests WHERE email = ANY(target_emails);
  DELETE FROM public.user_invitations WHERE invited_by = ANY(target_ids) OR email = ANY(target_emails);
  DELETE FROM public.agent_profiles WHERE id = ANY(target_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY(target_ids);
  DELETE FROM public.hierarchy_agents WHERE user_id = ANY(target_ids);
  DELETE FROM public.profiles WHERE id = ANY(target_ids);
  DELETE FROM auth.users WHERE id = ANY(target_ids);
END $$;