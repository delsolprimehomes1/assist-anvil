-- Create enums for training system
CREATE TYPE public.training_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.training_type AS ENUM ('video', 'audio', 'article', 'pdf', 'quiz', 'live');
CREATE TYPE public.training_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create trainings table
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Media & Content
  title TEXT NOT NULL CHECK (char_length(title) >= 4 AND char_length(title) <= 255),
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  description_html TEXT,
  video_url TEXT,
  video_type TEXT CHECK (video_type IN ('upload', 'youtube', 'vimeo', 'embed')),
  embed_code TEXT,
  thumbnail_url TEXT NOT NULL,
  
  -- Metadata
  duration INTEGER NOT NULL CHECK (duration > 0),
  level public.training_level NOT NULL,
  type public.training_type NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Downloadable resources
  resources JSONB DEFAULT '[]',
  
  -- Publishing & Visibility
  status public.training_status DEFAULT 'draft',
  visibility TEXT[] DEFAULT ARRAY['all'],
  specific_agents UUID[],
  publish_date TIMESTAMPTZ,
  notify_on_publish BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT false,
  notify_sms BOOLEAN DEFAULT false,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for trainings
CREATE INDEX idx_trainings_status ON public.trainings(status);
CREATE INDEX idx_trainings_level ON public.trainings(level);
CREATE INDEX idx_trainings_type ON public.trainings(type);
CREATE INDEX idx_trainings_category ON public.trainings(category);
CREATE INDEX idx_trainings_created_at ON public.trainings(created_at DESC);
CREATE INDEX idx_trainings_publish_date ON public.trainings(publish_date) WHERE publish_date IS NOT NULL;
CREATE INDEX idx_trainings_tags ON public.trainings USING gin(tags);

-- Enable RLS on trainings
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainings
CREATE POLICY "Agents can view published trainings"
  ON public.trainings FOR SELECT
  USING (
    status = 'published'
    AND (
      'all' = ANY(visibility)
      OR (auth.uid() = ANY(specific_agents))
    )
    AND (publish_date IS NULL OR publish_date <= now())
  );

CREATE POLICY "Admins can view all trainings"
  ON public.trainings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert trainings"
  ON public.trainings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trainings"
  ON public.trainings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trainings"
  ON public.trainings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user_training_progress table
CREATE TABLE public.user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  
  -- Progress tracking
  status public.progress_status DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_watched_position INTEGER DEFAULT 0,
  
  -- Completion tracking
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, training_id)
);

-- Create indexes for progress
CREATE INDEX idx_progress_user_id ON public.user_training_progress(user_id);
CREATE INDEX idx_progress_training_id ON public.user_training_progress(training_id);
CREATE INDEX idx_progress_status ON public.user_training_progress(status);

-- Enable RLS on progress
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for progress
CREATE POLICY "Users can view own progress"
  ON public.user_training_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_training_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_training_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.user_training_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update trainings.updated_at
CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update last_accessed_at
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_last_accessed
  BEFORE UPDATE ON public.user_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_last_accessed_at();

-- Function to set completed_at and increment completed_count
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = now();
    
    UPDATE public.trainings
    SET completed_count = completed_count + 1
    WHERE id = NEW.training_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_progress_completed_at
  BEFORE UPDATE ON public.user_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- Function to increment training views
CREATE OR REPLACE FUNCTION increment_training_views(training_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.trainings
  SET views = views + 1
  WHERE id = training_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('training-media', 'training-media', true, 5368709120, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/aac']),
  ('training-thumbnails', 'training-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
  ('training-resources', 'training-resources', true, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip']);

-- Storage policies for training-media
CREATE POLICY "Anyone can view training media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-media');

CREATE POLICY "Admins can upload training media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'training-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-media' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for training-thumbnails
CREATE POLICY "Anyone can view training thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-thumbnails');

CREATE POLICY "Admins can upload training thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'training-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-thumbnails' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for training-resources
CREATE POLICY "Anyone can view training resources"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-resources');

CREATE POLICY "Admins can upload training resources"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training resources"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'training-resources' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training resources"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-resources' AND public.has_role(auth.uid(), 'admin'));