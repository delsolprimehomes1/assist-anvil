-- Create storage bucket for training videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-videos',
  'training-videos',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
);

-- Create policy to allow anyone to view training videos (public bucket)
CREATE POLICY "Public access to training videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-videos');

-- Allow authenticated users to upload training videos (admin only should be enforced at app level)
CREATE POLICY "Authenticated users can upload training videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-videos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update training videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'training-videos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete training videos
CREATE POLICY "Authenticated users can delete training videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'training-videos' AND auth.role() = 'authenticated');