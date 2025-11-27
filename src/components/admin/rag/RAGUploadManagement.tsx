import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Calendar, User, Plus } from "lucide-react";
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
  const [fileName, setFileName] = useState("");
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

  // Add manual entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async ({ fileName, notes }: { fileName: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rag_uploads")
        .insert({
          file_name: fileName,
          file_url: "",
          file_size: 0,
          status: "pending",
          uploaded_by: user.id,
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-uploads"] });
      setFileName("");
      setNotes("");
      toast({
        title: "Success",
        description: "Document entry added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add entry",
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

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    addEntryMutation.mutate({ fileName: fileName.trim(), notes: notes.trim() });
  };

  return (
    <div className="space-y-6">
      {/* n8n Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Documents to RAG Store</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use the form below to upload documents for RAG processing
        </p>
        <div className="w-full rounded-lg overflow-hidden border border-border bg-white">
          <iframe 
            src="https://n8n2.a3innercircle.com/form-test/53507463-04ff-4627-a563-c1fcee98d7cb"
            className="w-full h-[600px]"
            title="RAG Document Upload"
          />
        </div>
      </Card>

      {/* Manual Tracking Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Track Uploaded Documents</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manually log documents you've uploaded via the form above for your records
        </p>
        <form onSubmit={handleAddEntry} className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="Document name (e.g., underwriting-guide.pdf)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="flex-1"
            required
          />
          <Input 
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={addEntryMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
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
