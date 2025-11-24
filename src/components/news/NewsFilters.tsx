import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface NewsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  newsType: string;
  onNewsTypeChange: (value: string) => void;
  carrierId: string;
  onCarrierIdChange: (value: string) => void;
  includeArchived: boolean;
  onIncludeArchivedChange: (value: boolean) => void;
  carriers: Array<{ id: string; name: string }>;
}

export const NewsFilters = ({
  search,
  onSearchChange,
  newsType,
  onNewsTypeChange,
  carrierId,
  onCarrierIdChange,
  includeArchived,
  onIncludeArchivedChange,
  carriers,
}: NewsFiltersProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search news..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>News Type</Label>
          <Select value={newsType} onValueChange={onNewsTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="state_approval">State Approval</SelectItem>
              <SelectItem value="product_update">Product Update</SelectItem>
              <SelectItem value="new_product">New Product</SelectItem>
              <SelectItem value="rate_change">Rate Change</SelectItem>
              <SelectItem value="underwriting_change">Underwriting Update</SelectItem>
              <SelectItem value="general">General News</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Carrier</Label>
          <Select value={carrierId} onValueChange={onCarrierIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="All carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map((carrier) => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="archived"
          checked={includeArchived}
          onCheckedChange={onIncludeArchivedChange}
        />
        <Label htmlFor="archived" className="cursor-pointer">
          Show archived news
        </Label>
      </div>
    </div>
  );
};
