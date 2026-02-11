import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcProfit } from "@/lib/calculations";
import { Shield, Building2, Users, BarChart3, Activity, Database, Globe, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import type { Vehicle } from "@shared/schema";

function StatCard({ title, value, subtitle, icon: Icon }: {
  title: string; value: string; subtitle?: string; icon: any;
}) {
  return (
    <Card className="p-4" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            {title}
          </p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function Admin() {
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const allVehicles = vehicles || [];
  const isLoading = vehiclesLoading || statsLoading;

  const totalProfit = allVehicles.reduce((sum, v) => sum + calcProfit(v, "normal"), 0);
  const avgScore = allVehicles.length > 0
    ? Math.round(allVehicles.reduce((sum, v) => sum + (v.dealScore || 0), 0) / allVehicles.length)
    : 0;

  const statusDistribution = allVehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelDistribution = allVehicles.reduce((acc, v) => {
    acc[v.fuelType || "unknown"] = (acc[v.fuelType || "unknown"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryDistribution = allVehicles.reduce((acc, v) => {
    acc[v.sourceCountry || "unknown"] = (acc[v.sourceCountry || "unknown"] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const demoOrgs = [
    { name: "Demo Organization", slug: "demo-org", plan: "free", users: 1, vehicles: allVehicles.length, status: "active" },
    { name: "Nordic Motors ApS", slug: "nordic-motors", plan: "pro", users: 4, vehicles: 0, status: "active" },
    { name: "AutoDanmark Import", slug: "auto-dk", plan: "team", users: 8, vehicles: 0, status: "active" },
    { name: "Test Org", slug: "test-org", plan: "free", users: 1, vehicles: 0, status: "inactive" },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Shield className="w-5 h-5" /> SuperAdmin Panel
        </h1>
        <p className="text-sm text-muted-foreground">Platform overview, organization management, usage analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Organizations" value={String(demoOrgs.length)} subtitle={`${demoOrgs.filter(o => o.status === "active").length} active`} icon={Building2} />
        <StatCard title="Total Users" value={String(demoOrgs.reduce((s, o) => s + o.users, 0))} subtitle="across all orgs" icon={Users} />
        <StatCard title="Total Vehicles" value={String(allVehicles.length)} subtitle={`Avg score: ${avgScore}`} icon={Database} />
        <StatCard title="Total Potential Profit" value={formatCurrency(totalProfit, "DKK")} subtitle="platform-wide" icon={TrendingUp} />
      </div>

      <Tabs defaultValue="organizations" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            <Building2 className="w-3.5 h-3.5 mr-1" /> Organizations
          </TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Usage
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <Activity className="w-3.5 h-3.5 mr-1" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <Card className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-organizations">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="p-3 font-medium">Organization</th>
                  <th className="p-3 font-medium">Slug</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium text-center">Users</th>
                  <th className="p-3 font-medium text-center">Vehicles</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {demoOrgs.map((org, i) => (
                  <tr key={org.slug} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-accent/20" : ""}`}
                      data-testid={`row-org-${org.slug}`}>
                    <td className="p-3 font-medium">{org.name}</td>
                    <td className="p-3 text-muted-foreground text-xs font-mono">{org.slug}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${
                        org.plan === "team" ? "bg-primary/15 text-primary" :
                        org.plan === "pro" ? "bg-[#FF6319]/15 text-[#FF6319]" :
                        ""
                      }`}>
                        {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center tabular-nums">{org.users}</td>
                    <td className="p-3 text-center tabular-nums">{org.vehicles}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${
                        org.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {org.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" data-testid={`button-manage-${org.slug}`}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Source Countries
              </h3>
              <div className="space-y-2">
                {Object.entries(countryDistribution).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{country}</span>
                    <div className="flex items-center gap-2 flex-1 mx-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#B9D9EB] rounded-full" style={{ width: `${(count / allVehicles.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Pipeline Status
              </h3>
              <div className="space-y-2">
                {Object.entries(statusDistribution).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize">{status.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2 flex-1 mx-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF6319] rounded-full" style={{ width: `${(count / allVehicles.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Fuel Type Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(fuelDistribution).sort((a, b) => b[1] - a[1]).map(([fuel, count]) => (
                  <div key={fuel} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize">{fuel}</span>
                    <div className="flex items-center gap-2 flex-1 mx-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#002776] rounded-full" style={{ width: `${(count / allVehicles.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Activity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 py-1.5 border-b">
                  <Badge variant="secondary" className="text-[10px]">NEW</Badge>
                  <span>Demo Organization added 38 vehicles</span>
                  <span className="text-muted-foreground ml-auto">Just now</span>
                </div>
                <div className="flex items-center gap-2 py-1.5 border-b">
                  <Badge variant="secondary" className="text-[10px]">SYS</Badge>
                  <span>Market comps generated (500+ comparisons)</span>
                  <span className="text-muted-foreground ml-auto">Just now</span>
                </div>
                <div className="flex items-center gap-2 py-1.5 border-b">
                  <Badge variant="secondary" className="text-[10px]">SYS</Badge>
                  <span>Cost templates seeded (11 templates, 8 markets)</span>
                  <span className="text-muted-foreground ml-auto">Just now</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-4 text-center py-12">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-sm font-semibold mb-1">Advanced Analytics</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Real-time user tracking, feature adoption metrics, conversion funnels,
              and revenue analytics. Available with live data integration.
            </p>
            <Button variant="outline" className="mt-4" disabled>Coming Soon</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
