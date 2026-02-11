import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getDealRecommendation, getRiskFlags } from "@/lib/calculations";
import { FileText, Download, Clock, BarChart3, TrendingUp, AlertTriangle, FileDown, Printer, Globe, Activity } from "lucide-react";
import type { Vehicle } from "@shared/schema";

async function generatePDF(vehicle: Vehicle) {
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
  doc.text("Dealer Investment Report", 14, 23);
  doc.setFontSize(7);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 30);

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

  sectionHeader("Vehicle Details");
  row("Year / Mileage", `${vehicle.year} / ${formatNumber(vehicle.mileageKm)} km`);
  row("Engine Power", `${vehicle.enginePower || "-"} hp`);
  row("CO2 Emissions", `${vehicle.co2 || "-"} g/km`);
  row("Source Country", vehicle.sourceCountry || "N/A");
  row("VAT Type", vehicle.vatType || "Unknown");
  y += 4;

  sectionHeader("Cost Breakdown");
  row("Purchase Price", formatCurrency(vehicle.purchasePrice || 0, "DKK"));
  row("Auction Fees", formatCurrency(vehicle.auctionFees || 0, "DKK"));
  row("Transport Cost", formatCurrency(vehicle.transportCost || 0, "DKK"));
  row("Preparation", formatCurrency(vehicle.preparationCost || 0, "DKK"));
  row("Inspection", formatCurrency(vehicle.inspectionCost || 0, "DKK"));
  row("Other Costs", formatCurrency(vehicle.otherCosts || 0, "DKK"));
  row("Registration Tax", formatCurrency(vehicle.registrationTax || 0, "DKK"));
  row("VAT Return", `-${formatCurrency(vehicle.vatReturn || 0, "DKK")}`);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y - 2, 180, y - 2);
  row("Total Cost", formatCurrency(totalCost, "DKK"), true);
  y += 4;

  sectionHeader("Resale & Profit Analysis");
  row("Resale (Conservative)", formatCurrency(vehicle.resaleConservative || 0, "DKK"));
  row("Resale (Normal)", formatCurrency(vehicle.resaleNormal || 0, "DKK"));
  row("Resale (Optimistic)", formatCurrency(vehicle.resaleOptimistic || 0, "DKK"));
  y += 2;
  row("Profit (Conservative)", formatCurrency(profitConservative, "DKK"));
  row("Profit (Normal)", formatCurrency(profitNormal, "DKK"), true);
  row("Profit (Optimistic)", formatCurrency(profitOptimistic, "DKK"));
  row("ROI (Normal)", `${roi.toFixed(1)}%`, true);
  row("MaxBid (@ 15K target)", formatCurrency(maxBid, "DKK"));
  y += 4;

  sectionHeader("Deal Assessment");
  row("Deal Score", `${vehicle.dealScore || 0} / 100`, true);
  row("Recommendation", recommendation.toUpperCase(), true);
  if (risks.length > 0) {
    row("Risk Flags", risks.join(", "));
  } else {
    row("Risk Flags", "None identified");
  }

  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text("This report was generated by ApexValue in Demo Mode. Data is illustrative and should not be used for final investment decisions.", 20, y + 5);
  doc.text("For production reports with real market data, enable Live Mode with your API keys.", 20, y + 10);

  doc.save(`ApexValue_${vehicle.make}_${vehicle.model}_${vehicle.year}_Report.pdf`);
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
      await generatePDF(vehicle);
      setGeneratedReports(prev => [{
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        generatedAt: new Date(),
        dealScore: vehicle.dealScore || 0,
      }, ...prev]);
      toast({ title: "PDF Generated", description: `Report for ${vehicle.make} ${vehicle.model} downloaded.` });
    } catch {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
    setGeneratingId(null);
  };

  const totalVehicles = allVehicles.length;
  const avgScore = totalVehicles > 0 ? Math.round(allVehicles.reduce((s, v) => s + (v.dealScore || 0), 0) / totalVehicles) : 0;
  const hotDeals = allVehicles.filter(v => (v.dealScore || 0) >= 70).length;
  const riskVehicles = allVehicles.filter(v => (v.dealScore || 0) < 40).length;
  const totalProfitNormal = allVehicles.reduce((s, v) => s + calcProfit(v, "normal"), 0);

  const countryBreakdown = allVehicles.reduce((acc, v) => {
    const c = v.sourceCountry || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelBreakdown = allVehicles.reduce((acc, v) => {
    const f = v.fuelType || "Unknown";
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreRanges = [
    { label: "Hot (70-100)", count: allVehicles.filter(v => (v.dealScore || 0) >= 70).length, color: "bg-emerald-500" },
    { label: "Consider (40-69)", count: allVehicles.filter(v => (v.dealScore || 0) >= 40 && (v.dealScore || 0) < 70).length, color: "bg-[#FF6319]" },
    { label: "Risk (0-39)", count: allVehicles.filter(v => (v.dealScore || 0) < 40).length, color: "bg-destructive" },
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
          <FileText className="w-5 h-5" /> Reports & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">PDF reports, portfolio analytics, and performance metrics</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="generate" data-testid="tab-generate">
            <FileDown className="w-3.5 h-3.5 mr-1" /> Generate PDF
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="w-3.5 h-3.5 mr-1" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3" data-testid="stat-total-vehicles">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Activity className="w-3 h-3" /> Inventory</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{totalVehicles}</p>
              <p className="text-xs text-muted-foreground">vehicles in system</p>
            </Card>
            <Card className="p-3" data-testid="stat-avg-score">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> Avg Score</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{avgScore}</p>
              <p className="text-xs text-muted-foreground">deal score average</p>
            </Card>
            <Card className="p-3" data-testid="stat-hot-deals">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Hot Deals</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">{hotDeals}</p>
              <p className="text-xs text-muted-foreground">score 70+</p>
            </Card>
            <Card className="p-3" data-testid="stat-total-profit">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Total Profit</p>
              <p className="text-xl font-bold mt-1 tabular-nums">{formatCurrency(totalProfitNormal, "DKK")}</p>
              <p className="text-xs text-muted-foreground">normal scenario</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Deal Score Distribution</h3>
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
                <Globe className="w-4 h-4" /> By Source Country
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
              <h3 className="text-sm font-semibold mb-3">By Fuel Type</h3>
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
            <h3 className="text-sm font-semibold mb-3">Top Performers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-top-performers">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-2 font-medium">#</th>
                    <th className="p-2 font-medium">Vehicle</th>
                    <th className="p-2 font-medium text-right">Score</th>
                    <th className="p-2 font-medium text-right">Profit</th>
                    <th className="p-2 font-medium text-right">ROI</th>
                    <th className="p-2 font-medium">Country</th>
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
              <p className="font-medium">Demo Mode</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                PDF reports use demo data. Enable Live Mode with API keys for real market data.
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Generate Vehicle Report</h3>
            <p className="text-xs text-muted-foreground mb-3">Select a vehicle to generate a full dealer investment PDF report.</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select onValueChange={handleGenerate} disabled={generatingId !== null}>
                <SelectTrigger className="w-[300px]" data-testid="select-vehicle-report">
                  <SelectValue placeholder="Select vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.make} {v.model} {v.year} (Score: {v.dealScore || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generatingId && <span className="text-xs text-muted-foreground">Generating...</span>}
            </div>
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Batch Export</h3>
            <p className="text-xs text-muted-foreground mb-3">Export reports for all hot deals or full portfolio.</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-hot-deals"
                onClick={async () => {
                  const hotDealVehicles = allVehicles.filter(v => (v.dealScore || 0) >= 70);
                  for (const v of hotDealVehicles) {
                    await generatePDF(v);
                  }
                  toast({ title: "Batch Export Complete", description: `${hotDealVehicles.length} hot deal PDFs generated.` });
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export Hot Deals ({hotDeals})
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-all"
                onClick={async () => {
                  for (const v of allVehicles.slice(0, 5)) {
                    await generatePDF(v);
                  }
                  toast({ title: "Export Started", description: "First 5 reports generated. Full batch available in Live Mode." });
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Export All (Demo: first 5)
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
                    <th className="p-3 font-medium">Vehicle</th>
                    <th className="p-3 font-medium text-center">Score</th>
                    <th className="p-3 font-medium">Generated At</th>
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
                            if (v) generatePDF(v);
                          }}
                          data-testid={`button-regenerate-${i}`}
                        >
                          <Download className="w-3 h-3 mr-1" /> Re-download
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
              <h3 className="text-sm font-semibold mb-1">No reports generated yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Use the &quot;Generate PDF&quot; tab to create dealer investment reports for any vehicle.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
