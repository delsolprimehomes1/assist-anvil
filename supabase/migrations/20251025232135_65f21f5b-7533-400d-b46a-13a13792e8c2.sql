-- Fix search_path for training functions
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = now();
    
    UPDATE public.trainings
    SET completed_count = completed_count + 1
    WHERE id = NEW.training_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_training_views(training_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trainings
  SET views = views + 1
  WHERE id = training_id;
END;
$$;