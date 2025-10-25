import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ResourceFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface ResourceUploaderProps {
  onUploadComplete: (resources: ResourceFile[]) => void;
  currentResources?: ResourceFile[];
}

export const ResourceUploader = ({ onUploadComplete, currentResources = [] }: ResourceUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [resources, setResources] = useState<ResourceFile[]>(currentResources);

  const uploadResource = async (file: File) => {
    if (!user) return;
    
    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('training-resources')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('training-resources')
        .getPublicUrl(fileName);
      
      const newResource: ResourceFile = {
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      return newResource;
    } catch (error) {
      console.error('Error uploading resource:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadPromises = acceptedFiles.map(file => uploadResource(file));
      const newResources = await Promise.all(uploadPromises);
      const updatedResources = [...resources, ...newResources];
      
      setResources(updatedResources);
      onUploadComplete(updatedResources);
      
      toast({
        title: "Upload complete",
        description: `${acceptedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload some files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, resources]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
    },
    disabled: isUploading
  });

  const removeResource = (index: number) => {
    const updatedResources = resources.filter((_, i) => i !== index);
    setResources(updatedResources);
    onUploadComplete(updatedResources);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm mb-1">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported file types: PDF, DOCX, XLSX, PPTX, ZIP
            </p>
          </div>
        </div>
      </div>
      
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{resource.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(resource.fileSize)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeResource(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
