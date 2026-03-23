import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export interface QuotingLinkFormData {
  carrier: string;
  name: string;
  url: string;
  type: string;
  requires_login: boolean;
  description: string;
  gradient: string;
  display_order: number;
  is_active: boolean;
}

interface QuotingLinkFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuotingLinkFormData) => Promise<void>;
  initialData?: QuotingLinkFormData | null;
  isSubmitting?: boolean;
}

const gradientOptions = [
  { value: "from-blue-500/20 via-cyan-500/10 to-transparent", label: "Blue → Cyan" },
  { value: "from-indigo-500/20 via-purple-500/10 to-transparent", label: "Indigo → Purple" },
  { value: "from-violet-500/20 via-fuchsia-500/10 to-transparent", label: "Violet → Fuchsia" },
  { value: "from-emerald-500/20 via-teal-500/10 to-transparent", label: "Emerald → Teal" },
  { value: "from-orange-500/20 via-amber-500/10 to-transparent", label: "Orange → Amber" },
  { value: "from-rose-500/20 via-pink-500/10 to-transparent", label: "Rose → Pink" },
  { value: "from-sky-500/20 via-blue-500/10 to-transparent", label: "Sky → Blue" },
  { value: "from-lime-500/20 via-green-500/10 to-transparent", label: "Lime → Green" },
];

const defaultForm: QuotingLinkFormData = {
  carrier: "",
  name: "",
  url: "",
  type: "quick-quote",
  requires_login: false,
  description: "",
  gradient: gradientOptions[0].value,
  display_order: 0,
  is_active: true,
};

export const QuotingLinkFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: QuotingLinkFormDialogProps) => {
  const [form, setForm] = useState<QuotingLinkFormData>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? defaultForm);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Quoting Link" : "Add Quoting Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Carrier Name</Label>
              <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Link Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick-quote">Quick Quote</SelectItem>
                  <SelectItem value="agent-portal">Agent Portal</SelectItem>
                  <SelectItem value="microsite">Microsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Card Gradient</Label>
            <Select value={form.gradient} onValueChange={(v) => setForm({ ...form, gradient: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {gradientOptions.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Requires Login</Label>
            <Switch checked={form.requires_login} onCheckedChange={(v) => setForm({ ...form, requires_login: v })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
