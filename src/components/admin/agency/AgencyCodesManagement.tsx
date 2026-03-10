import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type AgencyCode = {
  id: string;
  code: string;
  label: string | null;
  display_order: number;
  is_active: boolean;
};

type AgencyManager = {
  id: string;
  agency_code_id: string;
  manager_name: string;
  display_order: number;
  is_active: boolean;
};

export const AgencyCodesManagement = () => {
  const queryClient = useQueryClient();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<AgencyCode | null>(null);
  const [editingManager, setEditingManager] = useState<AgencyManager | null>(null);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [codeForm, setCodeForm] = useState({ code: "", label: "", display_order: 0 });
  const [managerForm, setManagerForm] = useState({ manager_name: "", display_order: 0 });

  const { data: agencyCodes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ["agency-codes-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_codes")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as AgencyCode[];
    },
  });

  const { data: allManagers = [] } = useQuery({
    queryKey: ["agency-managers-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_managers")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as AgencyManager[];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-codes-admin"] });
    queryClient.invalidateQueries({ queryKey: ["agency-managers-admin"] });
  };

  // Code mutations
  const saveCode = useMutation({
    mutationFn: async () => {
      if (editingCode) {
        const { error } = await supabase
          .from("agency_codes")
          .update({ code: codeForm.code, label: codeForm.label || null, display_order: codeForm.display_order })
          .eq("id", editingCode.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_codes")
          .insert({ code: codeForm.code, label: codeForm.label || null, display_order: codeForm.display_order });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCode ? "Agency code updated" : "Agency code added");
      setCodeDialogOpen(false);
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agency_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agency code deleted"); invalidateAll(); },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleCodeActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("agency_codes").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  // Manager mutations
  const saveManager = useMutation({
    mutationFn: async () => {
      if (editingManager) {
        const { error } = await supabase
          .from("agency_managers")
          .update({ manager_name: managerForm.manager_name, display_order: managerForm.display_order })
          .eq("id", editingManager.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_managers")
          .insert({ agency_code_id: selectedCodeId!, manager_name: managerForm.manager_name, display_order: managerForm.display_order });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingManager ? "Manager updated" : "Manager added");
      setManagerDialogOpen(false);
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const deleteManager = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agency_managers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Manager removed"); invalidateAll(); },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleManagerActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("agency_managers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const openAddCode = () => {
    setEditingCode(null);
    setCodeForm({ code: "", label: "", display_order: agencyCodes.length });
    setCodeDialogOpen(true);
  };

  const openEditCode = (c: AgencyCode) => {
    setEditingCode(c);
    setCodeForm({ code: c.code, label: c.label || "", display_order: c.display_order });
    setCodeDialogOpen(true);
  };

  const openAddManager = (codeId: string) => {
    setSelectedCodeId(codeId);
    setEditingManager(null);
    const managers = allManagers.filter(m => m.agency_code_id === codeId);
    setManagerForm({ manager_name: "", display_order: managers.length });
    setManagerDialogOpen(true);
  };

  const openEditManager = (m: AgencyManager) => {
    setSelectedCodeId(m.agency_code_id);
    setEditingManager(m);
    setManagerForm({ manager_name: m.manager_name, display_order: m.display_order });
    setManagerDialogOpen(true);
  };

  if (loadingCodes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="stat-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Agency Codes & Managers
              </CardTitle>
              <CardDescription>Manage agency codes and their assigned managers for the onboarding form</CardDescription>
            </div>
            <Button onClick={openAddCode}>
              <Plus className="mr-2 h-4 w-4" />
              Add Agency Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Managers</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencyCodes.map((ac) => {
                const managers = allManagers.filter(m => m.agency_code_id === ac.id);
                return (
                  <TableRow key={ac.id}>
                    <TableCell className="font-mono font-semibold">{ac.code}</TableCell>
                    <TableCell className="text-muted-foreground">{ac.label || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {managers.map((m) => (
                          <Badge
                            key={m.id}
                            variant={m.is_active ? "default" : "secondary"}
                            className="cursor-pointer group relative pr-7"
                            onClick={() => openEditManager(m)}
                          >
                            {m.manager_name}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleManagerActive.mutate({ id: m.id, is_active: !m.is_active }); }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                              title={m.is_active ? "Deactivate" : "Activate"}
                            >
                              {m.is_active ? "✓" : "✗"}
                            </button>
                          </Badge>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openAddManager(ac.id)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ac.is_active}
                        onCheckedChange={(checked) => toggleCodeActive.mutate({ id: ac.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditCode(ac)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Agency Code {ac.code}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will also delete all managers assigned to this code. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCode.mutate(ac.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Agency Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Agency Code" : "Add Agency Code"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={codeForm.code} onChange={(e) => setCodeForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. 100" />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input value={codeForm.label} onChange={(e) => setCodeForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Lifeco Agency Direct" />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={codeForm.display_order} onChange={(e) => setCodeForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveCode.mutate()} disabled={!codeForm.code || saveCode.isPending}>
              {saveCode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingCode ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Manager Dialog */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManager ? "Edit Manager" : "Add Manager"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Manager Name</Label>
              <Input value={managerForm.manager_name} onChange={(e) => setManagerForm(p => ({ ...p, manager_name: e.target.value }))} placeholder="e.g. K. Jenson" />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={managerForm.display_order} onChange={(e) => setManagerForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
            </div>
            {editingManager && (
              <div className="pt-2 border-t">
                <Button variant="destructive" size="sm" onClick={() => { deleteManager.mutate(editingManager.id); setManagerDialogOpen(false); }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Manager
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveManager.mutate()} disabled={!managerForm.manager_name || saveManager.isPending}>
              {saveManager.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingManager ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
