import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { VideoUploader } from "./VideoUploader";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { ResourceUploader } from "./ResourceUploader";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters").max(255),
  description: z.string().min(20, "Description must be at least 20 characters"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  type: z.enum(['video', 'audio', 'article', 'pdf', 'quiz', 'live']),
  category: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published']),
});

interface TrainingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: any;
  onSuccess: () => void;
}

export const TrainingFormDialog = ({ open, onOpenChange, training, onSuccess }: TrainingFormDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState(training?.video_url || '');
  const [videoType, setVideoType] = useState(training?.video_type || 'upload');
  const [thumbnailUrl, setThumbnailUrl] = useState(training?.thumbnail_url || '');
  const [resources, setResources] = useState(training?.resources || []);
  const [embedCode, setEmbedCode] = useState(training?.embed_code || '');
  const [externalUrl, setExternalUrl] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: training?.title || '',
      description: training?.description || '',
      duration: training?.duration || 0,
      level: training?.level || 'beginner',
      type: training?.type || 'video',
      category: training?.category || '',
      tags: training?.tags?.join(', ') || '',
      status: training?.status || 'draft',
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) return;
    if (!thumbnailUrl) {
      toast({
        title: "Missing thumbnail",
        description: "Please upload a thumbnail image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      const trainingData = {
        title: data.title,
        description: data.description,
        description_html: data.description,
        video_url: videoUrl || null,
        video_type: videoType,
        embed_code: videoType === 'embed' ? embedCode : null,
        thumbnail_url: thumbnailUrl,
        duration: data.duration,
        level: data.level,
        type: data.type,
        category: data.category || null,
        tags: tagsArray,
        resources: resources,
        status: data.status,
        visibility: ['all'],
        created_by: user.id,
      };

      if (training?.id) {
        const { error } = await supabase
          .from('trainings')
          .update(trainingData)
          .eq('id', training.id);
        
        if (error) throw error;
        
        toast({
          title: "Training updated",
          description: "Training has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('trainings')
          .insert([trainingData]);
        
        if (error) throw error;
        
        toast({
          title: "Training created",
          description: "Training has been created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving training:', error);
      toast({
        title: "Error",
        description: "Failed to save training. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalUrlSubmit = () => {
    if (externalUrl.includes('youtube.com') || externalUrl.includes('youtu.be')) {
      setVideoUrl(externalUrl);
      setVideoType('youtube');
    } else if (externalUrl.includes('vimeo.com')) {
      setVideoUrl(externalUrl);
      setVideoType('vimeo');
    } else {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube or Vimeo URL",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {training ? 'Edit Training' : 'Add New Training'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Lesson Media */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Lesson Media</Label>
            <Tabs defaultValue="upload" onValueChange={(v) => setVideoType(v as any)}>
              <TabsList>
                <TabsTrigger value="upload">Upload from Device</TabsTrigger>
                <TabsTrigger value="link">Import from Link</TabsTrigger>
                <TabsTrigger value="embed">Embed from URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <VideoUploader 
                  onUploadComplete={(url, type) => {
                    setVideoUrl(url);
                    setVideoType(type);
                  }}
                  currentVideoUrl={videoType === 'upload' ? videoUrl : ''}
                />
              </TabsContent>
              
              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter YouTube or Vimeo URL"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                  <Button type="button" onClick={handleExternalUrlSubmit}>
                    Import Video
                  </Button>
                  {videoUrl && (videoType === 'youtube' || videoType === 'vimeo') && (
                    <p className="text-sm text-muted-foreground">
                      ✓ Video URL set: {videoUrl}
                    </p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="embed" className="space-y-4">
                <Textarea
                  placeholder="Paste iframe embed code here"
                  value={embedCode}
                  onChange={(e) => {
                    setEmbedCode(e.target.value);
                    setVideoType('embed');
                  }}
                  rows={5}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Lesson Thumbnail */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Lesson Thumbnail *</Label>
            <ThumbnailUploader 
              onUploadComplete={setThumbnailUrl}
              currentThumbnailUrl={thumbnailUrl}
            />
          </div>

          {/* Lesson Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Lesson Details</Label>
            
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Name *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Mastering Final Expense Sales"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{String(errors.title.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Lesson Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Explain what members will learn from this lesson"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{String(errors.description.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('duration', { valueAsNumber: true })}
                  placeholder="45"
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{String(errors.duration.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select onValueChange={(value) => setValue('level', value as any)} defaultValue={watch('level')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select onValueChange={(value) => setValue('type', value as any)} defaultValue={watch('type')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="live">Live Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Sales Training"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="final expense, sales, objections"
              />
            </div>
          </div>

          {/* Downloadable Resources */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Downloadable Resources</Label>
            <ResourceUploader 
              onUploadComplete={setResources}
              currentResources={resources}
            />
          </div>

          {/* Publishing Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Publishing Options</Label>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={watch('status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="submit"
                onClick={() => setValue('status', 'draft')}
                variant="outline"
                disabled={isSubmitting}
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                onClick={() => setValue('status', 'published')}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save + Publish
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
