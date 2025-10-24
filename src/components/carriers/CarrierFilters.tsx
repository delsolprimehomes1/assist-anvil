import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface CarrierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  totalCarriers: number;
  filteredCount: number;
}

const quickFilters = [
  { label: "All Products", value: "all" },
  { label: "Term Life", value: "Term" },
  { label: "Whole Life", value: "WL" },
  { label: "Final Expense", value: "FE" },
  { label: "Annuity", value: "Annuity" },
  { label: "IUL", value: "IUL" },
];

export function CarrierFilters({
  searchTerm,
  onSearchChange,
  selectedProduct,
  onProductChange,
  sortBy,
  onSortChange,
  totalCarriers,
  filteredCount,
}: CarrierFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search carriers by name, product, or niche..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters & Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.value}
              variant={selectedProduct === filter.value ? "default" : "outline"}
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedProduct === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
              onClick={() => onProductChange(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>

        {/* Sort & Advanced Filters */}
        <div className="flex gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortChange}>
                <DropdownMenuRadioItem value="name">Name (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rating">Rating (High to Low)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="turnaround">Turnaround (Fast First)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {showAdvanced ? "Hide" : "Show"} Filters
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{filteredCount}</strong> of{" "}
          <strong className="text-foreground">{totalCarriers}</strong> carriers
        </span>
        {(searchTerm || selectedProduct !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onProductChange("all");
            }}
            className="h-8 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
