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
  doc.text("Forhandler Investeringsrapport", 14, 23);
  doc.setFontSize(7);
  doc.text(`Genereret: ${new Date().toLocaleDateString("da-DK")}`, 14, 30);

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

  sectionHeader("Biloplysninger");
  row("Aargang / Kilometer", `${vehicle.year} / ${formatNumber(vehicle.mileageKm)} km`);
  row("Motoreffekt", `${vehicle.enginePower || "-"} hk`);
  row("CO2 Udledning", `${vehicle.co2 || "-"} g/km`);
  row("Kildeland", vehicle.sourceCountry || "N/A");
  row("Momstype", vehicle.vatType || "Ukendt");
  y += 4;

  sectionHeader("Omkostningsspecifikation");
  row("Indkoebspris", formatCurrency(vehicle.purchasePrice || 0, "DKK"));
  row("Auktionsgebyr", formatCurrency(vehicle.auctionFees || 0, "DKK"));
  row("Transport", formatCurrency(vehicle.transportCost || 0, "DKK"));
  row("Klargoering", formatCurrency(vehicle.preparationCost || 0, "DKK"));
  row("Syn/Inspektion", formatCurrency(vehicle.inspectionCost || 0, "DKK"));
  row("Oevrigt", formatCurrency(vehicle.otherCosts || 0, "DKK"));
  row("Registreringsafgift", formatCurrency(vehicle.registrationTax || 0, "DKK"));
  row("Momsrefusion", `-${formatCurrency(vehicle.vatReturn || 0, "DKK")}`);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y - 2, 180, y - 2);
  row("Totale Omkostninger", formatCurrency(totalCost, "DKK"), true);
  y += 4;

  sectionHeader("Videresalg & Profitanalyse");
  row("Salgspris (Konservativ)", formatCurrency(vehicle.resaleConservative || 0, "DKK"));
  row("Salgspris (Normal)", formatCurrency(vehicle.resaleNormal || 0, "DKK"));
  row("Salgspris (Optimistisk)", formatCurrency(vehicle.resaleOptimistic || 0, "DKK"));
  y += 2;
  row("Fortjeneste (Konservativ)", formatCurrency(profitConservative, "DKK"));
  row("Fortjeneste (Normal)", formatCurrency(profitNormal, "DKK"), true);
  row("Fortjeneste (Optimistisk)", formatCurrency(profitOptimistic, "DKK"));
  row("ROI (Normal)", `${roi.toFixed(1)}%`, true);
  row("MaxBud (@ 15K maal)", formatCurrency(maxBid, "DKK"));
  y += 4;

  const recLabels: Record<string, string> = { buy: "KOEB", consider: "OVERVEJ", drop: "DROP" };
  sectionHeader("Vurdering");
  row("Deal Score", `${vehicle.dealScore || 0} / 100`, true);
  row("Anbefaling", recLabels[recommendation] || recommendation.toUpperCase(), true);
  if (risks.length > 0) {
    row("Risikoflag", risks.join(", "));
  } else {
    row("Risikoflag", "Ingen identificeret");
  }

  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 14, "F");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text("Denne rapport er genereret af ApexValue i Demo Mode. Data er illustrativt og boer ikke bruges til endelige investeringsbeslutninger.", 20, y + 5);
  doc.text("For produktionsrapporter med reelle markedsdata, aktiver Live Mode med dine API-noegler.", 20, y + 10);

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
      toast({ title: "PDF Genereret", description: `Rapport for ${vehicle.make} ${vehicle.model} er downloadet.` });
    } catch {
      toast({ title: "Fejl", description: "Kunne ikke generere PDF.", variant: "destructive" });
    }
    setGeneratingId(null);
  };

  const totalVehicles = allVehicles.length;
  const avgScore = totalVehicles > 0 ? Math.round(allVehicles.reduce((s, v) => s + (v.dealScore || 0), 0) / totalVehicles) : 0;
  const hotDeals = allVehicles.filter(v => (v.dealScore || 0) >= 70).length;
  const totalProfitNormal = allVehicles.reduce((s, v) => s + calcProfit(v, "normal"), 0);

  const countryBreakdown = allVehicles.reduce((acc, v) => {
    const c = v.sourceCountry || "Ukendt";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelBreakdown = allVehicles.reduce((acc, v) => {
    const fuelLabels: Record<string, string> = { petrol: "Benzin", diesel: "Diesel", electric: "El", hybrid: "Hybrid" };
    const f = fuelLabels[v.fuelType || ""] || v.fuelType || "Ukendt";
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreRanges = [
    { label: "Hot (70-100)", count: allVehicles.filter(v => (v.dealScore || 0) >= 70).length, color: "bg-emerald-500" },
    { label: "Overvej (40-69)", count: allVehicles.filter(v => (v.dealScore || 0) >= 40 && (v.dealScore || 0) < 70).length, color: "bg-[#FF6319]" },
    { label: "Risiko (0-39)", count: allVehicles.filter(v => (v.dealScore || 0) < 40).length, color: "bg-destructive" },
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
          <FileText className="w-5 h-5" /> Rapporter & Analyse
        </h1>
        <p className="text-sm text-muted-foreground">PDF-rapporter, porteføljeanalyse og ydeevnemålinger</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analyse
          </TabsTrigger>
          <TabsTrigger value="generate" data-testid="tab-generate">
            <FileDown className="w-3.5 h-3.5 mr-1" /> Generér PDF
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <Clock className="w-3.5 h-3.5 mr-1" /> Historik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3" data-testid="stat-total-vehicles">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Activity className="w-3 h-3" /> Beholdning</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{totalVehicles}</p>
              <p className="text-xs text-muted-foreground">biler i systemet</p>
            </Card>
            <Card className="p-3" data-testid="stat-avg-score">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><BarChart3 className="w-3 h-3" /> Gns. Score</p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{avgScore}</p>
              <p className="text-xs text-muted-foreground">gennemsnitlig deal score</p>
            </Card>
            <Card className="p-3" data-testid="stat-hot-deals">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Hot Deals</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">{hotDeals}</p>
              <p className="text-xs text-muted-foreground">score 70+</p>
            </Card>
            <Card className="p-3" data-testid="stat-total-profit">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Samlet Profit</p>
              <p className="text-xl font-bold mt-1 tabular-nums">{formatCurrency(totalProfitNormal, "DKK")}</p>
              <p className="text-xs text-muted-foreground">normal scenarie</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Deal Score Fordeling</h3>
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
                <Globe className="w-4 h-4" /> Pr. Kildeland
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
              <h3 className="text-sm font-semibold mb-3">Pr. Brændstoftype</h3>
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
            <h3 className="text-sm font-semibold mb-3">Top Performere</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-top-performers">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-2 font-medium">#</th>
                    <th className="p-2 font-medium">Bil</th>
                    <th className="p-2 font-medium text-right">Score</th>
                    <th className="p-2 font-medium text-right">Fortjeneste</th>
                    <th className="p-2 font-medium text-right">ROI</th>
                    <th className="p-2 font-medium">Land</th>
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
                PDF-rapporter bruger demo-data. Aktivér Live Mode med API-nøgler for reelle markedsdata.
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Generér Bilrapport</h3>
            <p className="text-xs text-muted-foreground mb-3">Vælg en bil for at generere en komplet forhandler-investeringsrapport i PDF.</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select onValueChange={handleGenerate} disabled={generatingId !== null}>
                <SelectTrigger className="w-[300px]" data-testid="select-vehicle-report">
                  <SelectValue placeholder="Vælg bil..." />
                </SelectTrigger>
                <SelectContent>
                  {allVehicles.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.make} {v.model} {v.year} (Score: {v.dealScore || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generatingId && <span className="text-xs text-muted-foreground">Genererer...</span>}
            </div>
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Batch Eksport</h3>
            <p className="text-xs text-muted-foreground mb-3">Eksportér rapporter for alle hot deals eller fuld portefølje.</p>
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
                  toast({ title: "Batch Eksport Færdig", description: `${hotDealVehicles.length} hot deal PDF'er genereret.` });
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Eksportér Hot Deals ({hotDeals})
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-all"
                onClick={async () => {
                  for (const v of allVehicles.slice(0, 5)) {
                    await generatePDF(v);
                  }
                  toast({ title: "Eksport Startet", description: "De første 5 rapporter er genereret. Fuld batch tilgængelig i Live Mode." });
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Eksportér Alle (Demo: første 5)
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
                    <th className="p-3 font-medium">Bil</th>
                    <th className="p-3 font-medium text-center">Score</th>
                    <th className="p-3 font-medium">Genereret</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-xs font-medium">{r.make} {r.model} {r.year}</td>
                      <td className="p-3 text-xs text-center tabular-nums font-semibold text-[#FF6319]">{r.dealScore}</td>
                      <td className="p-3 text-xs text-muted-foreground">{r.generatedAt.toLocaleString("da-DK")}</td>
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
                          <Download className="w-3 h-3 mr-1" /> Download igen
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
              <h3 className="text-sm font-semibold mb-1">Ingen rapporter genereret endnu</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Brug fanen &quot;Generér PDF&quot; for at oprette forhandler-investeringsrapporter for enhver bil.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
