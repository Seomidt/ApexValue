import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber, useLanguage } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getDealRecommendation, getRiskFlags } from "@/lib/calculations";
import { FileText, Download, Clock, BarChart3, TrendingUp, AlertTriangle, FileDown, Printer, Globe, Activity, Sparkles, Loader2, X, Info } from "lucide-react";
import { Link } from "wouter";
import { useAppMode } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle, MarketComp } from "@shared/schema";
import logoPath from "@assets/image_1770840196054.png";

function DemoBanner() {
  const { mode } = useAppMode();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("apexvalue_demo_banner_dismissed") === "true");

  if (mode !== "demo") return null;

  if (dismissed) {
    return (
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-amber-600 dark:text-amber-400 text-xs"
          onClick={() => { setDismissed(false); localStorage.removeItem("apexvalue_demo_banner_dismissed"); }}
          data-testid="button-show-demo-info"
        >
          <Info className="w-3.5 h-3.5 mr-1" /> {t("demo.show_info")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 mb-4 flex items-start gap-3"
      data-testid="banner-demo-mode"
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{t("demo.banner_title")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("demo.banner_desc")}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Link href="/settings">
            <Button className="bg-[#FF6319] text-white" data-testid="button-go-integrations">
              {t("demo.go_integrations")}
            </Button>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  {t("demo.start_trial")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("common.coming_soon")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="flex-shrink-0"
        onClick={() => { setDismissed(true); localStorage.setItem("apexvalue_demo_banner_dismissed", "true"); }}
        data-testid="button-dismiss-demo-banner"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

async function loadLogoAsBase64(): Promise<string> {
  try {
    const response = await fetch(logoPath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function generatePDF(
  vehicle: Vehicle,
  comps: MarketComp[],
  t: (key: string) => string,
  aiAnalysis?: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const totalCost = calcTotalCost(vehicle);
  const profitNormal = calcProfit(vehicle, "normal");
  const profitConservative = calcProfit(vehicle, "conservative");
  const profitOptimistic = calcProfit(vehicle, "optimistic");
  const roi = calcROI(vehicle, "normal");
  const roiConservative = calcROI(vehicle, "conservative");
  const roiOptimistic = calcROI(vehicle, "optimistic");
  const maxBid = calcMaxBid(vehicle);
  const recommendation = getDealRecommendation(vehicle.dealScore || 0);
  const risks = getRiskFlags(vehicle);

  const darkBlue: [number, number, number] = [0, 39, 118];
  const orange: [number, number, number] = [255, 99, 25];
  const powderBlue: [number, number, number] = [185, 217, 235];
  const lightGray: [number, number, number] = [245, 246, 248];
  const medGray: [number, number, number] = [220, 220, 225];
  const textDark: [number, number, number] = [25, 25, 30];
  const textMuted: [number, number, number] = [100, 105, 115];

  let y = 0;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const logoBase64 = await loadLogoAsBase64();

  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, pageWidth, 44, "F");

  doc.setFillColor(...orange);
  doc.rect(0, 44, pageWidth, 2, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 8, 48, 14);
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ApexValue", margin, 20);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ApexValue", margin, 20);
  }

  doc.setTextColor(185, 217, 235);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(t("pdf.subtitle"), margin, 30);
  doc.setFontSize(7);
  doc.text(`Rapport ID: AV-${vehicle.id}-${Date.now().toString(36).toUpperCase()}`, margin, 36);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const vehicleTitle = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  doc.text(vehicleTitle, pageWidth - margin, 14, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(185, 217, 235);
  doc.text(`${vehicle.variant || ""} | ${vehicle.fuelType || ""} | ${vehicle.gearbox || ""}`, pageWidth - margin, 21, { align: "right" });
  doc.text(`VIN: ${vehicle.vin || "N/A"}`, pageWidth - margin, 27, { align: "right" });
  doc.text(`${t("pdf.generated")}: ${new Date().toLocaleDateString("da-DK")}`, pageWidth - margin, 33, { align: "right" });

  const scoreColor: [number, number, number] = (vehicle.dealScore || 0) >= 70 ? [34, 197, 94] : (vehicle.dealScore || 0) >= 40 ? orange : [239, 68, 68];
  doc.setFillColor(...scoreColor);
  doc.roundedRect(pageWidth - margin - 28, 36, 28, 7, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Score: ${vehicle.dealScore || 0}/100`, pageWidth - margin - 14, 41, { align: "center" });

  y = 54;

  const sectionHeader = (title: string) => {
    checkPageBreak(14);
    doc.setFillColor(...darkBlue);
    doc.roundedRect(margin, y - 1, contentWidth, 8, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin + 4, y + 4.5);
    y += 12;
  };

  const dataRow = (label: string, value: string, options?: { bold?: boolean; highlight?: boolean; separator?: boolean }) => {
    checkPageBreak(7);
    if (options?.separator) {
      doc.setDrawColor(...medGray);
      doc.setLineWidth(0.3);
      doc.line(margin + 2, y - 1.5, pageWidth - margin - 2, y - 1.5);
    }

    if (options?.highlight) {
      doc.setFillColor(255, 248, 240);
      doc.rect(margin, y - 3.5, contentWidth, 6, "F");
    }

    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 4, y);

    doc.setTextColor(...textDark);
    if (options?.bold) doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - margin - 4, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 5.5;
  };

  const twoColRow = (l1: string, v1: string, l2: string, v2: string) => {
    checkPageBreak(7);
    const halfW = contentWidth / 2;
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(l1, margin + 4, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(v1, margin + halfW - 4, y, { align: "right" });

    doc.setTextColor(...textMuted);
    doc.setFont("helvetica", "normal");
    doc.text(l2, margin + halfW + 4, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(v2, pageWidth - margin - 4, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 5.5;
  };

  sectionHeader(t("pdf.vehicle_info"));
  const fuelLabels: Record<string, string> = { petrol: t("fuel.petrol"), diesel: t("fuel.diesel"), electric: t("fuel.electric"), hybrid: t("fuel.hybrid") };
  const gearLabels: Record<string, string> = { automatic: t("gearbox.automatic"), manual: t("gearbox.manual") };
  twoColRow(t("dashboard.car"), `${vehicle.make} ${vehicle.model}`, t("pdf.year_km"), `${vehicle.year} / ${formatNumber(vehicle.mileageKm)} km`);
  twoColRow(t("auction.fuel"), fuelLabels[vehicle.fuelType] || vehicle.fuelType, t("auction.gearbox"), gearLabels[vehicle.gearbox] || vehicle.gearbox);
  twoColRow(t("pdf.engine_power"), `${vehicle.enginePower || "-"} ${t("common.hp")}`, t("pdf.co2_emission"), `${vehicle.co2 || "-"} g/km`);
  twoColRow(t("pdf.source_country"), vehicle.sourceCountry || "N/A", t("pdf.vat_type"), vehicle.vatType || t("common.unknown"));
  if (vehicle.vin) {
    dataRow("VIN", vehicle.vin);
  }
  y += 3;

  sectionHeader(t("pdf.cost_spec"));
  dataRow(t("pdf.purchase_price"), `${formatCurrency(vehicle.purchasePrice || 0, vehicle.purchaseCurrency || "EUR")}`);
  dataRow(t("pdf.auction_fee"), formatCurrency(vehicle.auctionFees || 0, "DKK"));
  dataRow(t("pdf.transport"), formatCurrency(vehicle.transportCost || 0, "DKK"));
  dataRow(t("pdf.preparation"), formatCurrency(vehicle.preparationCost || 0, "DKK"));
  dataRow(t("pdf.inspection"), formatCurrency(vehicle.inspectionCost || 0, "DKK"));
  dataRow(t("pdf.other"), formatCurrency(vehicle.otherCosts || 0, "DKK"));
  dataRow(t("pdf.reg_tax"), formatCurrency(vehicle.registrationTax || 0, "DKK"));
  dataRow(t("pdf.vat_return"), `-${formatCurrency(vehicle.vatReturn || 0, "DKK")}`);
  dataRow(t("pdf.total_costs"), formatCurrency(totalCost, "DKK"), { bold: true, separator: true, highlight: true });
  y += 3;

  sectionHeader(t("pdf.resale_profit"));

  checkPageBreak(40);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y - 2, contentWidth, 32, 2, 2, "F");

  const colW = contentWidth / 3;
  const scenarioLabels = [t("pdf.sale_conservative"), t("pdf.sale_normal"), t("pdf.sale_optimistic")];
  const resaleVals = [vehicle.resaleConservative || 0, vehicle.resaleNormal || 0, vehicle.resaleOptimistic || 0];
  const profitVals = [profitConservative, profitNormal, profitOptimistic];
  const roiVals = [roiConservative, roi, roiOptimistic];

  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < 3; i++) {
    const cx = margin + colW * i + colW / 2;
    doc.text(scenarioLabels[i], cx, y + 3, { align: "center" });

    doc.setTextColor(...textDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(resaleVals[i], "DKK"), cx, y + 9, { align: "center" });

    const profitColor: [number, number, number] = profitVals[i] >= 0 ? [34, 150, 70] : [220, 50, 50];
    doc.setTextColor(...profitColor);
    doc.setFontSize(8);
    doc.text(`${profitVals[i] >= 0 ? "+" : ""}${formatCurrency(profitVals[i], "DKK")}`, cx, y + 15, { align: "center" });

    doc.setFontSize(7);
    doc.text(`ROI: ${roiVals[i].toFixed(1)}%`, cx, y + 20, { align: "center" });

    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
  }

  if (colW > 0) {
    doc.setDrawColor(...medGray);
    doc.setLineWidth(0.2);
    doc.line(margin + colW, y + 0.5, margin + colW, y + 22);
    doc.line(margin + colW * 2, y + 0.5, margin + colW * 2, y + 22);
  }

  y += 26;
  dataRow("MaxBid", formatCurrency(maxBid, "DKK"), { bold: true, highlight: true });
  y += 3;

  sectionHeader(t("pdf.assessment"));
  const recLabels: Record<string, string> = { buy: t("common.buy"), consider: t("common.consider"), drop: t("common.drop") };
  const recColors: Record<string, [number, number, number]> = { buy: [34, 197, 94], consider: orange, drop: [239, 68, 68] };

  checkPageBreak(20);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y - 2, contentWidth, 16, 2, 2, "F");

  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text("Deal Score", margin + 4, y + 3);
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${vehicle.dealScore || 0}`, margin + 34, y + 4);
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.setFont("helvetica", "normal");
  doc.text("/ 100", margin + 44, y + 4);

  const scoreBarX = margin + 60;
  const scoreBarW = 60;
  const scoreBarH = 4;
  doc.setFillColor(...medGray);
  doc.roundedRect(scoreBarX, y + 1, scoreBarW, scoreBarH, 1.5, 1.5, "F");
  doc.setFillColor(...scoreColor);
  doc.roundedRect(scoreBarX, y + 1, scoreBarW * Math.min((vehicle.dealScore || 0) / 100, 1), scoreBarH, 1.5, 1.5, "F");

  doc.setFillColor(...(recColors[recommendation] || orange));
  doc.roundedRect(pageWidth - margin - 32, y, 28, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text((recLabels[recommendation] || recommendation).toUpperCase(), pageWidth - margin - 18, y + 4.5, { align: "center" });

  y += 10;
  doc.setFont("helvetica", "normal");
  if (risks.length > 0) {
    doc.setTextColor(200, 60, 60);
    doc.setFontSize(7);
    doc.text(`${t("pdf.risk_flags")}: ${risks.join(" | ")}`, margin + 4, y + 2);
  } else {
    doc.setTextColor(34, 150, 70);
    doc.setFontSize(7);
    doc.text(t("pdf.no_risks"), margin + 4, y + 2);
  }
  y += 10;

  if (comps.length > 0) {
    sectionHeader(t("pdf.market_comparison") || "Market Comparison");
    checkPageBreak(10 + comps.length * 5);

    const cols = [margin + 2, margin + 55, margin + 85, margin + 115, margin + 145];
    doc.setFillColor(...powderBlue);
    doc.rect(margin, y - 3, contentWidth, 6, "F");
    doc.setTextColor(...darkBlue);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(t("dashboard.car"), cols[0], y);
    doc.text(t("common.year"), cols[1], y);
    doc.text(t("common.mileage"), cols[2], y);
    doc.text(t("common.price"), cols[3], y);
    doc.text(t("pdf.source_country"), cols[4], y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textDark);
    const displayComps = comps.slice(0, 8);
    displayComps.forEach((c, idx) => {
      checkPageBreak(6);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, y - 3.5, contentWidth, 5.5, "F");
      }
      doc.setFontSize(7);
      doc.setTextColor(...textDark);
      const compName = `${c.make} ${c.model} ${c.variant || ""}`.substring(0, 28);
      doc.text(compName, cols[0], y);
      doc.text(String(c.year), cols[1], y);
      doc.text(`${formatNumber(c.mileageKm)}`, cols[2], y);
      doc.text(formatCurrency(c.price, c.currency), cols[3], y);
      doc.setTextColor(...textMuted);
      doc.text((c.source || "").substring(0, 12), cols[4], y);
      y += 5;
    });

    if (comps.length > 0) {
      y += 2;
      const avgPrice = comps.reduce((s, c) => s + c.price, 0) / comps.length;
      const avgKm = comps.reduce((s, c) => s + c.mileageKm, 0) / comps.length;
      doc.setFillColor(...powderBlue);
      doc.rect(margin, y - 3, contentWidth, 6, "F");
      doc.setTextColor(...darkBlue);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`${t("common.total")} (${comps.length})`, cols[0], y);
      doc.text(`${formatNumber(Math.round(avgKm))}`, cols[2], y);
      doc.text(formatCurrency(Math.round(avgPrice), comps[0]?.currency || "DKK"), cols[3], y);
      y += 8;
    }
  }

  if (aiAnalysis) {
    checkPageBreak(30);
    sectionHeader(t("pdf.ai_conclusion") || "AI Konklusion & Anbefaling");

    doc.setFillColor(252, 250, 245);
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.4);

    const lines = doc.splitTextToSize(aiAnalysis, contentWidth - 12);
    const blockHeight = lines.length * 4 + 8;
    checkPageBreak(blockHeight + 4);

    doc.roundedRect(margin, y - 2, contentWidth, blockHeight, 2, 2, "FD");

    doc.setFillColor(...orange);
    doc.roundedRect(margin + 4, y + 1, 3, 3, 0.5, 0.5, "F");
    doc.setTextColor(...orange);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("AI-GENERERET ANALYSE", margin + 10, y + 3);

    y += 7;
    doc.setTextColor(...textDark);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(lines, margin + 6, y);
    y += lines.length * 4 + 6;
  }

  y += 4;
  checkPageBreak(22);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text(t("pdf.disclaimer1"), margin + 4, y + 5);
  doc.text(t("pdf.disclaimer2"), margin + 4, y + 9);
  doc.text("ApexValue - B2B Vehicle Trading & Valuation Platform", margin + 4, y + 13);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...darkBlue);
    doc.rect(0, pageHeight - 8, pageWidth, 8, "F");
    doc.setTextColor(185, 217, 235);
    doc.setFontSize(6);
    doc.text(`ApexValue Rapport - ${vehicleTitle}`, margin, pageHeight - 3);
    doc.text(`${t("pdf.page") || "Side"} ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: "right" });
  }

  doc.save(`ApexValue_${vehicle.make}_${vehicle.model}_${vehicle.year}_Rapport.pdf`);
}

interface GeneratedReport {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  generatedAt: Date;
  dealScore: number;
  hasAI: boolean;
}

export default function Reports() {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const allVehicles = vehicles || [];

  const fetchComps = async (vehicleId: number): Promise<MarketComp[]> => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/comps`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  const fetchAIAnalysis = async (vehicleId: number): Promise<string> => {
    try {
      const res = await apiRequest("POST", `/api/vehicles/${vehicleId}/ai-analysis`, { language });
      const data = await res.json();
      return data.analysis || "";
    } catch {
      return "";
    }
  };

  const handleGenerate = async (vehicleId: string, withAI: boolean = true) => {
    const id = parseInt(vehicleId);
    const vehicle = allVehicles.find(v => v.id === id);
    if (!vehicle) return;

    setGeneratingId(id);
    setAiLoading(withAI);
    try {
      const comps = await fetchComps(id);
      let aiAnalysis = "";
      if (withAI) {
        aiAnalysis = await fetchAIAnalysis(id);
      }
      await generatePDF(vehicle, comps, t, aiAnalysis);
      setGeneratedReports(prev => [{
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        generatedAt: new Date(),
        dealScore: vehicle.dealScore || 0,
        hasAI: !!aiAnalysis,
      }, ...prev]);
      toast({ title: t("reports.pdf_generated"), description: t("reports.pdf_downloaded").replace("{name}", `${vehicle.make} ${vehicle.model}`) });
    } catch {
      toast({ title: t("pipeline.error"), description: t("reports.error_pdf"), variant: "destructive" });
    }
    setGeneratingId(null);
    setAiLoading(false);
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
      <DemoBanner />
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
                    <div className="flex items-center justify-between gap-1 text-xs mb-1">
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
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#FF6319]" />
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
              <Select
                onValueChange={(v) => handleGenerate(v, true)}
                disabled={generatingId !== null}
              >
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
              {generatingId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {aiLoading ? (t("pdf.ai_loading") || "AI analyserer...") : t("common.generating")}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">{t("reports.batch_export")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("reports.batch_hint")}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-export-hot-deals"
                disabled={generatingId !== null}
                onClick={async () => {
                  const hotDealVehicles = allVehicles.filter(v => (v.dealScore || 0) >= 70);
                  for (const v of hotDealVehicles) {
                    await handleGenerate(String(v.id), false);
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
                disabled={generatingId !== null}
                onClick={async () => {
                  for (const v of allVehicles.slice(0, 5)) {
                    await handleGenerate(String(v.id), false);
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
                    <th className="p-3 font-medium">AI</th>
                    <th className="p-3 font-medium">{t("reports.generated")}</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {generatedReports.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-xs font-medium">{r.make} {r.model} {r.year}</td>
                      <td className="p-3 text-xs text-center tabular-nums font-semibold text-[#FF6319]">{r.dealScore}</td>
                      <td className="p-3 text-xs">
                        {r.hasAI ? (
                          <Badge variant="outline" className="text-[10px]">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{r.generatedAt.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerate(String(r.vehicleId), true)}
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
