import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ScheduleItem | null;
  onSuccess: () => void;
}

export const ScheduleFormDialog = ({
  open,
  onOpenChange,
  editingItem,
  onSuccess,
}: ScheduleFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        time: editingItem.time,
        description: editingItem.description || "",
        date: editingItem.date,
      });
    } else {
      setFormData({
        title: "",
        time: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('schedule_items')
          .update({
            title: formData.title,
            time: formData.time,
            description: formData.description || null,
            date: formData.date,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Schedule item updated');
      } else {
        const { error } = await supabase
          .from('schedule_items')
          .insert({
            title: formData.title,
            time: formData.time,
            description: formData.description || null,
            date: formData.date,
          });

        if (error) throw error;
        toast.success('Schedule item created');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving schedule item:', error);
      toast.error('Failed to save schedule item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};