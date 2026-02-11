import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcProfit, calcROI } from "@/lib/calculations";
import { VEHICLE_STATUSES } from "@shared/schema";
import { ArrowRight, Car, GitBranch, ChevronRight, Check, Camera, List, FileText, Receipt, CreditCard, Tag } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle } from "@shared/schema";

const statusLabels: Record<string, string> = {
  found: "Fundet",
  evaluating: "Under vurdering",
  bid_placed: "Bud afgivet",
  won: "Vundet",
  transport: "Transport",
  preparation: "Klargoering",
  ready_for_sale: "Klar til salg",
  online: "Online",
  sold: "Solgt",
};

const statusColors: Record<string, string> = {
  found: "bg-muted text-muted-foreground",
  evaluating: "bg-accent text-accent-foreground",
  bid_placed: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  won: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  transport: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  preparation: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  ready_for_sale: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  online: "bg-primary/15 text-primary",
  sold: "bg-muted text-muted-foreground",
};

function ReadyChecklist({ v }: { v: Vehicle }) {
  const hasImages = v.imageUrls && v.imageUrls.length >= 3;
  const hasTax = v.registrationTax != null && v.registrationTax > 0;
  const hasResale = v.resaleNormal != null && v.resaleNormal > 0;
  const hasVat = v.vatType !== "unknown";

  const checks = [
    { label: "Billeder (min 3)", ok: hasImages, icon: Camera },
    { label: "Afgift beregnet", ok: hasTax, icon: Receipt },
    { label: "Moms/VAT afklaret", ok: hasVat, icon: CreditCard },
    { label: "Salgspris sat", ok: hasResale, icon: Tag },
  ];

  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-2 text-xs">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${c.ok ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {c.ok ? <Check className="w-2.5 h-2.5" /> : <c.icon className="w-2.5 h-2.5" />}
          </div>
          <span className={c.ok ? "text-muted-foreground line-through" : ""}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Pipeline() {
  const { toast } = useToast();
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/vehicles/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Status updated", description: "Vehicle status has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
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
  const totalProfit = allVehicles.filter(v => v.status !== "sold").reduce((s, v) => s + calcProfit(v, "normal"), 0);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <GitBranch className="w-5 h-5" /> Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">{activeCount} active vehicles &middot; {formatCurrency(totalProfit, "DKK")} potential profit</p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {VEHICLE_STATUSES.map((status, i) => (
          <div key={status} className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className={`text-xs whitespace-nowrap ${statusColors[status]}`}>
              {statusLabels[status]} ({grouped[status]?.length || 0})
            </Badge>
            {i < VEHICLE_STATUSES.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {VEHICLE_STATUSES.map((status) => {
        const items = grouped[status];
        if (!items || items.length === 0) return null;

        const showChecklist = status === "preparation" || status === "ready_for_sale";

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
                const currentIdx = VEHICLE_STATUSES.indexOf(v.status as any);
                const nextStatus = currentIdx < VEHICLE_STATUSES.length - 1 ? VEHICLE_STATUSES[currentIdx + 1] : null;

                return (
                  <Card key={v.id} className="p-3" data-testid={`card-pipeline-${v.id}`}>
                    <div className="flex items-center gap-3">
                      <DealScoreBadge score={v.dealScore || 0} size="sm" />
                      <Link href={`/vehicle/${v.id}`}>
                        <div className="flex-1 min-w-0 cursor-pointer">
                          <p className="text-sm font-medium truncate">{v.make} {v.model} {v.variant || ""}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.year} &middot; {formatNumber(v.mileageKm)} km &middot; {v.sourceCountry}
                          </p>
                        </div>
                      </Link>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {formatCurrency(profit, "DKK")}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">{roi.toFixed(1)}% ROI</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Select
                          value={v.status}
                          onValueChange={(newStatus) => statusMutation.mutate({ id: v.id, status: newStatus })}
                        >
                          <SelectTrigger className="w-[140px] text-xs" data-testid={`select-status-${v.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {nextStatus && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => statusMutation.mutate({ id: v.id, status: nextStatus })}
                            disabled={statusMutation.isPending}
                            data-testid={`button-advance-${v.id}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {showChecklist && <ReadyChecklist v={v} />}
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
