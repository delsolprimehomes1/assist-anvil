import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Training {
  id: string;
  title: string;
  description: string;
  description_html?: string | null;
  video_url?: string | null;
  video_type?: string | null;
  embed_code?: string | null;
  level: string;
  type: string;
  duration: number;
  resources?: Array<{ fileName: string; fileUrl: string }> | null;
}

interface TrainingVideoModalProps {
  training: Training | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrainingVideoModal = ({ training, open, onOpenChange }: TrainingVideoModalProps) => {
  const { markAsComplete } = useVideoProgress(training?.id || '');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Increment view count when modal opens
  useEffect(() => {
    if (open && training?.id) {
      supabase.rpc('increment_training_views', { training_id: training.id });
    }
  }, [open, training?.id]);

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

  if (!training) return null;

  const handleMarkComplete = async () => {
    await markAsComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold pr-8">{training.title}</DialogTitle>
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge className="capitalize">{training.level}</Badge>
            <Badge variant="outline" className="capitalize">{training.type}</Badge>
            <Badge variant="outline">{training.duration} min</Badge>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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
                      src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
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
                    autoPlay
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

          {/* Resources (if any) */}
          {Array.isArray(training.resources) && training.resources.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Resources</h4>
              <div className="flex flex-wrap gap-2">
                {training.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>{resource.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleMarkComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingVideoModal;
