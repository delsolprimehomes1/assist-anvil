import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Calendar, User } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RAGUpload {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  status: string;
  uploaded_by: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

export const RAGUploadManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  // Fetch all RAG uploads
  const { data: uploads, isLoading } = useQuery({
    queryKey: ["rag-uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rag_uploads")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for all uploaders
      const uploaderIds = [...new Set(data?.map(u => u.uploaded_by).filter(Boolean))] as string[];
      if (uploaderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uploaderIds);

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(p => {
          profilesMap[p.id] = { full_name: p.full_name, email: p.email };
        });
        setProfiles(profilesMap);
      }

      return data as RAGUpload[];
    },
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("rag-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("rag-documents")
        .getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase
        .from("rag_uploads")
        .insert({
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          status: "pending",
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      // Send to n8n for RAG processing
      try {
        const webhookResponse = await fetch(
          'https://n8n2.a3innercircle.com/webhook/2fe6e7d2-08eb-44f3-811e-7bc702092c08',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileUrl: publicUrl,
              fileName: file.name,
              fileSize: file.size,
              uploadedBy: user.id,
              uploadedAt: new Date().toISOString(),
            }),
          }
        );
        
        // Update status to 'processing' if webhook succeeded
        if (webhookResponse.ok) {
          await supabase
            .from('rag_uploads')
            .update({ status: 'processing' })
            .eq('file_url', publicUrl);
        }
      } catch (webhookError) {
        console.error('Webhook call failed:', webhookError);
        // File is still uploaded, just mark as pending for manual retry
      }

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-uploads"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (upload: RAGUpload) => {
      // Delete from storage
      const filePath = upload.file_url.split("/").slice(-2).join("/");
      await supabase.storage.from("rag-documents").remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("rag_uploads")
        .delete()
        .eq("id", upload.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-uploads"] });
      toast({
        title: "Deleted",
        description: "Document removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize: 10485760, // 10MB
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "outline",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Documents to RAG Store</h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {uploading ? (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop documents here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Upload History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload History</h3>
        
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !uploads || uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {upload.file_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(upload.file_size)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {upload.uploaded_by && profiles[upload.uploaded_by]?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {upload.uploaded_by && profiles[upload.uploaded_by]?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(upload.uploaded_at), "MMM d, yyyy h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(upload.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(upload)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};
