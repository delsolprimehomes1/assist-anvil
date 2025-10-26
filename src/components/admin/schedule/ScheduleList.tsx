import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
  created_at: string;
}

interface ScheduleListProps {
  scheduleItems: ScheduleItem[];
  loading: boolean;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}

export const ScheduleList = ({
  scheduleItems,
  loading,
  onEdit,
  onDelete,
}: ScheduleListProps) => {
  if (loading) {
    return <div className="text-center py-8">Loading schedule items...</div>;
  }

  if (scheduleItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No schedule items yet. Create your first one!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {scheduleItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(item.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {item.time}
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};