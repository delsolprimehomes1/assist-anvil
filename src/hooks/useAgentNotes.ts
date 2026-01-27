import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AgentNote {
  id: string;
  agentId: string;
  createdBy: string;
  createdByName?: string;
  note: string;
  noteType: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAgentNotesReturn {
  notes: AgentNote[];
  loading: boolean;
  error: string | null;
  addNote: (agentId: string, note: string, noteType?: string) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAgentNotes = (hierarchyAgentId?: string): UseAgentNotesReturn => {
  const [notes, setNotes] = useState<AgentNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!hierarchyAgentId) {
      setNotes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("agent_notes")
        .select(`
          id,
          agent_id,
          created_by,
          note,
          note_type,
          created_at,
          updated_at
        `)
        .eq("agent_id", hierarchyAgentId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch creator names separately
      const creatorIds = [...new Set((data || []).map((n: any) => n.created_by))];
      let creatorsMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", creatorIds);
        
        creatorsMap = (profiles || []).reduce((acc: Record<string, string>, p: any) => {
          acc[p.id] = p.full_name || "Unknown";
          return acc;
        }, {});
      }

      const transformedNotes: AgentNote[] = (data || []).map((row: any) => ({
        id: row.id,
        agentId: row.agent_id,
        createdBy: row.created_by,
        createdByName: creatorsMap[row.created_by] || "Unknown",
        note: row.note,
        noteType: row.note_type || "general",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setNotes(transformedNotes);
    } catch (err) {
      console.error("Error fetching agent notes:", err);
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [hierarchyAgentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (agentId: string, note: string, noteType: string = "general") => {
    if (!user?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    const { error: insertError } = await supabase.from("agent_notes").insert({
      agent_id: agentId,
      created_by: user.id,
      note,
      note_type: noteType,
    });

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      throw insertError;
    }

    toast({ title: "Note Added", description: "Your note has been saved" });
    await fetchNotes();
  };

  const updateNote = async (id: string, note: string) => {
    const { error: updateError } = await supabase
      .from("agent_notes")
      .update({ note })
      .eq("id", id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      throw updateError;
    }

    toast({ title: "Updated", description: "Note updated" });
    await fetchNotes();
  };

  const deleteNote = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("agent_notes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast({ title: "Error", description: deleteError.message, variant: "destructive" });
      throw deleteError;
    }

    toast({ title: "Deleted", description: "Note removed" });
    await fetchNotes();
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};
