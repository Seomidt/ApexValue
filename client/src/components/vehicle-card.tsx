import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DealScoreBadge, DealRecommendationBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags } from "@/lib/calculations";
import { ExternalLink, Bookmark, FileText, Eye, Fuel, Gauge, Calendar, Settings2 } from "lucide-react";
import type { Vehicle } from "@shared/schema";
import { Link } from "wouter";

interface VehicleImage { key: string; url: string | null; }

function useVehicleThumbnail(vehicle: Vehicle): string {
  const placeholder = `https://placehold.co/400x250/1a2332/B9D9EB?text=${encodeURIComponent(vehicle.make + ' ' + vehicle.model)}`;
  const firstKey = vehicle.imageUrls && vehicle.imageUrls.length > 0 ? vehicle.imageUrls[0] : null;
  const isDirectUrl = firstKey && (firstKey.startsWith("http") || firstKey.startsWith("/"));
  const hasR2Key = firstKey && !isDirectUrl;

  const { data: images } = useQuery<VehicleImage[]>({
    queryKey: ["/api/vehicles", String(vehicle.id), "images"],
    enabled: !!hasR2Key,
    staleTime: 5 * 60 * 1000,
  });

  if (!firstKey) return placeholder;
  if (isDirectUrl) return firstKey;
  const found = images?.find(i => i.key === firstKey);
  return found?.url || placeholder;
}

interface RiskBadgeInfo {
  label: string;
  tooltip: string;
  variant: "amber" | "red";
  link?: string;
}

function mapRiskFlag(flag: string, t: (key: string) => string): RiskBadgeInfo {
  if (flag.includes("momstype") || flag.includes("Ukendt moms")) {
    return { label: t("risk.unknown_vat"), tooltip: t("risk.fix_vat"), variant: "red", link: "/vat/calculator" };
  }
  if (flag.includes("registreringsafgift") || flag.includes("afgift")) {
    return { label: t("risk.tax_missing"), tooltip: t("risk.fix_tax"), variant: "red", link: "/vat-tax" };
  }
  if (flag.includes("kilometertal") || flag.includes("km")) {
    return { label: t("risk.high_mileage"), tooltip: t("risk.fix_mileage"), variant: "amber" };
  }
  if (flag.includes("kapitalbinding") || flag.includes("kapital")) {
    return { label: t("risk.high_capital"), tooltip: t("risk.fix_capital"), variant: "amber" };
  }
  if (flag.includes("Ældre") || flag.includes("bil")) {
    return { label: t("risk.old_vehicle"), tooltip: t("risk.fix_old"), variant: "amber" };
  }
  if (flag.includes("fortjeneste") || flag.includes("Negativ")) {
    return { label: t("risk.high_capital"), tooltip: t("risk.fix_capital"), variant: "red" };
  }
  if (flag.includes("comps") || flag.includes("sammenlign") || flag.includes("market")) {
    return { label: t("risk.low_comps"), tooltip: t("risk.fix_market"), variant: "amber", link: "/settings" };
  }
  return { label: flag, tooltip: flag, variant: "amber" };
}

function VehicleRiskBadges({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useLanguage();
  const riskFlags = getRiskFlags(vehicle);

  if (riskFlags.length === 0) {
    return (
      <div className="flex flex-wrap gap-1" data-testid={`risk-badges-${vehicle.id}`}>
        <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 no-default-active-elevate" data-testid={`badge-low-risk-${vehicle.id}`}>
          {t("risk.low_risk")}
        </Badge>
      </div>
    );
  }

  const mapped = riskFlags.map(f => mapRiskFlag(f, t));
  const visible = mapped.slice(0, 3);
  const remaining = mapped.length - 3;

  return (
    <div className="flex flex-wrap gap-1" data-testid={`risk-badges-${vehicle.id}`}>
      {visible.map((badge, i) => {
        const badgeClass = badge.variant === "red"
          ? "text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 no-default-active-elevate"
          : "text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 no-default-active-elevate";

        const badgeEl = (
          <Badge variant="outline" className={badgeClass} data-testid={`badge-risk-${vehicle.id}-${i}`}>
            {badge.label}
          </Badge>
        );

        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              {badge.link ? (
                <Link href={badge.link}>{badgeEl}</Link>
              ) : (
                <span>{badgeEl}</span>
              )}
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">{badge.tooltip}</TooltipContent>
          </Tooltip>
        );
      })}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] text-muted-foreground no-default-active-elevate" data-testid={`badge-risk-more-${vehicle.id}`}>
          +{remaining} {t("risk.more")}
        </Badge>
      )}
    </div>
  );
}

interface VehicleCardProps {
  vehicle: Vehicle;
  currency?: string;
}

export function VehicleCard({ vehicle: v, currency = "DKK" }: VehicleCardProps) {
  const { t } = useLanguage();
  const totalCost = calcTotalCost(v);
  const profit = calcProfit(v, "normal");
  const roi = calcROI(v, "normal");
  const maxBid = calcMaxBid(v);
  const riskFlags = getRiskFlags(v);
  const score = v.dealScore || 0;
  const maxBidRoom = maxBid - (v.purchasePrice || 0);

  const imgSrc = useVehicleThumbnail(v);

  return (
    <Card className="overflow-visible group" data-testid={`card-vehicle-${v.id}`}>
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 h-36 sm:h-auto flex-shrink-0">
          <img
            src={imgSrc}
            alt={`${v.make} ${v.model}`}
            className="w-full h-full object-cover rounded-t-md sm:rounded-l-md sm:rounded-tr-none"
          />
          <div className="absolute top-2 left-2">
            <DealScoreBadge score={score} size="sm" />
          </div>
          {v.sourceCountry && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">{v.sourceCountry}</Badge>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <Link href={`/vehicle/${v.id}`}>
                <h3 className="font-semibold text-sm truncate cursor-pointer" data-testid={`text-vehicle-title-${v.id}`}>
                  {v.make} {v.model} {v.variant || ""}
                </h3>
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{v.year}</span>
                <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{formatNumber(v.mileageKm)} km</span>
                <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" />{v.gearbox ? t(`gearbox.${v.gearbox}`) : v.gearbox}</span>
                <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{v.fuelType ? t(`fuel.${v.fuelType}`) : v.fuelType}</span>
              </div>
            </div>
            <DealRecommendationBadge score={score} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">{t("vehicle.purchase_price")}</span>
              <span className="font-semibold" data-testid={`text-purchase-${v.id}`}>{formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("compare.est_sale_normal")}</span>
              <span className="font-semibold">{formatCurrency(v.resaleNormal || 0, currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("common.profit")}</span>
              <span className={`font-semibold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(profit, currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">ROI</span>
              <span className={`font-semibold ${roi >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">{t("vehicle.max_bid")}</span>
              <span className="font-semibold">{formatCurrency(maxBid, currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t("vehicle.room")} {t("vehicle.max_bid")}</span>
              <span className={`font-semibold ${maxBidRoom >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(maxBidRoom, currency)}
              </span>
            </div>
          </div>

          <VehicleRiskBadges vehicle={v} />

          <div className="flex items-center gap-1 mt-auto pt-1">
            <Link href={`/vehicle/${v.id}`}>
              <Button size="sm" variant="ghost" data-testid={`button-view-${v.id}`}>
                <Eye className="w-3.5 h-3.5 mr-1" /> {t("common.details")}
              </Button>
            </Link>
            {v.sourceUrl && (
              <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t("vehicle.open_source")}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
