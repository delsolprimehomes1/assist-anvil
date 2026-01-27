import { useState, useMemo } from "react";
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
import { LeadPurchaseSection } from "./LeadPurchaseSection";
import { CommissionSection } from "./CommissionSection";

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
    leadsPurchased: 0,
    discountPercent: 0,
    compLevelPercent: 100,
    advancementPercent: 75,
  });

  const calculations = useMemo(() => {
    const discountMultiplier = 1 - (formData.discountPercent / 100);
    const totalLeadCost = formData.leadsPurchased * formData.costPerLead * discountMultiplier;
    
    const baseCommission = formData.revenue * (formData.compLevelPercent / 100);
    const expectedIssuePay = baseCommission * (formData.advancementPercent / 100);
    const expectedDeferredPay = baseCommission * (1 - formData.advancementPercent / 100);
    
    return {
      totalLeadCost,
      expectedIssuePay,
      expectedDeferredPay,
    };
  }, [formData.leadsPurchased, formData.costPerLead, formData.discountPercent, formData.revenue, formData.compLevelPercent, formData.advancementPercent]);

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
      await addEntry({
        ...formData,
        totalLeadCost: calculations.totalLeadCost,
        expectedIssuePay: calculations.expectedIssuePay,
        expectedDeferredPay: calculations.expectedDeferredPay,
      });
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
        leadsPurchased: 0,
        discountPercent: 0,
        compLevelPercent: 100,
        advancementPercent: 75,
      });
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Log Performance
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Track your daily activity
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date & Lead Type - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="entryDate" className="text-xs sm:text-sm">Date</Label>
              <Input
                id="entryDate"
                type="date"
                className="h-10 sm:h-11 text-sm"
                value={formData.entryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, entryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="leadType" className="text-xs sm:text-sm">Lead Type</Label>
              <Select value={formData.leadType} onValueChange={handleLeadTypeChange}>
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {productsLoading ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : activeProducts.length === 0 ? (
                    <SelectItem value="manual" disabled>No types configured</SelectItem>
                  ) : (
                    activeProducts.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name} (${product.price})
                      </SelectItem>
                    ))
                  )}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Purchase Section */}
          <LeadPurchaseSection
            leadsPurchased={formData.leadsPurchased}
            discountPercent={formData.discountPercent}
            costPerLead={formData.costPerLead}
            totalLeadCost={calculations.totalLeadCost}
            onLeadsPurchasedChange={(v) => setFormData((prev) => ({ ...prev, leadsPurchased: v }))}
            onDiscountChange={(v) => setFormData((prev) => ({ ...prev, discountPercent: v }))}
          />

          {/* Activity Section */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Activity
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="leadsWorked" className="text-xs sm:text-sm">Leads Worked</Label>
                <Input
                  id="leadsWorked"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.leadsWorked}
                  onChange={(e) => setFormData((prev) => ({ ...prev, leadsWorked: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="dialsMade" className="text-xs sm:text-sm">Dials Made</Label>
                <Input
                  id="dialsMade"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.dialsMade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dialsMade: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Appointments Section */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Appointments
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="appointmentsSet" className="text-xs sm:text-sm">Appts Set</Label>
                <Input
                  id="appointmentsSet"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.appointmentsSet}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appointmentsSet: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="appointmentsHeld" className="text-xs sm:text-sm">Appts Held</Label>
                <Input
                  id="appointmentsHeld"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.appointmentsHeld}
                  onChange={(e) => setFormData((prev) => ({ ...prev, appointmentsHeld: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Results
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="clientsClosed" className="text-xs sm:text-sm">Clients Closed</Label>
                <Input
                  id="clientsClosed"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.clientsClosed}
                  onChange={(e) => setFormData((prev) => ({ ...prev, clientsClosed: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="revenue" className="text-xs sm:text-sm">Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="h-10 sm:h-11 text-sm"
                  value={formData.revenue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Commission Section */}
          <CommissionSection
            revenue={formData.revenue}
            compLevelPercent={formData.compLevelPercent}
            advancementPercent={formData.advancementPercent}
            expectedIssuePay={calculations.expectedIssuePay}
            expectedDeferredPay={calculations.expectedDeferredPay}
            onCompLevelChange={(v) => setFormData((prev) => ({ ...prev, compLevelPercent: v }))}
            onAdvancementChange={(v) => setFormData((prev) => ({ ...prev, advancementPercent: v }))}
          />

          {/* Cost Section */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Cost Per Lead
            </div>
            <Input
              id="costPerLead"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="h-10 sm:h-11 text-sm"
              value={formData.costPerLead}
              onChange={(e) => setFormData((prev) => ({ ...prev, costPerLead: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              className="text-sm min-h-[60px] resize-none"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Submit Button - Larger touch target on mobile */}
          <Button 
            type="submit" 
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" 
            disabled={submitting || !formData.leadType}
          >
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
