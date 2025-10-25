import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useVideoProgress = (trainingId: string) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load existing progress on mount
  useEffect(() => {
    if (!user) return;
    
    const loadProgress = async () => {
      const { data } = await supabase
        .from('user_training_progress')
        .select('last_watched_position')
        .eq('user_id', user.id)
        .eq('training_id', trainingId)
        .maybeSingle();
      
      if (data) {
        setCurrentTime(data.last_watched_position);
      }
    };
    
    loadProgress();
  }, [user, trainingId]);
  
  // Auto-save every 10 seconds
  useEffect(() => {
    if (!user || duration === 0) return;
    
    const saveInterval = setInterval(() => {
      if (currentTime > 0 && !isSaving) {
        saveProgress();
      }
    }, 10000);
    
    return () => clearInterval(saveInterval);
  }, [currentTime, duration, user, isSaving]);
  
  const saveProgress = useCallback(async () => {
    if (!user || duration === 0) return;
    
    setIsSaving(true);
    try {
      const progressPercentage = Math.min(100, Math.round((currentTime / duration) * 100));
      const status = progressPercentage >= 90 ? 'completed' : progressPercentage > 0 ? 'in_progress' : 'not_started';
      
      await supabase
        .from('user_training_progress')
        .upsert({
          user_id: user.id,
          training_id: trainingId,
          last_watched_position: Math.floor(currentTime),
          progress_percentage: progressPercentage,
          status: status,
        }, {
          onConflict: 'user_id,training_id'
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, trainingId, currentTime, duration]);
  
  const markAsComplete = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_training_progress')
        .upsert({
          user_id: user.id,
          training_id: trainingId,
          progress_percentage: 100,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,training_id'
        });
      
      toast({
        title: "🎉 Training Complete!",
        description: "Great job! You've completed this training.",
      });
      
      return true;
    } catch (error) {
      console.error('Error marking as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark training as complete.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, trainingId]);
  
  return {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    markAsComplete,
    saveProgress,
  };
};
