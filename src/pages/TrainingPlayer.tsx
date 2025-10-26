import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrainingPlayer = () => {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const { markAsComplete } = useVideoProgress(trainingId!);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Helper function to extract Vimeo video ID
  const getVimeoVideoId = (url: string) => {
    const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

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
                    
                    {/* YouTube Embed */}
                    {training.video_type === 'youtube' && (() => {
                      const videoId = getYouTubeVideoId(training.video_url);
                      return videoId ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={training.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Invalid YouTube URL
                        </div>
                      );
                    })()}
                    
                    {/* Vimeo Embed */}
                    {training.video_type === 'vimeo' && (() => {
                      const videoId = getVimeoVideoId(training.video_url);
                      return videoId ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://player.vimeo.com/video/${videoId}`}
                          title={training.title}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Invalid Vimeo URL
                        </div>
                      );
                    })()}
                    
                    {/* Custom Embed Code */}
                    {training.video_type === 'embed' && training.embed_code && (
                      <div 
                        className="w-full h-full" 
                        dangerouslySetInnerHTML={{ __html: training.embed_code }}
                      />
                    )}
                    
                    {/* Native HTML5 Video Player for direct uploads */}
                    {training.video_type === 'upload' && (
                      <video
                        src={training.video_url}
                        controls
                        className="w-full h-full"
                        onError={() => {
                          setVideoError('Failed to load video. The video format may not be supported.');
                        }}
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
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
