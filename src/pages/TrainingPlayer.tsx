import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrainingPlayer = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const { currentTime, setCurrentTime, duration, setDuration, markAsComplete } = useVideoProgress(trainingId!);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const { data: training, isLoading } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      await supabase.rpc('increment_training_views', { training_id: trainingId });
      
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Training not found</h2>
        <Button onClick={() => navigate('/training')}>Back to Training</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/training')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Training
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                {training.video_url ? (
                  <>
                    {videoError && (
                      <Alert variant="destructive" className="m-4">
                        <AlertDescription>{videoError}</AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Native HTML5 Video Player - Primary solution */}
                    <video
                      src={training.video_url}
                      controls
                      className="w-full h-full"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => {
                        setDuration(e.currentTarget.duration);
                        setVideoReady(true);
                        console.log('Video loaded successfully:', training.video_url);
                      }}
                      onError={(e) => {
                        const errorMsg = 'Failed to load video. The video format may not be supported.';
                        setVideoError(errorMsg);
                        console.error('Native video error:', e);
                      }}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No video available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{training.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{training.level}</Badge>
                    <Badge variant="outline">{training.type}</Badge>
                    <Badge variant="outline">{training.duration} min</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: training.description_html || training.description }} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={markAsComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            </CardContent>
          </Card>

          {Array.isArray(training.resources) && training.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(training.resources as Array<{ fileName: string; fileUrl: string }>).map((resource, index) => (
                  <a
                    key={index}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">{resource.fileName}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingPlayer;
