import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { VehicleCard } from "@/components/vehicle-card";
import { getDealRecommendation } from "@/lib/calculations";
import { Search, SlidersHorizontal, Flame, CheckCircle2, AlertTriangle, Car } from "lucide-react";
import type { Vehicle } from "@shared/schema";

export default function AuctionFinder() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [minProfit, setMinProfit] = useState("");
  const [minROI, setMinROI] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [gearFilter, setGearFilter] = useState("all");
  const [hideRisk, setHideRisk] = useState(false);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const filtered = allVehicles.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = `${v.make} ${v.model} ${v.variant || ""}`.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (maxPrice && v.purchasePrice && v.purchasePrice > parseFloat(maxPrice)) return false;
    if (fuelFilter !== "all" && v.fuelType !== fuelFilter) return false;
    if (gearFilter !== "all" && v.gearbox !== gearFilter) return false;
    if (hideRisk && getDealRecommendation(v.dealScore || 0) === "drop") return false;
    return true;
  });

  const hotDeals = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "buy");
  const consider = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "consider");
  const risk = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "drop");

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Auction Finder</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} vehicles found</p>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search make, model, variant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t">
            <div>
              <Label className="text-xs">Max Purchase Price</Label>
              <Input
                type="number"
                placeholder="e.g. 200000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                data-testid="input-max-price"
              />
            </div>
            <div>
              <Label className="text-xs">Fuel Type</Label>
              <Select value={fuelFilter} onValueChange={setFuelFilter}>
                <SelectTrigger data-testid="select-fuel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Gearbox</Label>
              <Select value={gearFilter} onValueChange={setGearFilter}>
                <SelectTrigger data-testid="select-gear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hideRisk}
                  onCheckedChange={setHideRisk}
                  data-testid="switch-hide-risk"
                />
                <Label className="text-xs">Hide Risk</Label>
              </div>
            </div>
          </div>
        )}
      </Card>

      {hotDeals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Hot Deals</h2>
            <Badge variant="secondary" className="text-xs">{hotDeals.length}</Badge>
          </div>
          <div className="space-y-2">
            {hotDeals.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      )}

      {consider.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Consider</h2>
            <Badge variant="secondary" className="text-xs">{consider.length}</Badge>
          </div>
          <div className="space-y-2">
            {consider.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      )}

      {!hideRisk && risk.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold">Risk Vehicles</h2>
            <Badge variant="secondary" className="text-xs">{risk.length}</Badge>
          </div>
          <div className="space-y-2">
            {risk.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No vehicles found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search criteria</p>
        </div>
      )}
    </div>
  );
}
