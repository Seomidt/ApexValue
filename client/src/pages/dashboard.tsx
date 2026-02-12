import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DealScoreBadge, DealRecommendationBadge, DealScoreLegend } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags, getDealRecommendation } from "@/lib/calculations";
import {
  GitBranch, TrendingUp, BarChart3, Flame, AlertTriangle,
  Plus, FileText, ArrowRight, Car, Search, Calculator,
  Calendar, Gauge, Fuel, Settings2, Eye, MapPin, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";
import { MARKET_COUNTRIES } from "@shared/schema";

function KPICard({ title, value, subtitle, icon: Icon, accent }: {
  title: string; value: string; subtitle?: string; icon: any; accent?: boolean;
}) {
  return (
    <Card className="p-4" data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${accent ? "text-[#FF6319]" : ""}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function VehicleSearchCard({ v }: { v: Vehicle }) {
  const { t } = useLanguage();
  const profit = calcProfit(v, "normal");
  const score = v.dealScore || 0;
  const placeholderImg = `https://placehold.co/400x240/1a2332/B9D9EB?text=${encodeURIComponent(v.make + ' ' + v.model)}`;
  const imgSrc = v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : placeholderImg;
  const country = MARKET_COUNTRIES.find(c => c.code === v.sourceCountry);

  return (
    <Card className="overflow-visible" data-testid={`card-vehicle-${v.id}`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm truncate" data-testid={`text-vehicle-title-${v.id}`}>
            {v.make} {v.model} {v.year}
          </h3>
          <div className="flex-shrink-0 bg-[#FF6319] text-white px-2 py-1 rounded-md text-center">
            <p className="text-[10px] font-medium leading-none">{t("dashboard.deal_score")}</p>
            <p className="text-lg font-bold leading-tight tabular-nums">{score}</p>
          </div>
        </div>

        <div className="relative mb-2 rounded-md overflow-hidden bg-muted">
          <img src={imgSrc} alt={`${v.make} ${v.model}`} className="w-full h-32 object-cover" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
          <span>{v.variant || `${v.enginePower || ""}hk`}</span>
          <span>/</span>
          <span>{formatNumber(v.mileageKm)} km</span>
          {country && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {country.name} - {v.sourceType === "auction" ? t("dashboard.auction").toLowerCase() : t("dashboard.portal").toLowerCase()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground">{v.purchaseCurrency}</span>
            <span className="text-base font-bold ml-1 tabular-nums">{formatNumber(v.purchasePrice || 0)}</span>
          </div>
          <Link href={`/vehicle/${v.id}`}>
            <Button size="sm" variant="outline" data-testid={`button-details-${v.id}`}>
              {t("dashboard.see_details")} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ProfitCalculator({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>("");
  const selected = vehicles.find(v => v.id === parseInt(selectedId));

  const purchaseTotal = selected ? (selected.purchasePrice || 0) : 0;
  const regTax = selected ? (selected.registrationTax || 0) : 0;
  const transport = selected ? (selected.transportCost || 0) : 0;
  const costs = selected ? ((selected.preparationCost || 0) + (selected.inspectionCost || 0) + (selected.otherCosts || 0) + (selected.auctionFees || 0)) : 0;
  const profit = selected ? calcProfit(selected, "normal") : 0;

  return (
    <Card className="p-4" data-testid="card-profit-calculator">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4" /> {t("dashboard.profit_calculator")}
      </h3>
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="mb-3" data-testid="select-calc-vehicle">
          <SelectValue placeholder={t("dashboard.select_vehicle")} />
        </SelectTrigger>
        <SelectContent>
          {vehicles.slice(0, 20).map(v => (
            <SelectItem key={v.id} value={String(v.id)}>
              {v.make} {v.model} {v.year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("dashboard.purchase_price")}:</span>
            <span className="font-semibold tabular-nums">{formatCurrency(purchaseTotal, selected.purchaseCurrency)} {selected.purchaseCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("dashboard.tax")}:</span>
            <span className="font-semibold tabular-nums">{formatCurrency(regTax, "DKK")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("dashboard.transport")}:</span>
            <span className="font-semibold tabular-nums">{formatCurrency(transport, "DKK")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("dashboard.costs")}:</span>
            <span className="font-semibold tabular-nums">{formatCurrency(costs, "DKK")}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("dashboard.expected_profit")}:</span>
            <span className={`font-bold tabular-nums ${profit >= 0 ? "text-[#FF6319]" : "text-red-500"}`}>
              {formatCurrency(profit, "DKK")}
            </span>
          </div>
          <Link href={`/vehicle/${selected.id}`}>
            <Button className="w-full mt-2 bg-[#FF6319] hover:bg-[#FF6319]/90 text-white" data-testid="button-calc-details">
              {t("dashboard.calculate_profit")}
            </Button>
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t("dashboard.select_vehicle_calc")}
        </p>
      )}
    </Card>
  );
}

function WatchlistTable({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useLanguage();
  const watchlistVehicles = vehicles.filter(v =>
    v.status === "evaluating" || v.status === "bid_placed" || v.status === "found"
  ).slice(0, 8);

  const statusLabels: Record<string, string> = {
    found: t("status.found"),
    evaluating: t("status.evaluating"),
    bid_placed: t("status.bid_placed"),
    won: t("status.won"),
  };

  const statusBadgeClass: Record<string, string> = {
    found: "bg-muted text-muted-foreground",
    evaluating: "bg-accent text-accent-foreground",
    bid_placed: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  };

  return (
    <Card className="p-4" data-testid="card-watchlist">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold">{t("dashboard.watchlist")}</h3>
        <Link href="/auction-finder">
          <Button size="sm" variant="outline" className="text-[#FF6319] border-[#FF6319]/30" data-testid="button-view-all-watchlist">
            {t("common.view_all")} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
      {watchlistVehicles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="pb-2 font-medium">{t("dashboard.car")}</th>
                <th className="pb-2 font-medium">{t("dashboard.location")}</th>
                <th className="pb-2 font-medium text-right">{t("common.price")}</th>
                <th className="pb-2 font-medium">{t("common.status")}</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {watchlistVehicles.map((v, i) => (
                <tr key={v.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-accent/20" : ""}`}
                    data-testid={`row-watchlist-${v.id}`}>
                  <td className="py-2 font-medium">
                    {v.make} {v.model} {v.variant ? v.variant.split(' ')[0] : ''}
                  </td>
                  <td className="py-2 text-muted-foreground">{v.sourceType === "auction" ? t("dashboard.auction") : t("dashboard.portal")}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)}
                  </td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${statusBadgeClass[v.status] || ""}`}>
                      {statusLabels[v.status] || v.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/vehicle/${v.id}`}>
                      <Button size="sm" variant="ghost" data-testid={`button-watchlist-view-${v.id}`}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.no_watchlist")}</p>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [makeFilter, setMakeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];
  const pipelineVehicles = allVehicles.filter(v => v.status !== "sold");
  const hotDeals = [...allVehicles].filter(v => (v.dealScore || 0) >= 70).sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0));

  const totalResaleEstimate = pipelineVehicles.reduce((sum, v) => sum + (v.resaleNormal || 0), 0);
  const totalRegistrationTax = pipelineVehicles.reduce((sum, v) => sum + (v.registrationTax || 0), 0);
  const totalPotentialProfit = pipelineVehicles.reduce((sum, v) => sum + calcProfit(v, "normal"), 0);

  const uniqueMakes = useMemo(() => {
    const makes = [...new Set(allVehicles.map(v => v.make))].sort();
    return makes;
  }, [allVehicles]);

  const filteredVehicles = useMemo(() => {
    return allVehicles.filter(v => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = `${v.make} ${v.model} ${v.variant || ""}`.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (makeFilter !== "all" && v.make !== makeFilter) return false;
      if (yearFilter !== "all") {
        const yr = parseInt(yearFilter);
        if (v.year < yr) return false;
      }
      if (priceFilter !== "all") {
        const maxP = parseInt(priceFilter);
        if ((v.purchasePrice || 0) > maxP) return false;
      }
      return true;
    });
  }, [allVehicles, searchQuery, makeFilter, yearFilter, priceFilter]);

  const displayVehicles = filteredVehicles.slice(0, 6);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-12 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-md" />
              ))}
            </div>
          </div>
          <Skeleton className="h-80 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title={t("dashboard.current_leads")}
          value={String(pipelineVehicles.length)}
          subtitle={`${allVehicles.length} ${t("dashboard.total_vehicles")}`}
          icon={Car}
        />
        <KPICard
          title={t("dashboard.dk_sale_price")}
          value={formatCurrency(totalResaleEstimate, "DKK")}
          subtitle={t("dashboard.pipeline_estimate")}
          icon={TrendingUp}
        />
        <KPICard
          title={t("dashboard.expected_tax")}
          value={formatCurrency(totalRegistrationTax, "DKK")}
          subtitle={t("dashboard.total_reg_tax")}
          icon={BarChart3}
        />
        <KPICard
          title={t("dashboard.potential_profit")}
          value={formatCurrency(totalPotentialProfit, "DKK")}
          subtitle={t("dashboard.across_pipeline")}
          icon={Flame}
          accent
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" /> {t("dashboard.find_car")}
            </h2>
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={makeFilter} onValueChange={setMakeFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-make-filter">
                    <SelectValue placeholder={t("common.year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.all_makes")}</SelectItem>
                    {uniqueMakes.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-year-filter">
                    <SelectValue placeholder={t("common.year")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.all_years")}</SelectItem>
                    <SelectItem value="2023">2023+</SelectItem>
                    <SelectItem value="2022">2022+</SelectItem>
                    <SelectItem value="2021">2021+</SelectItem>
                    <SelectItem value="2020">2020+</SelectItem>
                    <SelectItem value="2019">2019+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="select-price-filter">
                    <SelectValue placeholder={t("common.price")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("dashboard.all_prices")}</SelectItem>
                    <SelectItem value="20000">{t("dashboard.max")} 20.000</SelectItem>
                    <SelectItem value="30000">{t("dashboard.max")} 30.000</SelectItem>
                    <SelectItem value="40000">{t("dashboard.max")} 40.000</SelectItem>
                    <SelectItem value="50000">{t("dashboard.max")} 50.000</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#FF6319] hover:bg-[#FF6319]/90 text-white" data-testid="button-search">
                  <Search className="w-4 h-4 mr-1" /> {t("common.search")}
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayVehicles.map(v => (
              <VehicleSearchCard key={v.id} v={v} />
            ))}
          </div>

          {filteredVehicles.length > 6 && (
            <div className="text-center">
              <Link href="/auction-finder">
                <Button variant="outline" data-testid="button-view-all-vehicles">
                  {t("dashboard.view_all_vehicles").replace("{count}", String(filteredVehicles.length))} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ProfitCalculator vehicles={pipelineVehicles} />

          <DealScoreLegend />

          <Card className="p-4" data-testid="card-hot-deals">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-[#FF6319]" /> {t("dashboard.hot_deals")}
            </h3>
            {hotDeals.slice(0, 5).map(v => {
              const profit = calcProfit(v, "normal");
              return (
                <Link key={v.id} href={`/vehicle/${v.id}`}>
                  <div className="flex items-center gap-2 py-1.5 hover-elevate rounded-md px-1 cursor-pointer"
                       data-testid={`row-hotdeal-${v.id}`}>
                    <DealScoreBadge score={v.dealScore || 0} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{v.make} {v.model}</p>
                      <p className="text-[10px] text-muted-foreground">{v.year} / {formatNumber(v.mileageKm)} km</p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {formatCurrency(profit, "DKK")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </Card>
        </div>
      </div>

      <WatchlistTable vehicles={allVehicles} />

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">{t("dashboard.quick_actions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link href="/auction-finder">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-vehicle">
              <Plus className="w-4 h-4 mr-2" /> {t("dashboard.add_new_car")}
            </Button>
          </Link>
          <Link href="/pipeline">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-pipeline">
              <GitBranch className="w-4 h-4 mr-2" /> {t("dashboard.view_pipeline")}
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-pdf">
              <FileText className="w-4 h-4 mr-2" /> {t("dashboard.generate_pdf")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
