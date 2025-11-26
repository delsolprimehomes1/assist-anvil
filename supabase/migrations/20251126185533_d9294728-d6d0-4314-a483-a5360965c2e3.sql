-- Add enhanced brand elements to user_brand_kits table
ALTER TABLE public.user_brand_kits
ADD COLUMN agent_photo_url text,
ADD COLUMN secondary_logo_url text,
ADD COLUMN address_line1 text,
ADD COLUMN address_line2 text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text,
ADD COLUMN linkedin_url text,
ADD COLUMN facebook_url text,
ADD COLUMN instagram_url text,
ADD COLUMN font_heading text DEFAULT 'Inter',
ADD COLUMN font_body text DEFAULT 'Inter',
ADD COLUMN brand_voice text,
ADD COLUMN credentials_display text;