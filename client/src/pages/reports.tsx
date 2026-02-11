import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getDealRecommendation, getRiskFlags } from "@/lib/calculations";
import { FileText, Download, Clock, BarChart3, TrendingUp, AlertTriangle, FileDown, Printer, Globe, Activity } from "lucide-react";
import type { Vehicle } from "@shared/schema";

async function generatePDF(vehicle: Vehicle, t: (key: string) => string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const totalCost = calcTotalCost(vehicle);
  const profitNormal = calcProfit(vehicle, "normal");
  const profitConservative = calcProfit(vehicle, "conservative");
  const profitOptimistic = calcProfit(vehicle, "optimistic");
  const roi = calcROI(vehicle, "normal");
  const maxBid = calcMaxBid(vehicle);
  const recommendation = getDealRecommendation(vehicle.dealScore || 0);
  const risks = getRiskFlags(vehicle);

  const blue = [0, 39, 118];
  const orange = [255, 99, 25];

  doc.setFillColor(blue[0], blue[1], blue[2]);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ApexValue", 14, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(t("pdf.subtitle"), 14, 23);
  doc.setFontSize(7);
  doc.text(`${t("pdf.generated")}: ${new Date().toLocaleDateString()}`, 14, 30);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${vehicle.make} ${vehicle.model} ${vehicle.year}`, 120, 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${vehicle.variant || ""} | ${vehicle.fuelType || ""} | ${vehicle.gearbox || ""}`, 120, 23);
  doc.text(`VIN: ${vehicle.vin || "N/A"}`, 120, 30);

  let y = 48;
  const sectionHeader = (title: string) => {
    doc.setFillColor(orange[0], orange[1], orange[2]);
    doc.rect(14, y - 4, 3, 7, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y);
    y += 8;
  };

  const row = (label: string, value: string, bold?: boolean) => {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(label, 20, y);
    doc.setTextColor(30, 30, 30);
    if (bold) doc.setFont("helvetica", "bold");
    doc.text(value, 120, y);
    doc.setFont("helvetica", "normal");
    y += 5.5;
  };

  sectionHeader(t("pdf.vehicle_info"));
  row(t("pdf.year_km"), `${vehicle.year} / ${formatNumber(vehicle.mileageKm)} km`);
  row(t("pdf.engine_power"), `${vehicle.enginePower || "-"} ${t("common.hp")}`);
  row(t("pdf.co2_emission"), `${vehicle.co2 || "-"} g/km`);
  row(t("pdf.source_country"), vehicle.sourceCountry || "N/A");
  row(t("pdf.vat_type"), vehicle.vatType || t("common.unknown"));
  y += 4;

  sectionHeader(t("pdf.cost_spec"));
  row(t("pdf.purchase_price"), formatCurrency(vehicle.purchasePrice || 0, "DKK"));
  row(t("pdf.auction_fee"), formatCurrency(vehicle.auctionFees || 0, "DKK"));
  row(t("pdf.transport"), formatCurrency(vehicle.transportCost || 0, "DKK"));
  row(t("pdf.preparation"), formatCurrency(vehicle.preparationCost || 0, "DKK"));
  row(t("pdf.inspection"), formatCurrency(vehicle.inspectionCost || 0, "DKK"));
  row(t("pdf.other"), formatCurrency(vehicle.otherCosts || 0, "DKK"));
  row(t("pdf.reg_tax"), formatCurrency(vehicle.registrationTax || 0, "DKK"));
  row(t("pdf.vat_return"), `-${formatCurrency(vehicle.vatReturn || 0, "DKK")}`);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y - 2, 180, y - 2);
  row(t("pdf.total_costs"), formatCurrency(totalCost, "DKK"), true);
  y += 4;

  sectionHeader(t("pdf.resale_profit"));
  row(t("pdf.sale_conservative"), formatCurrency(vehicle.resaleConservative || 0, "DKK"));
  row(t("pdf.sale_normal"), formatCurrency(vehicle.resaleNormal || 0, "DKK"));
  row(t("pdf.sale_optimistic"), formatCurrency(vehicle.resaleOptimistic || 0, "DKK"));
  y += 2;
  row(t("pdf.profit_conservative"), formatCurrency(profitConservative, "DKK"));
  row(t("pdf.profit_normal"), formatCurrency(profitNormal, "DKK"), true);
  row(t("pdf.profit_optimistic"), formatCurrency(profitOptimistic, "DKK"));
  row(t("pdf.roi_normal"), `${roi.toFixed(1)}%`, true);
  row(t("pdf.max_bid"), formatCurrency(maxBid, "DKK"));
  y += 4;

  const recLabels: Record<string, string> = { buy: t("common.buy"), consider: t("common.consider"), drop: t("common.drop") };
  sectionHeader(t("pdf.assessment"));
  row("Deal Score", `${vehicle.dealScore || 0} / 100`, true);
  row(t("pdf.recommendation"), recLabels[recommendation] || recommendation.toUpperCase(), true);
  if (risks.length > 0) {
    row(t("pdf.risk_flags"), risks.join(", "));
  } else {
    row(t("pdf.risk_flags"), t("pdf.no_risks"));
  }

  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(t("pdf.disclaimer1"), 20, y + 5);
  doc.text(t("pdf.disclaimer2"), 20, y + 10);

  doc.save(`ApexValue_${vehicle.make}_${vehicle.model}_${vehicle.year}_Rapport.pdf`);
}

interface GeneratedReport {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  generatedAt: Date;
  dealScore: number;
}

export default function Reports() {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const handleGenerate = async (vehicleId: string) => {
    const id = parseInt(vehicleId);
    const vehicle = allVehicles.find(v => v.id === id);
    if (!vehicle) return;

    setGeneratingId(id);
    try {
      await generatePDF(vehicle, t);
      setGeneratedReports(prev => [{
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        generatedAt: new Date(),
        dealScore: vehicle.dealScore || 0,
      }, ...prev]);
      toast({ title: t("reports.pdf_generated"), description: t("reports.pdf_downloaded").replace("{name}", `${vehicle.make} ${vehicle.model}`) });
    } catch {
      toast({ title: t("pipeline.error"), description: t("reports.error_pdf"), variant: "destructive" });
    }
    setGeneratingId(null);
  };

  const totalVehicles = allVehicles.length;
  const avgScore = totalVehicles > 0 ? Math.round(allVehicles.reduce((s, v) => s + (v.dealScore || 0), 0) / totalVehicles) : 0;
  const hotDeals = allVehicles.filter(v => (v.dealScore || 0) >= 70).length;
  const totalProfitNormal = allVehicles.reduce((s, v) => s + calcProfit(v, "normal"), 0);

  const countryBreakdown = allVehicles.reduce((acc, v) => {
    const c = v.sourceCountry || t("common.unknown");
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelBreakdown = allVehicles.reduce((acc, v) => {
    const fuelLabels: Record<string, string> = { petrol: t("fuel.petrol"), diesel: t("fuel.diesel"), electric: t("fuel.electric"), hybrid: t("fuel.hybrid") };
    const f = fuelLabels[v.fuelType || ""] || v.fuelType || t("common.unknown");
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreRanges = [
    { label: t("reports.hot_range"), count: allVehicles.filter(v => (v.dealScore || 0) >= 70).length, color: "bg-emerald-500" },
    { label: t("reports.consider_range"), count: allVehicles.filter(v => (v.dealScore || 0) >= 40 && (v.dealScore || 0) < 70).length, color: "bg-[#FF6319]" },
    { label: t("reports.risk_range"), count: allVehicles.filter(v => (v.dealScore || 0) < 40).length, color: "bg-destructive" },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <FileText className="w-5 h-5" /> {t("reports.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> {t("reports.tab_analytics")}
          </TabsTrigger>
          <TabsTrigger value="generate" data-testid="tab-generate">
            <FileDown className="w-3.5 h-3.5 mr-1" /> {t("reports.tab_generate")}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="w-3.5 h-3.5 mr-1" /> {t("reports.tab_history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3" data-testid="stat-total-vehicles">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Activity className="w-3 h-3" /> {t("reports.inventory")}</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{totalVehicles}</p>
              <p className="text-xs text-muted-foreground">{t("reports.vehicles_in_system")}</p>
            </Card>
            <Card className="p-3" data-testid="stat-avg-score">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> {t("reports.avg_score")}</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{avgScore}</p>
              <p className="text-xs text-muted-foreground">{t("reports.avg_deal_score")}</p>
            </Card>
            <Card className="p-3" data-testid="stat-hot-deals">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {t("dashboard.hot_deals")}</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">{hotDeals}</p>
              <p className="text-xs text-muted-foreground">score 70+</p>
            </Card>
            <Card className="p-3" data-testid="stat-total-profit">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {t("reports.total_profit")}</p>
              <p className="text-xl font-bold mt-1 tabular-nums">{formatCurrency(totalProfitNormal, "DKK")}</p>
              <p className="text-xs text-muted-foreground">{t("reports.normal_scenario")}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">{t("reports.score_distribution")}</h3>
              <div className="space-y-2.5">
                {scoreRanges.map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground tabular-nums">{r.count} ({totalVehicles > 0 ? Math.round(r.count / totalVehicles * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${r.color} rounded-full`} style={{ width: `${totalVehicles > 0 ? (r.count / totalVehicles * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t("reports.by_country")}
              </h3>
              <div className="space-y-2">
                {Object.entries(countryBreakdown).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{country}</span>
                    <div className="flex items-center gap-2 flex-1 mx-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#B9D9EB] rounded-full" style={{ width: `${(count / totalVehicles) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">{t("reports.by_fuel")}</h3>
              <div className="space-y-2">
                {Object.entries(fuelBreakdown).sort((a, b) => b[1] - a[1]).map(([fuel, count]) => (
                  <div key={fuel} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium capitalize">{fuel}</span>
                    <div className="flex items-center gap-2 flex-1 mx-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#002776] rounded-full" style={{ width: `${(count / totalVehicles) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">{t("reports.top_performers")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-top-performers">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-2 font-medium">#</th>
                    <th className="p-2 font-medium">{t("dashboard.car")}</th>
                    <th className="p-2 font-medium text-right">{t("common.score")}</th>
                    <th className="p-2 font-medium text-right">{t("common.profit")}</th>
                    <th className="p-2 font-medium text-right">ROI</th>
                    <th className="p-2 font-medium">{t("common.country")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allVehicles].sort((a, b) => (b.dealScore || 0) - (a.dealScore || 0)).slice(0, 10).map((v, i) => (
                    <tr key={v.id} className="border-b last:border-0" data-testid={`row-top-${v.id}`}>
                      <td className="p-2 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="p-2 text-xs font-medium">{v.make} {v.model} {v.year}</td>
                      <td className="p-2 text-xs text-right font-semibold text-[#FF6319] tabular-nums">{v.dealScore || 0}</td>
                      <td className="p-2 text-xs text-right tabular-nums">{formatCurrency(calcProfit(v, "normal"), "DKK")}</td>
                      <td className="p-2 text-xs text-right tabular-nums">{calcROI(v, "normal").toFixed(1)}%</td>
                      <td className="p-2 text-xs">{v.sourceCountry || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card className="p-3 flex items-start gap-2 bg-accent/50 mb-4">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">{t("reports.demo_mode_label")}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {t("reports.demo_note")}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t("reports.generate_title")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("reports.generate_hint")}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select onValueChange={handleGenerate} disabled={generatingId !== null}>
                <SelectTrigger className="w-[300px]" data-testid="select-vehicle-report">
                  <SelectValue placeholder={t("dashboard.select_vehicle")} />
                </SelectTrigger>
                <SelectContent>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.make} {v.model} {v.year} ({t("common.score")}: {v.dealScore || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generatingId && <span className="text-xs text-muted-foreground">{t("common.generating")}</span>}
            </div>
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">{t("reports.batch_export")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("reports.batch_hint")}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-hot-deals"
                onClick={async () => {
                  const hotDealVehicles = allVehicles.filter(v => (v.dealScore || 0) >= 70);
                  for (const v of hotDealVehicles) {
                    await generatePDF(v, t);
                  }
                  toast({ title: t("reports.batch_done"), description: t("reports.batch_count").replace("{count}", String(hotDealVehicles.length)) });
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> {t("reports.export_hot_deals")} ({hotDeals})
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-all"
                onClick={async () => {
                  for (const v of allVehicles.slice(0, 5)) {
                    await generatePDF(v, t);
                  }
                  toast({ title: t("reports.export_started"), description: t("reports.export_first5") });
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> {t("reports.export_all")}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {generatedReports.length > 0 ? (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-report-history">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-3 font-medium">{t("dashboard.car")}</th>
                    <th className="p-3 font-medium text-center">{t("common.score")}</th>
                    <th className="p-3 font-medium">{t("reports.generated")}</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-xs font-medium">{r.make} {r.model} {r.year}</td>
                      <td className="p-3 text-xs text-center tabular-nums font-semibold text-[#FF6319]">{r.dealScore}</td>
                      <td className="p-3 text-xs text-muted-foreground">{r.generatedAt.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const v = allVehicles.find(v => v.id === r.vehicleId);
                            if (v) generatePDF(v, t);
                          }}
                          data-testid={`button-regenerate-${i}`}
                        >
                          <Download className="w-3 h-3 mr-1" /> {t("reports.download_again")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">{t("reports.no_reports")}</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {t("reports.no_reports_hint")}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
