import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadProducts } from "@/hooks/useLeadProducts";
import { useAgentPerformance } from "@/hooks/useAgentPerformance";
import { Loader2, Plus, DollarSign, Phone, Users, Target } from "lucide-react";
import { format } from "date-fns";

export const PerformanceForm = () => {
  const { activeProducts, loading: productsLoading } = useLeadProducts();
  const { addEntry, loading: submitting } = useAgentPerformance();
  
  const [formData, setFormData] = useState({
    entryDate: format(new Date(), "yyyy-MM-dd"),
    leadType: "",
    leadsWorked: 0,
    dialsMade: 0,
    appointmentsSet: 0,
    appointmentsHeld: 0,
    clientsClosed: 0,
    revenue: 0,
    costPerLead: 0,
    notes: "",
  });

  const handleLeadTypeChange = (value: string) => {
    const product = activeProducts.find((p) => p.name === value);
    setFormData((prev) => ({
      ...prev,
      leadType: value,
      costPerLead: product?.price || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leadType) {
      return;
    }

    try {
      await addEntry(formData);
      // Reset form
      setFormData({
        entryDate: format(new Date(), "yyyy-MM-dd"),
        leadType: "",
        leadsWorked: 0,
        dialsMade: 0,
        appointmentsSet: 0,
        appointmentsHeld: 0,
        clientsClosed: 0,
        revenue: 0,
        costPerLead: 0,
        notes: "",
      });
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Log Performance
        </CardTitle>
        <CardDescription>Track your daily activity and results</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date</Label>
              <Input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, entryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadType">Lead Type</Label>
              <Select value={formData.leadType} onValueChange={handleLeadTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead type" />
                </SelectTrigger>
                <SelectContent>
                  {productsLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : activeProducts.length === 0 ? (
                    <SelectItem value="manual" disabled>No lead types configured</SelectItem>
                  ) : (
                    activeProducts.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name} (${product.price}/lead)
                      </SelectItem>
                    ))
                  )}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activity Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Phone className="h-4 w-4" />
              Activity
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadsWorked">Leads Worked</Label>
                <Input
                  id="leadsWorked"
                  type="number"
                  min="0"
                  value={formData.leadsWorked}
                  onChange={(e) => setFormData((prev) => ({ ...prev, leadsWorked: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialsMade">Dials Made</Label>
                <Input
                  id="dialsMade"
                  type="number"
                  min="0"
                  value={formData.dialsMade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dialsMade: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Appointments Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Appointments
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentsSet">Appts Set</Label>
                <Input
                  id="appointmentsSet"
                  type="number"
                  min="0"
                  value={formData.appointmentsSet}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appointmentsSet: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentsHeld">Appts Held</Label>
                <Input
                  id="appointmentsHeld"
                  type="number"
                  min="0"
                  value={formData.appointmentsHeld}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appointmentsHeld: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4" />
              Results
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientsClosed">Clients Closed</Label>
                <Input
                  id="clientsClosed"
                  type="number"
                  min="0"
                  value={formData.clientsClosed}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clientsClosed: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.revenue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Cost Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Cost
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerLead">Cost Per Lead ($)</Label>
              <Input
                id="costPerLead"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerLead}
                onChange={(e) => setFormData((prev) => ({ ...prev, costPerLead: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about today's activity..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !formData.leadType}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Log Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
