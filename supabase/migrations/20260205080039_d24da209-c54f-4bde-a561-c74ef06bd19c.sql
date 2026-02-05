-- Add reparenting_instructions column to carriers table
ALTER TABLE public.carriers 
ADD COLUMN reparenting_instructions JSONB DEFAULT NULL;

-- Add a comment to document the expected JSON structure
COMMENT ON COLUMN public.carriers.reparenting_instructions IS 'JSON structure: { email: string, subject: string, template: string, notes?: string }';