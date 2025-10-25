import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Video, Loader2, CheckCircle2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  onUploadComplete: (url: string, type: 'upload') => void;
  currentVideoUrl?: string;
}

export const VideoUploader = ({ onUploadComplete, currentVideoUrl }: VideoUploaderProps) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentVideoUrl || null);

  const uploadVideo = async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('training-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('training-media')
        .getPublicUrl(fileName);
      
      setUploadedUrl(urlData.publicUrl);
      onUploadComplete(urlData.publicUrl, 'upload');
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: "Video uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check file size (5GB limit)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be under 5GB",
          variant: "destructive"
        });
        return;
      }
      
      uploadVideo(file);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/aac': ['.aac'],
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const removeVideo = () => {
    setUploadedUrl(null);
    setUploadProgress(0);
    onUploadComplete('', 'upload');
  };

  if (uploadedUrl && !isUploading) {
    return (
      <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm mb-1">Video uploaded</p>
            <p className="text-xs text-muted-foreground truncate">{uploadedUrl}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeVideo}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium mb-1">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: .mp4, .webm, .mov, .mp3, .wav, .aac
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: 5 GB (Video), 2 GB (Audio)
            </p>
          </div>
        </div>
      </div>
      
      {isUploading && (
        <div className="mt-4">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}
    </div>
  );
};
