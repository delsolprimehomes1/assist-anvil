import { useState } from "react";
import { PerformanceEntry } from "@/hooks/useAgentPerformance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditEntryDialog } from "./EditEntryDialog";
import { Pencil, Trash2, History, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PerformanceEntriesListProps {
  entries: PerformanceEntry[];
  onUpdate: (id: string, updates: Partial<PerformanceEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export function PerformanceEntriesList({
  entries,
  onUpdate,
  onDelete,
  loading,
}: PerformanceEntriesListProps) {
  const [editingEntry, setEditingEntry] = useState<PerformanceEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    try {
      await onDelete(deletingId);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Entry History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Entry History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No performance entries logged yet. Use the form above to log your first entry.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Entry History
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({entries.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lead Type</TableHead>
                  <TableHead className="text-center">Closed</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Issue Pay</TableHead>
                  <TableHead className="text-right">Lead Cost</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const netProfit = entry.expectedIssuePay - entry.totalLeadCost;
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.entryDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{entry.leadType}</TableCell>
                      <TableCell className="text-center">{entry.clientsClosed}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-primary font-medium">
                        {formatCurrency(entry.expectedIssuePay)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(entry.totalLeadCost)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          netProfit >= 0 ? "text-green-500" : "text-destructive"
                        }`}
                      >
                        {formatCurrency(netProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEntry(entry)}
                            title="Edit entry"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(entry.id)}
                            title="Delete entry"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditEntryDialog
        entry={editingEntry}
        open={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={onUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this performance entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
