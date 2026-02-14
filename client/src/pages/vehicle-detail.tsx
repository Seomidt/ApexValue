import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DealScoreBadge, DealRecommendationBadge } from "@/components/deal-score-badge";
import { VehicleImageGallery } from "@/components/vehicle-image-gallery";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags } from "@/lib/calculations";
import {
  ArrowLeft, ExternalLink, Calendar, Gauge, Settings2, Fuel, FileText,
  TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3, Calculator, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import type { Vehicle, MarketComp } from "@shared/schema";

const INLINE_EUR_DKK_RATE = 7.45;

type InlineVatScheme = "eu_reverse_charge" | "dk_vat" | "margin" | "private";

function calcInlineVat(scheme: InlineVatScheme, purchaseEur: number, resaleDkk: number) {
  const purchaseDkk = purchaseEur * INLINE_EUR_DKK_RATE;
  let purchaseVat = 0;
  let salesVat = 0;
  let vatReturn = 0;
  let bindingLevel: "minimal" | "medium" | "high" = "minimal";

  switch (scheme) {
    case "eu_reverse_charge":
      purchaseVat = 0;
      salesVat = resaleDkk * 0.25;
      vatReturn = purchaseDkk * 0.25;
      bindingLevel = "minimal";
      break;
    case "dk_vat":
      purchaseVat = purchaseDkk * 0.25;
      salesVat = resaleDkk * 0.25;
      vatReturn = purchaseVat;
      bindingLevel = "medium";
      break;
    case "margin":
      purchaseVat = 0;
      salesVat = Math.max(0, (resaleDkk - purchaseDkk) * 0.25);
      vatReturn = 0;
      bindingLevel = "minimal";
      break;
    case "private":
      purchaseVat = 0;
      salesVat = resaleDkk * 0.25;
      vatReturn = 0;
      bindingLevel = "high";
      break;
  }

  const netVat = salesVat - vatReturn;
  return { purchaseVat, salesVat, vatReturn, netVat, bindingLevel };
}

function InlineVatCalculator({ initialScheme, initialPurchase, initialResale }: {
  initialScheme: string;
  initialPurchase: number;
  initialResale: number;
}) {
  const { t } = useLanguage();
  const validSchemes: InlineVatScheme[] = ["eu_reverse_charge", "dk_vat", "margin", "private"];
  const defaultScheme = validSchemes.includes(initialScheme as InlineVatScheme)
    ? (initialScheme as InlineVatScheme)
    : "eu_reverse_charge";

  const [scheme, setScheme] = useState<InlineVatScheme>(defaultScheme);
  const [purchasePrice, setPurchasePrice] = useState<number>(initialPurchase);
  const [resalePrice, setResalePrice] = useState<number>(initialResale);

  const result = calcInlineVat(scheme, purchasePrice, resalePrice);

  const bindingColor = result.bindingLevel === "minimal"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    : result.bindingLevel === "medium"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";

  const bindingLabel = result.bindingLevel === "minimal"
    ? t("vat_calc.minimal")
    : result.bindingLevel === "medium"
      ? t("vat_calc.medium")
      : t("vat_calc.high");

  const bindingDesc = result.bindingLevel === "minimal"
    ? t("vat_calc.binding_minimal_desc")
    : result.bindingLevel === "medium"
      ? t("vat_calc.binding_medium_desc")
      : t("vat_calc.binding_high_desc");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>{t("vat_calc.vat_scheme")}</Label>
            <Select value={scheme} onValueChange={(v) => setScheme(v as InlineVatScheme)}>
              <SelectTrigger data-testid="select-inline-vat-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu_reverse_charge">{t("vat_calc.eu_reverse")}</SelectItem>
                <SelectItem value="dk_vat">{t("vat_calc.dk_vat")}</SelectItem>
                <SelectItem value="margin">{t("vat_calc.margin_scheme")}</SelectItem>
                <SelectItem value="private">{t("vat_calc.private_purchase")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("vat_calc.purchase_price")}</Label>
            <Input
              type="number"
              min={0}
              value={purchasePrice || ""}
              onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
              data-testid="input-inline-purchase-price"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("vat_calc.resale_price")}</Label>
            <Input
              type="number"
              min={0}
              value={resalePrice || ""}
              onChange={(e) => setResalePrice(Number(e.target.value) || 0)}
              data-testid="input-inline-resale-price"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-0">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.purchase_vat")}</span>
            <span className="text-sm font-semibold tabular-nums" data-testid="text-inline-purchase-vat">
              {formatCurrency(result.purchaseVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.sales_vat")}</span>
            <span className="text-sm font-semibold tabular-nums" data-testid="text-inline-sales-vat">
              {formatCurrency(result.salesVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.vat_return")}</span>
            <span className="text-sm font-semibold tabular-nums text-emerald-500" data-testid="text-inline-vat-return">
              {formatCurrency(result.vatReturn, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold">{t("vat_calc.net_vat")}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: "#FF6319" }} data-testid="text-inline-net-vat">
              {formatCurrency(result.netVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.capital_binding")}</span>
            <Badge variant="outline" className={bindingColor} data-testid="badge-inline-capital-binding">
              {bindingLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-inline-binding-desc">{bindingDesc}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> {t("vat_calc.scheme_explanations")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.eu_reverse")}</p>
            <p className="text-muted-foreground">{t("vat_calc.eu_reverse_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.dk_vat")}</p>
            <p className="text-muted-foreground">{t("vat_calc.dk_vat_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.margin_scheme")}</p>
            <p className="text-muted-foreground">{t("vat_calc.margin_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.private_purchase")}</p>
            <p className="text-muted-foreground">{t("vat_calc.private_desc")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color || ""}`}>{value}</span>
    </div>
  );
}

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;
  const { t } = useLanguage();

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", vehicleId],
  });

  const { data: comps } = useQuery<MarketComp[]>({
    queryKey: ["/api/vehicles", vehicleId, "comps"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold">{t("vehicle.not_found")}</h2>
        <Link href="/auction-finder">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("vehicle.back_to_finder")}
          </Button>
        </Link>
      </div>
    );
  }

  const v = vehicle;
  const totalCost = calcTotalCost(v);
  const profitC = calcProfit(v, "conservative");
  const profitN = calcProfit(v, "normal");
  const profitO = calcProfit(v, "optimistic");
  const roiC = calcROI(v, "conservative");
  const roiN = calcROI(v, "normal");
  const roiO = calcROI(v, "optimistic");
  const maxBid = calcMaxBid(v);
  const riskFlags = getRiskFlags(v);
  const score = v.dealScore || 0;
  const maxBidRoom = maxBid - (v.purchasePrice || 0);

  const allComps = comps || [];
  const avgCompPrice = allComps.length > 0 ? allComps.reduce((s, c) => s + c.price, 0) / allComps.length : 0;
  const medianCompPrice = allComps.length > 0
    ? [...allComps].sort((a, b) => a.price - b.price)[Math.floor(allComps.length / 2)].price
    : 0;
  const minCompPrice = allComps.length > 0 ? Math.min(...allComps.map(c => c.price)) : 0;
  const maxCompPrice = allComps.length > 0 ? Math.max(...allComps.map(c => c.price)) : 0;

  const gearLabel = v.gearbox === "automatic" ? t("gearbox.automatic") : v.gearbox === "manual" ? t("gearbox.manual") : v.gearbox;
  const fuelLabel = v.fuelType === "petrol" ? t("fuel.petrol") : v.fuelType === "electric" ? t("fuel.electric") : v.fuelType === "hybrid" ? t("fuel.hybrid") : v.fuelType;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/auction-finder">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" data-testid="text-vehicle-title">
            {v.make} {v.model} {v.variant || ""}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{v.year}</span>
            <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />{formatNumber(v.mileageKm)} km</span>
            <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" />{gearLabel}</span>
            <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" />{fuelLabel}</span>
            {v.sourceCountry && <Badge variant="outline" className="text-xs">{v.sourceCountry}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DealScoreBadge score={score} size="lg" />
          <DealRecommendationBadge score={score} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">{t("vehicle.total_costs")}</p>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(totalCost, "DKK")}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">{t("vehicle.profit_normal")}</p>
          <p className={`text-lg font-bold tabular-nums ${profitN >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatCurrency(profitN, "DKK")}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">{t("vehicle.roi_normal")}</p>
          <p className={`text-lg font-bold tabular-nums ${roiN >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {roiN.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">{t("vehicle.max_bid")}</p>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(maxBid, "DKK")}</p>
          <p className={`text-xs tabular-nums ${maxBidRoom >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {t("vehicle.room")}: {formatCurrency(maxBidRoom, "DKK")}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="source" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="source" data-testid="tab-source">{t("vehicle.tab_source")}</TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market">{t("vehicle.tab_market")}</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax">{t("vehicle.tab_tax")}</TabsTrigger>
          <TabsTrigger value="costs" data-testid="tab-costs">{t("vehicle.tab_costs")}</TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit">{t("vehicle.tab_profit")}</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">{t("vehicle.tab_notes")}</TabsTrigger>
          <TabsTrigger value="vat-calc" data-testid="tab-vat-calc">{t("vat_calc.tab_moms")}</TabsTrigger>
        </TabsList>

        <TabsContent value="source">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <VehicleImageGallery vehicleId={v.id} vehicleName={`${v.make} ${v.model}`} />
              </div>
              <div className="space-y-0">
                <StatRow label={t("vehicle.vin")} value={v.vin || "N/A"} />
                <StatRow label={t("vehicle.plate")} value={v.plate || "N/A"} />
                <StatRow label={t("vehicle.make_model")} value={`${v.make} ${v.model}`} />
                <StatRow label={t("vehicle.variant")} value={v.variant || "N/A"} />
                <StatRow label={t("common.year")} value={String(v.year)} />
                <StatRow label={t("common.mileage")} value={`${formatNumber(v.mileageKm)} km`} />
                <StatRow label={t("vehicle.engine_power")} value={v.enginePower ? `${v.enginePower} ${t("common.hp")}` : "N/A"} />
                <StatRow label={t("vehicle.co2")} value={v.co2 ? `${v.co2} g/km` : "N/A"} />
                <StatRow label={t("compare.gearbox")} value={gearLabel} />
                <StatRow label={t("compare.fuel")} value={fuelLabel} />
                <StatRow label={t("vehicle.color")} value={v.color || "N/A"} />
                <Separator className="my-2" />
                <StatRow label={t("vehicle.purchase_price")} value={formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)} />
                <StatRow label={t("vehicle.auction_fee")} value={formatCurrency(v.auctionFees || 0, v.purchaseCurrency)} />
                {v.sourceUrl && (
                  <div className="pt-2">
                    <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t("vehicle.open_source")}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {t("vehicle.market_comps")} ({allComps.length} {t("vehicle.comparisons")})
            </h3>
            {allComps.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("vehicle.min")}</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(minCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("vehicle.median")}</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(medianCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("vehicle.average")}</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(avgCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("vehicle.max")}</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(maxCompPrice, "DKK")}</p>
                  </Card>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium">{t("dashboard.car")}</th>
                        <th className="pb-2 font-medium">{t("common.year")}</th>
                        <th className="pb-2 font-medium">{t("common.mileage")}</th>
                        <th className="pb-2 font-medium text-right">{t("common.price")}</th>
                        <th className="pb-2 font-medium">{t("dashboard.location")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allComps.map((c, i) => (
                        <tr key={c.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-accent/30" : ""}`}>
                          <td className="py-2">{c.make} {c.model} {c.variant || ""}</td>
                          <td className="py-2">{c.year}</td>
                          <td className="py-2">{formatNumber(c.mileageKm)} km</td>
                          <td className="py-2 text-right font-semibold tabular-nums">{formatCurrency(c.price, c.currency)}</td>
                          <td className="py-2 text-muted-foreground">{c.location || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t("vehicle.no_comps")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("vehicle.activate_live")}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">{t("vehicle.tax_title")}</h3>
            <StatRow label={t("vehicle.reg_tax")} value={v.registrationTax != null ? formatCurrency(v.registrationTax, "DKK") : t("common.unknown")} />
            {v.registrationTax == null && (
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{t("vehicle.reg_tax_unknown")}</span>
              </div>
            )}
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              {t("vehicle.tax_disclaimer")}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card className="p-4 space-y-0">
            <h3 className="text-sm font-semibold mb-3">{t("vehicle.cost_spec")}</h3>
            <StatRow label={t("vehicle.purchase_price")} value={formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)} />
            <StatRow label={t("vehicle.auction_fee")} value={formatCurrency(v.auctionFees || 0, "DKK")} />
            <StatRow label={t("vehicle.transport")} value={formatCurrency(v.transportCost || 0, "DKK")} />
            <StatRow label={t("vehicle.preparation")} value={formatCurrency(v.preparationCost || 0, "DKK")} />
            <StatRow label={t("vehicle.inspection_plates")} value={formatCurrency(v.inspectionCost || 0, "DKK")} />
            <StatRow label={t("vehicle.other_costs")} value={formatCurrency(v.otherCosts || 0, "DKK")} />
            <StatRow label={t("vehicle.reg_tax")} value={formatCurrency(v.registrationTax || 0, "DKK")} />
            <Separator className="my-2" />
            <StatRow label={t("vehicle.vat_type")} value={v.vatType === "unknown" ? t("common.unknown") : v.vatType} />
            <StatRow label={t("vehicle.vat_return")} value={formatCurrency(v.vatReturn || 0, "DKK")} color="text-emerald-500" />
            <Separator className="my-2" />
            <StatRow label={t("vehicle.total_net")} value={formatCurrency(totalCost, "DKK")} />
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-0">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {t("vehicle.sale_scenarios")}
              </h3>
              <StatRow label={t("vehicle.conservative")} value={formatCurrency(v.resaleConservative || 0, "DKK")} />
              <StatRow label={t("vehicle.normal")} value={formatCurrency(v.resaleNormal || 0, "DKK")} />
              <StatRow label={t("vehicle.optimistic")} value={formatCurrency(v.resaleOptimistic || 0, "DKK")} />
              <Separator className="my-2" />
              <StatRow label={t("vehicle.break_even")} value={formatCurrency(totalCost, "DKK")} />
            </Card>

            <Card className="p-4 space-y-0">
              <h3 className="text-sm font-semibold mb-3">{t("vehicle.profit_roi")}</h3>
              <StatRow label={t("vehicle.conservative_profit")} value={formatCurrency(profitC, "DKK")} color={profitC >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label={t("vehicle.conservative_roi")} value={`${roiC.toFixed(1)}%`} color={roiC >= 0 ? "text-emerald-500" : "text-red-500"} />
              <Separator className="my-1" />
              <StatRow label={t("vehicle.normal_profit")} value={formatCurrency(profitN, "DKK")} color={profitN >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label={t("vehicle.normal_roi")} value={`${roiN.toFixed(1)}%`} color={roiN >= 0 ? "text-emerald-500" : "text-red-500"} />
              <Separator className="my-1" />
              <StatRow label={t("vehicle.optimistic_profit")} value={formatCurrency(profitO, "DKK")} color={profitO >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label={t("vehicle.optimistic_roi")} value={`${roiO.toFixed(1)}%`} color={roiO >= 0 ? "text-emerald-500" : "text-red-500"} />
            </Card>
          </div>

          <Card className="p-4 mt-4 space-y-0">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> {t("vehicle.max_bid_strategies")}
            </h3>
            <StatRow label={t("vehicle.safe_profit")} value={formatCurrency(calcMaxBid(v, 20000), "DKK")} />
            <StatRow label={t("vehicle.balanced_profit")} value={formatCurrency(calcMaxBid(v, 15000), "DKK")} />
            <StatRow label={t("vehicle.aggressive_profit")} value={formatCurrency(calcMaxBid(v, 8000), "DKK")} />
          </Card>

          {riskFlags.length > 0 && (
            <Card className="p-4 mt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> {t("vehicle.risk_factors")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {riskFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    {flag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t("vehicle.notes_history")}</h3>
            {v.notes ? (
              <p className="text-sm whitespace-pre-wrap">{v.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("vehicle.no_notes")}</p>
            )}
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("common.status")}: <Badge variant="outline" className="text-xs ml-1">{t(`status.${v.status}`)}</Badge></p>
              <p>{t("vehicle.created")}: {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vat-calc">
          <InlineVatCalculator
            initialScheme={v.vatType || "eu_reverse_charge"}
            initialPurchase={v.purchasePrice || 0}
            initialResale={v.resaleNormal || 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
