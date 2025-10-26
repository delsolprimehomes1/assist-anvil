-- Create schedule_items table
CREATE TABLE public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- Policies for schedule_items
CREATE POLICY "Anyone authenticated can view schedule items"
ON public.schedule_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert schedule items"
ON public.schedule_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update schedule items"
ON public.schedule_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedule items"
ON public.schedule_items
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_schedule_items_updated_at
BEFORE UPDATE ON public.schedule_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;