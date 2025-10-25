import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Training {
  id: string;
  title: string;
  description: string;
  description_html: string | null;
  video_url: string | null;
  video_type: string | null;
  embed_code: string | null;
  thumbnail_url: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'audio' | 'article' | 'pdf' | 'quiz' | 'live';
  category: string | null;
  tags: string[];
  resources: any[];
  status: 'draft' | 'published' | 'archived';
  visibility: string[];
  specific_agents: string[] | null;
  publish_date: string | null;
  views: number;
  completed_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  userProgress?: {
    id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    last_watched_position: number;
    started_at: string;
    completed_at: string | null;
    last_accessed_at: string;
  } | null;
  progress?: number;
}

export const useTrainingCenter = () => {
  const { user } = useAuth();
  
  // Fetch published trainings
  const { data: trainings, isLoading: trainingsLoading } = useQuery({
    queryKey: ['trainings', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('status', 'published')
        .or(`publish_date.is.null,publish_date.lte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Training[];
    }
  });
  
  // Fetch user's progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['training-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  
  // Combine trainings with progress
  const trainingsWithProgress = trainings?.map(training => {
    const userProgress = progress?.find(p => p.training_id === training.id);
    return {
      ...training,
      userProgress: userProgress || null,
      progress: userProgress?.progress_percentage || 0,
    };
  });
  
  // Calculate stats
  const stats = {
    completed: trainingsWithProgress?.filter(t => t.userProgress?.status === 'completed').length || 0,
    inProgress: trainingsWithProgress?.filter(t => t.userProgress?.status === 'in_progress').length || 0,
    totalHours: trainingsWithProgress?.reduce((sum, t) => sum + t.duration, 0) || 0,
  };
  
  return {
    trainings: trainingsWithProgress || [],
    isLoading: trainingsLoading || progressLoading,
    stats,
  };
};
