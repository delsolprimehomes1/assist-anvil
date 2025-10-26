import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string | null;
  date: string;
}

export function ScheduleCalendarDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [monthSchedule, setMonthSchedule] = useState<ScheduleItem[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchMonthSchedule();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate) {
      filterEventsByDate(selectedDate);
    }
  }, [selectedDate, monthSchedule]);

  const fetchMonthSchedule = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setMonthSchedule(data || []);
    } catch (error) {
      console.error('Error fetching month schedule:', error);
    }
  };

  const formatDateForComparison = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const filterEventsByDate = (date: Date) => {
    const dateStr = formatDateForComparison(date);
    const events = monthSchedule.filter(item => item.date === dateStr);
    setSelectedDateEvents(events);
  };

  const getDatesWithEvents = () => {
    return monthSchedule.map(item => new Date(item.date));
  };

  const getEventCountForDate = (date: Date) => {
    const dateStr = formatDateForComparison(date);
    return monthSchedule.filter(item => item.date === dateStr).length;
  };

  const modifiers = {
    hasEvents: getDatesWithEvents(),
  };

  const modifiersClassNames = {
    hasEvents: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Calendar</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </h3>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-accent/30 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {event.time}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
