import { useState, useMemo } from "react";
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
import { getDealRecommendation, calcProfit, calcROI } from "@/lib/calculations";
import { Search, SlidersHorizontal, Flame, CheckCircle2, AlertTriangle, Car, ArrowUpDown } from "lucide-react";
import type { Vehicle } from "@shared/schema";
import { MARKET_COUNTRIES } from "@shared/schema";

type SortOption = "score_desc" | "profit_desc" | "roi_desc" | "price_asc" | "price_desc" | "year_desc" | "km_asc";

const sortLabels: Record<SortOption, string> = {
  score_desc: "Deal Score (High-Low)",
  profit_desc: "Profit (High-Low)",
  roi_desc: "ROI (High-Low)",
  price_asc: "Price (Low-High)",
  price_desc: "Price (High-Low)",
  year_desc: "Year (Newest)",
  km_asc: "Mileage (Lowest)",
};

function sortVehicles(vehicles: Vehicle[], sort: SortOption): Vehicle[] {
  return [...vehicles].sort((a, b) => {
    switch (sort) {
      case "score_desc": return (b.dealScore || 0) - (a.dealScore || 0);
      case "profit_desc": return calcProfit(b, "normal") - calcProfit(a, "normal");
      case "roi_desc": return calcROI(b, "normal") - calcROI(a, "normal");
      case "price_asc": return (a.purchasePrice || 0) - (b.purchasePrice || 0);
      case "price_desc": return (b.purchasePrice || 0) - (a.purchasePrice || 0);
      case "year_desc": return (b.year || 0) - (a.year || 0);
      case "km_asc": return (a.mileageKm || 0) - (b.mileageKm || 0);
      default: return 0;
    }
  });
}

export default function AuctionFinder() {
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [minProfit, setMinProfit] = useState("");
  const [minROI, setMinROI] = useState("");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [gearFilter, setGearFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [vatFilter, setVatFilter] = useState("all");
  const [hideRisk, setHideRisk] = useState(false);
  const [onlyEV, setOnlyEV] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("score_desc");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const filtered = useMemo(() => {
    let result = allVehicles.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = `${v.make} ${v.model} ${v.variant || ""}`.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (maxPrice && v.purchasePrice && v.purchasePrice > parseFloat(maxPrice)) return false;
      if (minPrice && v.purchasePrice && v.purchasePrice < parseFloat(minPrice)) return false;
      if (minProfit) {
        const profit = calcProfit(v, "normal");
        if (profit < parseFloat(minProfit)) return false;
      }
      if (minROI) {
        const roi = calcROI(v, "normal");
        if (roi < parseFloat(minROI)) return false;
      }
      if (fuelFilter !== "all" && v.fuelType !== fuelFilter) return false;
      if (gearFilter !== "all" && v.gearbox !== gearFilter) return false;
      if (countryFilter !== "all" && v.sourceCountry !== countryFilter) return false;
      if (vatFilter !== "all" && v.vatType !== vatFilter) return false;
      if (hideRisk && getDealRecommendation(v.dealScore || 0) === "drop") return false;
      if (onlyEV && v.fuelType !== "electric") return false;
      return true;
    });
    return sortVehicles(result, sortBy);
  }, [allVehicles, searchQuery, maxPrice, minPrice, minProfit, minROI, fuelFilter, gearFilter, countryFilter, vatFilter, hideRisk, onlyEV, sortBy]);

  const hotDeals = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "buy");
  const consider = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "consider");
  const risk = filtered.filter(v => getDealRecommendation(v.dealScore || 0) === "drop");

  const sourceCountries = useMemo(() => {
    return [...new Set(allVehicles.map(v => v.sourceCountry).filter(Boolean))].sort();
  }, [allVehicles]);

  const resetFilters = () => {
    setSearchQuery("");
    setMaxPrice("");
    setMinPrice("");
    setMinProfit("");
    setMinROI("");
    setFuelFilter("all");
    setGearFilter("all");
    setCountryFilter("all");
    setVatFilter("all");
    setHideRisk(false);
    setOnlyEV(false);
    setSortBy("score_desc");
  };

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
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {allVehicles.length} vehicles
            {hotDeals.length > 0 && <span className="text-[#FF6319]"> &middot; {hotDeals.length} hot deals</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button variant="ghost" onClick={resetFilters} data-testid="button-reset-filters">
            Reset
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-3 pt-3 border-t">
            <div>
              <Label className="text-xs">Min Price (EUR)</Label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                data-testid="input-min-price"
              />
            </div>
            <div>
              <Label className="text-xs">Max Price (EUR)</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                data-testid="input-max-price"
              />
            </div>
            <div>
              <Label className="text-xs">Min Profit (DKK)</Label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={minProfit}
                onChange={(e) => setMinProfit(e.target.value)}
                data-testid="input-min-profit"
              />
            </div>
            <div>
              <Label className="text-xs">Min ROI (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={minROI}
                onChange={(e) => setMinROI(e.target.value)}
                data-testid="input-min-roi"
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
                  <SelectItem value="hybrid">Hybrid/PHEV</SelectItem>
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
            <div>
              <Label className="text-xs">Source Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {sourceCountries.map(c => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">VAT Type</Label>
              <Select value={vatFilter} onValueChange={setVatFilter}>
                <SelectTrigger data-testid="select-vat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="eu_reverse_charge">EU Reverse Charge</SelectItem>
                  <SelectItem value="margin">Margin Scheme</SelectItem>
                  <SelectItem value="dk_vat">DK VAT (25%)</SelectItem>
                  <SelectItem value="private">Private Sale</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hideRisk}
                  onCheckedChange={setHideRisk}
                  data-testid="switch-hide-risk"
                />
                <Label className="text-xs">Hide Risk</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={onlyEV}
                  onCheckedChange={setOnlyEV}
                  data-testid="switch-only-ev"
                />
                <Label className="text-xs">EV Only</Label>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
          <Flame className="w-3 h-3 mr-1" /> Hot Deals: {hotDeals.length}
        </Badge>
        <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Consider: {consider.length}
        </Badge>
        <Badge variant="outline" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" /> Risk: {risk.length}
        </Badge>
      </div>

      {hotDeals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-[#FF6319]" />
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
          <Button variant="outline" className="mt-3" onClick={resetFilters}>Reset All Filters</Button>
        </div>
      )}
    </div>
  );
}
