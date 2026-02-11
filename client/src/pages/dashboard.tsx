import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcProfit, calcROI, getDealRecommendation } from "@/lib/calculations";
import {
  GitBranch, TrendingUp, BarChart3, Flame, AlertTriangle,
  Plus, Link2, FileText, ArrowRight, Car
} from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; icon: any; color: string;
}) {
  return (
    <Card className="p-4" data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
}

function VehicleRow({ v, currency }: { v: Vehicle; currency: string }) {
  const profit = calcProfit(v, "normal");
  const roi = calcROI(v, "normal");
  return (
    <Link href={`/vehicle/${v.id}`}>
      <div className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`row-vehicle-${v.id}`}>
        <div className="w-8 flex-shrink-0">
          <DealScoreBadge score={v.dealScore || 0} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{v.make} {v.model} {v.variant || ""}</p>
          <p className="text-xs text-muted-foreground">{v.year} &middot; {formatNumber(v.mileageKm)} km</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatCurrency(profit, currency)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{roi.toFixed(1)}% ROI</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];
  const pipelineVehicles = allVehicles.filter(v => v.status !== "sold");
  const hotDeals = [...allVehicles].filter(v => (v.dealScore || 0) >= 70).sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0)).slice(0, 5);
  const riskVehicles = allVehicles.filter(v => {
    const rec = getDealRecommendation(v.dealScore || 0);
    return rec === "drop" || rec === "consider";
  }).sort((a, b) => (a.dealScore || 0) - (b.dealScore || 0)).slice(0, 5);

  const totalPotentialProfit = pipelineVehicles.reduce((sum, v) => sum + calcProfit(v, "normal"), 0);
  const avgROI = pipelineVehicles.length > 0
    ? pipelineVehicles.reduce((sum, v) => sum + calcROI(v, "normal"), 0) / pipelineVehicles.length
    : 0;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Cockpit</h1>
          <p className="text-sm text-muted-foreground">Your trading overview</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/auction-finder">
            <Button size="sm" data-testid="button-add-vehicle">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Vehicle
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard
          title="Pipeline"
          value={String(pipelineVehicles.length)}
          subtitle="active vehicles"
          icon={GitBranch}
          color="bg-accent text-accent-foreground"
        />
        <KPICard
          title="Potential Profit"
          value={formatCurrency(totalPotentialProfit, "DKK")}
          subtitle="across pipeline"
          icon={TrendingUp}
          color="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <KPICard
          title="Avg. ROI"
          value={`${avgROI.toFixed(1)}%`}
          subtitle="normal scenario"
          icon={BarChart3}
          color="bg-accent text-accent-foreground"
        />
        <KPICard
          title="Hot Deals"
          value={String(hotDeals.length)}
          subtitle="score 70+"
          icon={Flame}
          color="bg-primary/15 text-primary"
        />
        <KPICard
          title="Risk Vehicles"
          value={String(riskVehicles.length)}
          subtitle="needs attention"
          icon={AlertTriangle}
          color="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" /> Hot Deals
            </h2>
            <Link href="/auction-finder">
              <Button size="sm" variant="ghost">View all</Button>
            </Link>
          </div>
          {hotDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hot deals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Vehicles with score 70+ appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {hotDeals.map((v) => <VehicleRow key={v.id} v={v} currency="DKK" />)}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Vehicles
            </h2>
            <Link href="/pipeline">
              <Button size="sm" variant="ghost">View all</Button>
            </Link>
          </div>
          {riskVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No risk vehicles</p>
              <p className="text-xs text-muted-foreground mt-1">All vehicles look good</p>
            </div>
          ) : (
            <div className="space-y-1">
              {riskVehicles.map((v) => <VehicleRow key={v.id} v={v} currency="DKK" />)}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link href="/auction-finder">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-new-vehicle">
              <Plus className="w-4 h-4 mr-2" /> Add New Vehicle
            </Button>
          </Link>
          <Link href="/auction-finder">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-import">
              <Link2 className="w-4 h-4 mr-2" /> Import Auction Link
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full justify-start" data-testid="button-quick-pdf">
              <FileText className="w-4 h-4 mr-2" /> Generate PDF Report
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
