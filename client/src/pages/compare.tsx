import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealScoreBadge, DealRecommendationBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags } from "@/lib/calculations";
import { GitCompareArrows, Plus, X, TrendingUp, AlertTriangle, Check } from "lucide-react";
import type { Vehicle } from "@shared/schema";

function ComparisonRow({ label, values, format, highlight }: {
  label: string;
  values: (string | number | null)[];
  format?: "currency" | "number" | "percent" | "text";
  highlight?: "max" | "min";
}) {
  const numericValues = values.map(v => typeof v === "number" ? v : null);
  let bestIdx = -1;
  if (highlight && numericValues.some(v => v !== null)) {
    const validNums = numericValues.filter(v => v !== null) as number[];
    const target = highlight === "max" ? Math.max(...validNums) : Math.min(...validNums);
    bestIdx = numericValues.findIndex(v => v === target);
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</td>
      {values.map((val, i) => {
        const isBest = bestIdx === i;
        let display = "";
        if (val === null || val === undefined) display = "-";
        else if (format === "currency") display = formatCurrency(val as number, "DKK");
        else if (format === "number") display = formatNumber(val as number);
        else if (format === "percent") display = `${(val as number).toFixed(1)}%`;
        else display = String(val);

        return (
          <td key={i} className={`py-2 px-2 text-xs text-center tabular-nums ${isBest ? "font-bold text-[#FF6319]" : "font-medium"}`}>
            {display}
          </td>
        );
      })}
    </tr>
  );
}

export default function Compare() {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const addVehicle = (id: string) => {
    const numId = parseInt(id);
    if (!selectedIds.includes(numId) && selectedIds.length < 5) {
      setSelectedIds([...selectedIds, numId]);
    }
  };

  const removeVehicle = (id: number) => {
    setSelectedIds(selectedIds.filter(x => x !== id));
  };

  const selected = selectedIds.map(id => allVehicles.find(v => v.id === id)).filter(Boolean) as Vehicle[];
  const available = allVehicles.filter(v => !selectedIds.includes(v.id));

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <GitCompareArrows className="w-5 h-5" /> {t("compare.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("compare.subtitle")}</p>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select onValueChange={addVehicle}>
            <SelectTrigger className="w-[250px]" data-testid="select-add-vehicle">
              <SelectValue placeholder={t("compare.add_vehicle")} />
            </SelectTrigger>
            <SelectContent>
              {available.map(v => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.make} {v.model} {v.year} - Score: {v.dealScore || 0}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{selectedIds.length}/5 {t("compare.selected")}</span>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.map(v => (
              <Badge key={v.id} variant="outline" className="gap-1" data-testid={`badge-selected-${v.id}`}>
                {v.make} {v.model}
                <button onClick={() => removeVehicle(v.id)} className="ml-0.5" data-testid={`button-remove-${v.id}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {selected.length >= 2 ? (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-comparison">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-3 text-left text-xs text-muted-foreground font-medium">{t("compare.property")}</th>
                {selected.map(v => (
                  <th key={v.id} className="py-3 px-2 text-center min-w-[140px]">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">{v.make} {v.model}</p>
                      <p className="text-[10px] text-muted-foreground">{v.variant || ""}</p>
                      <DealScoreBadge score={v.dealScore || 0} size="sm" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={selected.length + 1} className="py-1 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/30">{t("compare.vehicle_info")}</td></tr>
              <ComparisonRow label={t("common.year")} values={selected.map(v => v.year)} format="number" highlight="max" />
              <ComparisonRow label={t("common.mileage")} values={selected.map(v => v.mileageKm)} format="number" highlight="min" />
              <ComparisonRow label={t("compare.engine_power")} values={selected.map(v => v.enginePower || null)} format="number" highlight="max" />
              <ComparisonRow label={t("compare.co2")} values={selected.map(v => v.co2 || null)} format="number" highlight="min" />
              <ComparisonRow label={t("compare.fuel")} values={selected.map(v => v.fuelType ? t(`fuel.${v.fuelType}`) : "-")} format="text" />
              <ComparisonRow label={t("compare.gearbox")} values={selected.map(v => v.gearbox ? t(`gearbox.${v.gearbox}`) : "-")} format="text" />
              <ComparisonRow label={t("compare.source_country")} values={selected.map(v => v.sourceCountry || "-")} format="text" />

              <tr><td colSpan={selected.length + 1} className="py-1 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/30">{t("compare.economy")}</td></tr>
              <ComparisonRow label={t("compare.purchase_price")} values={selected.map(v => v.purchasePrice || 0)} format="currency" highlight="min" />
              <ComparisonRow label={t("compare.reg_tax")} values={selected.map(v => v.registrationTax || 0)} format="currency" highlight="min" />
              <ComparisonRow label={t("compare.total_costs")} values={selected.map(v => calcTotalCost(v))} format="currency" highlight="min" />
              <ComparisonRow label={t("compare.est_sale_normal")} values={selected.map(v => v.resaleNormal || 0)} format="currency" highlight="max" />
              <ComparisonRow label={t("compare.profit_normal")} values={selected.map(v => calcProfit(v, "normal"))} format="currency" highlight="max" />
              <ComparisonRow label={t("compare.roi")} values={selected.map(v => calcROI(v, "normal"))} format="percent" highlight="max" />
              <ComparisonRow label={t("compare.max_bid")} values={selected.map(v => calcMaxBid(v))} format="currency" highlight="max" />
              <ComparisonRow label={t("compare.deal_score")} values={selected.map(v => v.dealScore || 0)} format="number" highlight="max" />

              <tr><td colSpan={selected.length + 1} className="py-1 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/30">{t("compare.risk_assessment")}</td></tr>
              <ComparisonRow label={t("compare.vat_type")} values={selected.map(v => v.vatType === "unknown" ? t("common.unknown") : v.vatType || t("common.unknown"))} format="text" />
              <ComparisonRow label={t("compare.risk_flags")} values={selected.map(v => {
                const flags = getRiskFlags(v);
                return flags.length > 0 ? flags.join(", ") : t("common.none");
              })} format="text" />

              <tr><td colSpan={selected.length + 1} className="py-1 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-accent/30">{t("compare.recommendation")}</td></tr>
              <tr className="border-b">
                <td className="py-2 pr-3 text-xs text-muted-foreground font-medium">{t("compare.assessment")}</td>
                {selected.map(v => (
                  <td key={v.id} className="py-2 px-2 text-center">
                    <DealRecommendationBadge score={v.dealScore || 0} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <GitCompareArrows className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">{t("compare.select_min_2")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("compare.select_hint")}
          </p>
        </Card>
      )}
    </div>
  );
}
