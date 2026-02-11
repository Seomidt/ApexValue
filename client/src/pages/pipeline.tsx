import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcProfit, calcROI } from "@/lib/calculations";
import { VEHICLE_STATUSES } from "@shared/schema";
import { ArrowRight, Car, GitBranch } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

const statusLabels: Record<string, string> = {
  found: "Found",
  evaluating: "Evaluating",
  bid_placed: "Bid Placed",
  won: "Won",
  transport: "Transport",
  preparation: "Preparation",
  ready_for_sale: "Ready for Sale",
  online: "Online",
  sold: "Sold",
};

const statusColors: Record<string, string> = {
  found: "bg-muted text-muted-foreground",
  evaluating: "bg-accent text-accent-foreground",
  bid_placed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  transport: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  preparation: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  ready_for_sale: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  online: "bg-primary/15 text-primary",
  sold: "bg-muted text-muted-foreground",
};

export default function Pipeline() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const grouped = VEHICLE_STATUSES.reduce((acc, status) => {
    acc[status] = allVehicles.filter((v) => v.status === status);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-md" />
        ))}
      </div>
    );
  }

  const activeCount = allVehicles.filter((v) => v.status !== "sold").length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <GitBranch className="w-5 h-5" /> Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">{activeCount} active vehicles</p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {VEHICLE_STATUSES.map((status, i) => (
          <div key={status} className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className={`text-xs whitespace-nowrap ${statusColors[status]}`}>
              {statusLabels[status]} ({grouped[status]?.length || 0})
            </Badge>
            {i < VEHICLE_STATUSES.length - 1 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {VEHICLE_STATUSES.map((status) => {
        const items = grouped[status];
        if (!items || items.length === 0) return null;

        return (
          <div key={status}>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Badge variant="outline" className={`${statusColors[status]}`}>
                {statusLabels[status]}
              </Badge>
              <span className="text-muted-foreground text-xs">{items.length} vehicles</span>
            </h2>
            <div className="space-y-2">
              {items.map((v) => {
                const profit = calcProfit(v, "normal");
                const roi = calcROI(v, "normal");
                return (
                  <Card key={v.id} className="p-3" data-testid={`card-pipeline-${v.id}`}>
                    <Link href={`/vehicle/${v.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <DealScoreBadge score={v.dealScore || 0} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{v.make} {v.model} {v.variant || ""}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.year} &middot; {formatNumber(v.mileageKm)} km &middot; {v.sourceCountry}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(profit, "DKK")}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">{roi.toFixed(1)}% ROI</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {allVehicles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Car className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">No vehicles in pipeline</h3>
          <p className="text-sm text-muted-foreground mt-1">Add vehicles from the Auction Finder</p>
          <Link href="/auction-finder">
            <Button className="mt-4">Browse Vehicles</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
