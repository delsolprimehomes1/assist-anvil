import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, FileText, Plus, Building2 } from "lucide-react";
import { CarrierFormDialog } from "./CarrierFormDialog";
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

export function CarriersList() {
  const { toast } = useToast();
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<any>(null);

  const fetchCarriers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCarriers(data || []);
    } catch (error: any) {
      console.error('Error fetching carriers:', error);
      toast({
        title: "Error",
        description: "Failed to load carriers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleEdit = (carrier: any) => {
    setSelectedCarrier(carrier);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!carrierToDelete) return;

    try {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', carrierToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Carrier deleted successfully",
      });

      fetchCarriers();
    } catch (error: any) {
      console.error('Error deleting carrier:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCarrierToDelete(null);
    }
  };

  const getTurnaroundColor = (turnaround: string) => {
    switch (turnaround) {
      case 'fast': return 'bg-green-500';
      case 'average': return 'bg-yellow-500';
      case 'slow': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading carriers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Carriers</h3>
        <Button onClick={() => { setSelectedCarrier(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add New Carrier
        </Button>
      </div>

      {carriers.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No carriers added yet</p>
          <Button onClick={() => { setSelectedCarrier(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Your First Carrier
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {carriers.map((carrier) => (
            <Card key={carrier.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {carrier.logo_url && (
                    <img
                      src={carrier.logo_url}
                      alt={carrier.name}
                      className="h-16 w-16 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold">{carrier.name}</h4>
                      <Badge variant="outline">{carrier.short_code}</Badge>
                      {carrier.am_best_rating && (
                        <Badge variant="secondary">{carrier.am_best_rating}</Badge>
                      )}
                      {carrier.turnaround && (
                        <Badge className={getTurnaroundColor(carrier.turnaround)}>
                          {carrier.turnaround}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {carrier.products?.map((product: string) => (
                        <Badge key={product} variant="outline">
                          {product}
                        </Badge>
                      ))}
                    </div>
                    {carrier.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {carrier.description}
                      </p>
                    )}
                    {carrier.pdf_documents && carrier.pdf_documents.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {carrier.pdf_documents.length} document{carrier.pdf_documents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(carrier)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCarrierToDelete(carrier);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CarrierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        carrier={selectedCarrier}
        onSuccess={fetchCarriers}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {carrierToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
