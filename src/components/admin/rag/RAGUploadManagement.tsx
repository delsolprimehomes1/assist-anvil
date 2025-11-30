import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Calendar, User, Upload, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
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
  notes: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
}

export const RAGUploadManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [notes, setNotes] = useState("");

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

  // Upload to webhook mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentName, notes }: { file: File; documentName: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rag-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("rag-documents")
        .getPublicUrl(fileName);

      // 2. Send to n8n webhook
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", documentName);
      formData.append("originalFileName", file.name);
      formData.append("uploadedBy", user.id);
      formData.append("uploadedByEmail", profile?.email || "");
      formData.append("uploadedByName", profile?.full_name || "");
      formData.append("timestamp", new Date().toISOString());

      const webhookResponse = await fetch("https://n8n2.a3innercircle.com/webhook/7b9324ac-ee1b-4fa1-953d-72db3ee58059", {
        method: "POST",
        body: formData,
      });

      if (!webhookResponse.ok) {
        throw new Error("Webhook failed");
      }

      // 3. Create record in database
      const { error: dbError } = await supabase
        .from("rag_uploads")
        .insert({
          file_name: documentName,
          file_url: publicUrl,
          file_size: file.size,
          status: "processed",
          uploaded_by: user.id,
          notes: notes || null,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-uploads"] });
      setSelectedFile(null);
      setDocumentName("");
      setNotes("");
      toast({
        title: "Success",
        description: "Document uploaded and processed successfully",
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
    mutationFn: async (uploadId: string) => {
      // Delete from database only (manual entries have no storage files)
      const { error } = await supabase
        .from("rag_uploads")
        .delete()
        .eq("id", uploadId);

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

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      if (!documentName) {
        setDocumentName(acceptedFiles[0].name);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentName.trim()) return;
    uploadMutation.mutate({ 
      file: selectedFile, 
      documentName: documentName.trim(), 
      notes: notes.trim() 
    });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Documents to RAG Store</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload documents for AI-powered processing and retrieval
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {selectedFile ? (
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground mb-1">
                  {isDragActive ? "Drop file here" : "Drag & drop file here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (PDF, DOC, DOCX, TXT)
                </p>
              </div>
            )}
          </div>

          {/* Document Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Document Name *</label>
            <Input
              placeholder="e.g., Assurity Term Underwriting Guide"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
            <Input
              placeholder="Add any additional context or notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={!selectedFile || !documentName.trim() || uploadMutation.isPending}
            className="w-full"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to RAG Store
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Document Log */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Document Log</h3>
        
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !uploads || uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents logged yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {upload.notes || "-"}
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(upload.id)}
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
