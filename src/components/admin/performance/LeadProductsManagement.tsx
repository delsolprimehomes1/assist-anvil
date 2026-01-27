import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLeadProducts, LeadProduct } from "@/hooks/useLeadProducts";
import { Plus, Edit2, Trash2, Loader2, Package } from "lucide-react";

const categories = ["Facebook Ads", "Direct Mail", "TV Leads", "Internet Leads", "Referrals", "Transfer Leads", "Other"];

export const LeadProductsManagement = () => {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useLeadProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LeadProduct | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    minQuantity: 1,
    expectedConversion: 0,
    badge: "",
    status: "active",
  });

  const openDialog = (product?: LeadProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        minQuantity: product.minQuantity,
        expectedConversion: product.expectedConversion || 0,
        badge: product.badge || "",
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "",
        price: 0,
        minQuantity: 1,
        expectedConversion: 0,
        badge: "",
        status: "active",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      setDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead product?")) {
      await deleteProduct(id);
    }
  };

  const toggleStatus = async (product: LeadProduct) => {
    await updateProduct(product.id, {
      status: product.status === "active" ? "inactive" : "active",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Lead Products
              </CardTitle>
              <CardDescription>
                Configure lead types and pricing for performance tracking
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lead products configured. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price/Lead</TableHead>
                  <TableHead>Min Qty</TableHead>
                  <TableHead>Exp. Conv.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.badge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {product.badge}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.minQuantity}</TableCell>
                    <TableCell>
                      {product.expectedConversion ? `${product.expectedConversion}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.status === "active"}
                        onCheckedChange={() => toggleStatus(product)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Lead Product" : "Add Lead Product"}
            </DialogTitle>
            <DialogDescription>
              Configure a lead type for agents to track their performance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Facebook Final Expense"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price Per Lead ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minQuantity">Min Quantity</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="1"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minQuantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedConversion">Expected Conversion (%)</Label>
                <Input
                  id="expectedConversion"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.expectedConversion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expectedConversion: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Badge Label (optional)</Label>
                <Input
                  id="badge"
                  value={formData.badge}
                  onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="e.g., HOT, NEW"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? "Update" : "Add"} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
