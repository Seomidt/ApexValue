import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealScoreBadge, DealRecommendationBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags } from "@/lib/calculations";
import { ExternalLink, Bookmark, FileText, Eye, Fuel, Gauge, Calendar, Settings2 } from "lucide-react";
import type { Vehicle } from "@shared/schema";
import { Link } from "wouter";

interface VehicleCardProps {
  vehicle: Vehicle;
  currency?: string;
}

export function VehicleCard({ vehicle: v, currency = "DKK" }: VehicleCardProps) {
  const totalCost = calcTotalCost(v);
  const profit = calcProfit(v, "normal");
  const roi = calcROI(v, "normal");
  const maxBid = calcMaxBid(v);
  const riskFlags = getRiskFlags(v);
  const score = v.dealScore || 0;
  const maxBidRoom = maxBid - (v.purchasePrice || 0);

  const placeholderImg = `https://placehold.co/400x250/1a2332/B9D9EB?text=${encodeURIComponent(v.make + ' ' + v.model)}`;
  const imgSrc = v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : placeholderImg;

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
                <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" />{v.gearbox === "automatic" ? "Automatisk" : "Manuel"}</span>
                <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{v.fuelType === "petrol" ? "Benzin" : v.fuelType === "electric" ? "El" : v.fuelType === "hybrid" ? "Hybrid" : v.fuelType}</span>
              </div>
            </div>
            <DealRecommendationBadge score={score} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">Indkøb</span>
              <span className="font-semibold" data-testid={`text-purchase-${v.id}`}>{formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Est. Salgspris</span>
              <span className="font-semibold">{formatCurrency(v.resaleNormal || 0, currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Fortjeneste</span>
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
              <span className="text-muted-foreground block">MaxBud</span>
              <span className="font-semibold">{formatCurrency(maxBid, currency)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Rum til MaxBud</span>
              <span className={`font-semibold ${maxBidRoom >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(maxBidRoom, currency)}
              </span>
            </div>
          </div>

          {riskFlags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {riskFlags.map((flag) => (
                <Badge key={flag} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 mt-auto pt-1">
            <Link href={`/vehicle/${v.id}`}>
              <Button size="sm" variant="ghost" data-testid={`button-view-${v.id}`}>
                <Eye className="w-3.5 h-3.5 mr-1" /> Detaljer
              </Button>
            </Link>
            {v.sourceUrl && (
              <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Kilde
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
