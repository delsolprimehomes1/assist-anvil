import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ScheduleList } from "./ScheduleList";
import { ScheduleFormDialog } from "./ScheduleFormDialog";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
  created_at: string;
}

export const ScheduleManagement = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    fetchScheduleItems();

    // Set up realtime subscription
    const channel = supabase
      .channel('schedule_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_items'
        },
        () => {
          fetchScheduleItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScheduleItems = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setScheduleItems(data || []);
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      toast.error('Failed to load schedule items');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Schedule item deleted');
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      toast.error('Failed to delete schedule item');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schedule Management</h2>
          <p className="text-muted-foreground">Manage daily schedule items for agents</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule Item
        </Button>
      </div>

      <ScheduleList
        scheduleItems={scheduleItems}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ScheduleFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
        onSuccess={fetchScheduleItems}
      />
    </div>
  );
};