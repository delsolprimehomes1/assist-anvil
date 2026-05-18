## Sync license + CE dates from `agent_profiles` into `hierarchy_agents`

### Schema reality check

- `agent_profiles` uses **`id`** (uuid) as its primary key, which equals `auth.users.id` — there is no separate `user_id` column.
- Columns to sync: **`resident_license_exp`** (date) and **`ce_due_date`** (date). Both already exist on `hierarchy_agents`.
- `license_states` is NOT in `agent_profiles` (only `goal_states` exists there) → skip.

### Migration

```sql
-- 1. Trigger function: mirror license/CE dates into hierarchy_agents
CREATE OR REPLACE FUNCTION public.sync_license_exp_to_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hierarchy_agents
  SET
    resident_license_exp = NEW.resident_license_exp,
    ce_due_date          = NEW.ce_due_date,
    updated_at           = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- 2. Trigger: fire on insert, or on update when either field changes
DROP TRIGGER IF EXISTS sync_license_exp_to_hierarchy ON public.agent_profiles;
CREATE TRIGGER sync_license_exp_to_hierarchy
AFTER INSERT OR UPDATE OF resident_license_exp, ce_due_date
ON public.agent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_license_exp_to_hierarchy();

-- 3. One-time backfill of existing rows
UPDATE public.hierarchy_agents ha
SET
  resident_license_exp = ap.resident_license_exp,
  ce_due_date          = ap.ce_due_date,
  updated_at           = now()
FROM public.agent_profiles ap
WHERE ha.user_id = ap.id
  AND (
    ha.resident_license_exp IS DISTINCT FROM ap.resident_license_exp
    OR ha.ce_due_date        IS DISTINCT FROM ap.ce_due_date
  );
```

`SECURITY DEFINER` is required so the trigger can update `hierarchy_agents` rows the editing agent doesn't directly own (the row IS theirs, but RLS on `hierarchy_agents` has no self-UPDATE policy for agents).

### Verification steps

1. Run the migration. Report the backfill row count.
2. As a test agent, change `resident_license_exp` to **today + 5d** on the Compliance page → reload `/dashboard/organization` → agent appears **Red** (license expiring ≤7d).
3. Change to **today + 20d** → reload → agent appears **Yellow** (expiring 8–30d).
4. Change to **today + 60d** → reload → agent drops out of license-driven zones (Green/Black depending on other signals).
5. Confirm via `SELECT user_id, resident_license_exp, ce_due_date FROM hierarchy_agents WHERE user_id = '<agent>';`

No frontend changes required — `determineAgentZone()` already reads these fields.
