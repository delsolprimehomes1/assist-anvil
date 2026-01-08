import { useState, useCallback, useRef } from "react";
import { Video, Upload, Link, Loader2, Clock, ListChecks, FileText, Sparkles, Play, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";

interface KeyMoment {
  timestamp: string;
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
}

interface AnalysisResult {
  summary: string;
  key_moments: KeyMoment[];
  transcript?: Array<{ timestamp: string; text: string }>;
  action_items: string[];
}

type AnalysisType = "key_moments" | "summary" | "transcript" | "custom";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function VideoUnderstanding() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("key_moments");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB. For larger videos, use a URL instead.",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    setVideoUrl("");
    setVideoPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/mp4": [], "video/webm": [], "video/quicktime": [] },
    maxFiles: 1,
  });

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(url || null);
    setResult(null);
  };

  const clearVideo = () => {
    setVideoUrl("");
    setVideoFile(null);
    if (videoPreviewUrl && !videoUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setResult(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleAnalyze = async () => {
    if (!videoUrl && !videoFile) {
      toast({
        title: "No video selected",
        description: "Please upload a video or enter a URL",
        variant: "destructive",
      });
      return;
    }

    if (analysisType === "custom" && !customPrompt.trim()) {
      toast({
        title: "Custom prompt required",
        description: "Please enter a custom analysis prompt",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      let requestBody: any = {
        analysis_type: analysisType,
        custom_prompt: analysisType === "custom" ? customPrompt : undefined,
      };

      if (videoUrl) {
        requestBody.video_url = videoUrl;
        requestBody.mime_type = "video/mp4";
      } else if (videoFile) {
        const base64 = await fileToBase64(videoFile);
        requestBody.video_data = base64;
        requestBody.mime_type = videoFile.type;
      }

      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: requestBody,
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as AnalysisResult);
      toast({ title: "Analysis complete!" });
    } catch (error) {
      console.error("Video analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const seekToTimestamp = (timestamp: string) => {
    if (!videoRef.current) return;

    const parts = timestamp.split(":");
    let seconds = 0;
    
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }

    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Understanding
          </CardTitle>
          <CardDescription>
            Upload or paste a video URL to find key moments, generate summaries, and extract insights using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Input */}
          {!videoPreviewUrl ? (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Drop video here...</p>
                ) : (
                  <div>
                    <p className="text-muted-foreground">
                      Drag & drop a video here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, WebM, MOV • Max 20MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Paste video URL (YouTube, Vimeo, direct link...)"
                    value={videoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-[300px]"
                />
              </div>
              <Button variant="outline" size="sm" onClick={clearVideo}>
                Choose Different Video
              </Button>
            </div>
          )}

          {/* Analysis Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Analysis Type</Label>
            <RadioGroup
              value={analysisType}
              onValueChange={(v) => setAnalysisType(v as AnalysisType)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="key_moments"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  analysisType === "key_moments" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="key_moments" id="key_moments" />
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Key Moments</p>
                  <p className="text-xs text-muted-foreground">Find important timestamps</p>
                </div>
              </Label>

              <Label
                htmlFor="summary"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  analysisType === "summary" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="summary" id="summary" />
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Summary</p>
                  <p className="text-xs text-muted-foreground">Get a video overview</p>
                </div>
              </Label>

              <Label
                htmlFor="transcript"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  analysisType === "transcript" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="transcript" id="transcript" />
                <ListChecks className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Transcript</p>
                  <p className="text-xs text-muted-foreground">Transcribe with timestamps</p>
                </div>
              </Label>

              <Label
                htmlFor="custom"
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  analysisType === "custom" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="custom" id="custom" />
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Custom</p>
                  <p className="text-xs text-muted-foreground">Ask anything</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Custom Prompt */}
          {analysisType === "custom" && (
            <Textarea
              placeholder="What would you like to know about this video?"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          )}

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!videoUrl && !videoFile)}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing video...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {result.summary && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Key Moments */}
            {result.key_moments && result.key_moments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Key Moments ({result.key_moments.length})
                </h3>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {result.key_moments.map((moment, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 font-mono"
                          onClick={() => seekToTimestamp(moment.timestamp)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {moment.timestamp}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{moment.title}</p>
                            <Badge className={`shrink-0 text-xs ${getImportanceColor(moment.importance)}`}>
                              {moment.importance}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {moment.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Transcript */}
            {result.transcript && result.transcript.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Transcript
                </h3>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-2">
                    {result.transcript.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 text-sm"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 font-mono text-xs h-auto py-1 px-2"
                          onClick={() => seekToTimestamp(entry.timestamp)}
                        >
                          {entry.timestamp}
                        </Button>
                        <p className="text-muted-foreground">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Action Items */}
            {result.action_items && result.action_items.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {result.action_items.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Tips for best results</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use videos with clear audio for better transcript accuracy</li>
                <li>• Shorter videos (under 5 minutes) analyze faster</li>
                <li>• For large files, upload to a cloud service and use the URL</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
