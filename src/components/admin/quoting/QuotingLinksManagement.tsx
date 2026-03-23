import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Zap, ExternalLink } from "lucide-react";
import { QuotingLinkFormDialog, type QuotingLinkFormData } from "./QuotingLinkFormDialog";

type QuotingLink = {
  id: string;
  carrier: string;
  name: string;
  url: string;
  type: string;
  requires_login: boolean;
  description: string;
  gradient: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

export const QuotingLinksManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuotingLink | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["admin-quoting-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrier_quoting_links")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as QuotingLink[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: QuotingLinkFormData & { id?: string }) => {
      const { id, ...rest } = data;
      if (id) {
        const { error } = await supabase.from("carrier_quoting_links").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("carrier_quoting_links").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quoting-links"] });
      queryClient.invalidateQueries({ queryKey: ["carrier-quoting-links"] });
      setDialogOpen(false);
      setEditingLink(null);
      toast({ title: "Saved", description: "Quoting link saved successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carrier_quoting_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quoting-links"] });
      queryClient.invalidateQueries({ queryKey: ["carrier-quoting-links"] });
      toast({ title: "Deleted", description: "Quoting link removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("carrier_quoting_links").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quoting-links"] });
      queryClient.invalidateQueries({ queryKey: ["carrier-quoting-links"] });
    },
  });

  const handleEdit = (link: QuotingLink) => {
    setEditingLink(link);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: QuotingLinkFormData) => {
    await saveMutation.mutateAsync({ ...data, id: editingLink?.id });
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "quick-quote": return "Quick Quote";
      case "agent-portal": return "Agent Portal";
      case "microsite": return "Microsite";
      default: return type;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Carrier Quoting Links
            </CardTitle>
            <CardDescription>Manage the quoting tools and carrier links agents see</CardDescription>
          </div>
          <Button onClick={() => { setEditingLink(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No quoting links yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>{link.display_order}</TableCell>
                      <TableCell className="font-medium">{link.carrier}</TableCell>
                      <TableCell>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          {link.name} <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabel(link.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: link.id, is_active: v })}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(link)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <QuotingLinkFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingLink(null); }}
        onSubmit={handleSubmit}
        initialData={editingLink ? {
          carrier: editingLink.carrier,
          name: editingLink.name,
          url: editingLink.url,
          type: editingLink.type,
          requires_login: editingLink.requires_login,
          description: editingLink.description,
          gradient: editingLink.gradient,
          display_order: editingLink.display_order,
          is_active: editingLink.is_active,
        } : null}
        isSubmitting={saveMutation.isPending}
      />
    </>
  );
};
