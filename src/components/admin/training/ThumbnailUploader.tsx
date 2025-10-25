import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ThumbnailUploaderProps {
  onUploadComplete: (url: string) => void;
  currentThumbnailUrl?: string;
}

export const ThumbnailUploader = ({ onUploadComplete, currentThumbnailUrl }: ThumbnailUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentThumbnailUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnailUrl || null);

  const uploadThumbnail = async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('training-thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('training-thumbnails')
        .getPublicUrl(fileName);
      
      setUploadedUrl(urlData.publicUrl);
      setPreviewUrl(urlData.publicUrl);
      onUploadComplete(urlData.publicUrl);
      
      toast({
        title: "Upload complete",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload thumbnail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be under 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadThumbnail(file);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const removeThumbnail = () => {
    setUploadedUrl(null);
    setPreviewUrl(null);
    onUploadComplete('');
  };

  if (previewUrl && !isUploading) {
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
          <img 
            src={previewUrl} 
            alt="Thumbnail preview" 
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeThumbnail}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Thumbnail uploaded successfully
        </p>
      </div>
    );
  }

  return (
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
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium mb-1">
            {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supported: .svg, .png, .jpg, .jpeg, .webp
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended dimensions: 1280×720
          </p>
        </div>
      </div>
    </div>
  );
};
