import { useState, useEffect, useCallback } from "react";
import { ImageIcon, Sparkles, Download, Trash2, Loader2, Upload, X, Video, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: number;
}

interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: number;
}

const STORAGE_KEY = "batterbox-generated-images";
const VIDEO_STORAGE_KEY = "batterbox-generated-videos";
const MAX_HISTORY = 8;
const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const generatePrompts = [
  "A professional insurance agent shaking hands with a happy family",
  "A golden shield protecting a house and family, symbolizing life insurance",
  "A serene retirement scene with a couple on a beach at sunset",
  "An infographic showing a piggy bank growing into a tree",
];

const editPrompts = [
  "Make this a professional headshot with a clean office background",
  "Remove the background and make it a solid color",
  "Add warm, professional lighting to this photo",
  "Make this look like a professional marketing photo",
];

const animationPrompts = [
  "The person turns their head slightly and smiles naturally",
  "Gentle wind blows through the scene, subtle movement",
  "Camera slowly zooms in while subject maintains eye contact",
  "The subject waves hello warmly",
];

export function ImageGenerator() {
  const [mode, setMode] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // Video dialog state
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState<"4" | "6" | "8">("4");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const videoStored = localStorage.getItem(VIDEO_STORAGE_KEY);
    if (videoStored) {
      try {
        setVideoHistory(JSON.parse(videoStored));
      } catch {
        localStorage.removeItem(VIDEO_STORAGE_KEY);
      }
    }
  }, []);

  const saveToHistory = (image: GeneratedImage) => {
    const updated = [image, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveVideoToHistory = (video: GeneratedVideo) => {
    const updated = [video, ...videoHistory].slice(0, MAX_HISTORY);
    setVideoHistory(updated);
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(updated));
  };

  const removeFromHistory = (id: string) => {
    const updated = history.filter((img) => img.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeVideoFromHistory = (id: string) => {
    const updated = videoHistory.filter((v) => v.id !== id);
    setVideoHistory(updated);
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    setVideoHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VIDEO_STORAGE_KEY);
    toast({ title: "History cleared" });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > MAX_IMAGES) {
      toast({ title: `Maximum ${MAX_IMAGES} images allowed`, variant: "destructive" });
      return;
    }

    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: `${file.name} is too large (max 5MB)`, variant: "destructive" });
        return false;
      }
      return true;
    });

    const base64Images = await Promise.all(validFiles.map(fileToBase64));
    setUploadedImages((prev) => [...prev, ...base64Images].slice(0, MAX_IMAGES));
  }, [uploadedImages.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [] },
    maxFiles: MAX_IMAGES,
  });

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Please enter a prompt", variant: "destructive" });
      return;
    }

    if (mode === "edit" && uploadedImages.length === 0) {
      toast({ title: "Please upload at least one image to edit", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { 
          prompt: prompt.trim(),
          images: mode === "edit" ? uploadedImages : undefined,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        saveToHistory({
          id: crypto.randomUUID(),
          prompt: prompt.trim(),
          imageUrl: data.imageUrl,
          createdAt: Date.now(),
        });
        toast({ title: mode === "edit" ? "Image edited!" : "Image generated!" });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenVideoDialog = (imageUrl: string) => {
    setVideoSourceImage(imageUrl);
    setVideoPrompt("");
    setGeneratedVideo(null);
    setShowVideoDialog(true);
  };

  const handleGenerateVideo = async () => {
    if (!videoSourceImage || !videoPrompt.trim()) {
      toast({ title: "Please enter an animation prompt", variant: "destructive" });
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          image_url: videoSourceImage,
          prompt: videoPrompt.trim(),
          duration: videoDuration,
          generate_audio: generateAudio,
        },
      });

      if (error) throw error;

      if (data?.video_url) {
        setGeneratedVideo(data.video_url);
        saveVideoToHistory({
          id: crypto.randomUUID(),
          prompt: videoPrompt.trim(),
          videoUrl: data.video_url,
          thumbnailUrl: videoSourceImage,
          createdAt: Date.now(),
        });
        toast({ title: "Video generated!" });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Video generation error:", error);
      toast({
        title: "Video generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = async (url: string, promptText: string, isVideo = false) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `generated-${promptText.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.${isVideo ? "mp4" : "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({ title: isVideo ? "Video downloaded" : "Image downloaded" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const currentPrompts = mode === "generate" ? generatePrompts : editPrompts;

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Image Generator
          </CardTitle>
          <CardDescription>
            Create or edit images for marketing materials, presentations, and client communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "generate" | "edit")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Upload className="h-4 w-4 mr-2" />
                Edit Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4 space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm text-primary">Drop images here...</p>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop images here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP • Max 5MB each • Up to {MAX_IMAGES} images
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleOpenVideoDialog(img)}
                          className="absolute -top-2 -left-2 p-1 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Animate with Veo 3"
                        >
                          <Video className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploadedImages.length === 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenVideoDialog(uploadedImages[0])}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Animate with Veo 3
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Textarea
            placeholder={
              mode === "generate"
                ? "Describe the image you want to create..."
                : "Describe how you want to edit your image(s)..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex flex-wrap gap-2">
            {currentPrompts.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPrompt(example)}
              >
                {example.slice(0, 40)}...
              </Button>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || (mode === "edit" && uploadedImages.length === 0)}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Editing..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {mode === "edit" ? "Apply Edit" : "Generate Image"}
              </>
            )}
          </Button>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="mt-4 space-y-3">
              <div className="relative rounded-lg overflow-hidden border bg-muted">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(generatedImage, prompt)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenVideoDialog(generatedImage)}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Animate with Veo 3
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Images</CardTitle>
              <CardDescription>Your last {history.length} generated images</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {history.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-lg overflow-hidden border bg-muted aspect-square"
                >
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setGeneratedImage(img.imageUrl);
                      setPrompt(img.prompt);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-white text-xs line-clamp-2 text-center">{img.prompt}</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVideoDialog(img.imageUrl);
                        }}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Animate
                      </Button>
                    </div>
                  </div>
                  <button
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(img.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video History */}
      {videoHistory.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Recent Videos
              </CardTitle>
              <CardDescription>Your last {videoHistory.length} generated videos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {videoHistory.map((video) => (
                <div
                  key={video.id}
                  className="group relative rounded-lg overflow-hidden border bg-muted aspect-video"
                >
                  <video
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                  <button
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => removeVideoFromHistory(video.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-1 right-1 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleDownload(video.videoUrl, video.prompt, true)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!generatedImage && history.length === 0 && videoHistory.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Images Yet</h3>
            <p className="text-muted-foreground text-sm">
              Enter a prompt above to generate your first AI image
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video Generation Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Animate Image with Veo 3
            </DialogTitle>
            <DialogDescription>
              Transform your image into a short video using Google's Veo 3 AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source Image Preview */}
            {videoSourceImage && (
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img
                  src={videoSourceImage}
                  alt="Source"
                  className="w-full h-32 object-contain"
                />
              </div>
            )}

            {/* Animation Prompt */}
            <div className="space-y-2">
              <Label>Describe the animation</Label>
              <Textarea
                placeholder="E.g., The person waves and smiles warmly..."
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-1">
                {animationPrompts.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setVideoPrompt(example)}
                  >
                    {example.slice(0, 25)}...
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={videoDuration} onValueChange={(v) => setVideoDuration(v as "4" | "6" | "8")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 seconds</SelectItem>
                    <SelectItem value="6">6 seconds</SelectItem>
                    <SelectItem value="8">8 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Generate Audio</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={generateAudio}
                    onCheckedChange={setGenerateAudio}
                  />
                  <span className="text-sm text-muted-foreground">
                    {generateAudio ? "On" : "Off"}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Video */}
            {generatedVideo && (
              <div className="space-y-2">
                <Label>Generated Video</Label>
                <div className="rounded-lg overflow-hidden border bg-black">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(generatedVideo, videoPrompt, true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVideoDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo || !videoPrompt.trim()}
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating (~1 min)...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
