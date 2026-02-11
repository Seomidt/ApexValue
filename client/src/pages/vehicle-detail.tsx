import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DealScoreBadge, DealRecommendationBadge } from "@/components/deal-score-badge";
import { formatCurrency, formatNumber } from "@/lib/i18n";
import { calcTotalCost, calcProfit, calcROI, calcMaxBid, getRiskFlags } from "@/lib/calculations";
import {
  ArrowLeft, ExternalLink, Calendar, Gauge, Settings2, Fuel, FileText,
  TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3
} from "lucide-react";
import { Link } from "wouter";
import type { Vehicle, MarketComp } from "@shared/schema";

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color || ""}`}>{value}</span>
    </div>
  );
}

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", vehicleId],
  });

  const { data: comps } = useQuery<MarketComp[]>({
    queryKey: ["/api/vehicles", vehicleId, "comps"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-semibold">Bil ikke fundet</h2>
        <Link href="/auction-finder">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tilbage til Søger
          </Button>
        </Link>
      </div>
    );
  }

  const v = vehicle;
  const totalCost = calcTotalCost(v);
  const profitC = calcProfit(v, "conservative");
  const profitN = calcProfit(v, "normal");
  const profitO = calcProfit(v, "optimistic");
  const roiC = calcROI(v, "conservative");
  const roiN = calcROI(v, "normal");
  const roiO = calcROI(v, "optimistic");
  const maxBid = calcMaxBid(v);
  const riskFlags = getRiskFlags(v);
  const score = v.dealScore || 0;
  const maxBidRoom = maxBid - (v.purchasePrice || 0);

  const allComps = comps || [];
  const avgCompPrice = allComps.length > 0 ? allComps.reduce((s, c) => s + c.price, 0) / allComps.length : 0;
  const medianCompPrice = allComps.length > 0
    ? [...allComps].sort((a, b) => a.price - b.price)[Math.floor(allComps.length / 2)].price
    : 0;
  const minCompPrice = allComps.length > 0 ? Math.min(...allComps.map(c => c.price)) : 0;
  const maxCompPrice = allComps.length > 0 ? Math.max(...allComps.map(c => c.price)) : 0;

  const placeholderImg = `https://placehold.co/600x400/1a2332/B9D9EB?text=${encodeURIComponent(v.make + ' ' + v.model)}`;
  const imgSrc = v.imageUrls && v.imageUrls.length > 0 ? v.imageUrls[0] : placeholderImg;

  const gearLabel = v.gearbox === "automatic" ? "Automatisk" : v.gearbox === "manual" ? "Manuel" : v.gearbox;
  const fuelLabel = v.fuelType === "petrol" ? "Benzin" : v.fuelType === "electric" ? "El" : v.fuelType === "hybrid" ? "Hybrid" : v.fuelType;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/auction-finder">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" data-testid="text-vehicle-title">
            {v.make} {v.model} {v.variant || ""}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{v.year}</span>
            <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />{formatNumber(v.mileageKm)} km</span>
            <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" />{gearLabel}</span>
            <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" />{fuelLabel}</span>
            {v.sourceCountry && <Badge variant="outline" className="text-xs">{v.sourceCountry}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DealScoreBadge score={score} size="lg" />
          <DealRecommendationBadge score={score} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Totale Omkostninger</p>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(totalCost, "DKK")}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Fortjeneste (Normal)</p>
          <p className={`text-lg font-bold tabular-nums ${profitN >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatCurrency(profitN, "DKK")}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">ROI (Normal)</p>
          <p className={`text-lg font-bold tabular-nums ${roiN >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {roiN.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">MaxBud</p>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(maxBid, "DKK")}</p>
          <p className={`text-xs tabular-nums ${maxBidRoom >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            rum: {formatCurrency(maxBidRoom, "DKK")}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="source" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="source" data-testid="tab-source">Kildedata</TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market">Markedsanalyse</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax">Skat & Afgift</TabsTrigger>
          <TabsTrigger value="costs" data-testid="tab-costs">Moms & Omkostninger</TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit">Profit & ROI</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">Noter</TabsTrigger>
        </TabsList>

        <TabsContent value="source">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img src={imgSrc} alt={`${v.make} ${v.model}`} className="w-full h-48 object-cover rounded-md" />
              </div>
              <div className="space-y-0">
                <StatRow label="VIN" value={v.vin || "N/A"} />
                <StatRow label="Nummerplade" value={v.plate || "N/A"} />
                <StatRow label="Mærke/Model" value={`${v.make} ${v.model}`} />
                <StatRow label="Variant" value={v.variant || "N/A"} />
                <StatRow label="Årgang" value={String(v.year)} />
                <StatRow label="Kilometer" value={`${formatNumber(v.mileageKm)} km`} />
                <StatRow label="Motoreffekt" value={v.enginePower ? `${v.enginePower} hk` : "N/A"} />
                <StatRow label="CO2" value={v.co2 ? `${v.co2} g/km` : "N/A"} />
                <StatRow label="Gearkasse" value={gearLabel} />
                <StatRow label="Brændstof" value={fuelLabel} />
                <StatRow label="Farve" value={v.color || "N/A"} />
                <Separator className="my-2" />
                <StatRow label="Indkøbspris" value={formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)} />
                <StatRow label="Auktionsgebyr" value={formatCurrency(v.auctionFees || 0, v.purchaseCurrency)} />
                {v.sourceUrl && (
                  <div className="pt-2">
                    <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Åbn Kilde
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Markedssammenligninger ({allComps.length} sammenligninger)
            </h3>
            {allComps.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">Min</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(minCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">Median</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(medianCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">Gennemsnit</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(avgCompPrice, "DKK")}</p>
                  </Card>
                  <Card className="p-2 text-center">
                    <p className="text-xs text-muted-foreground">Maks</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(maxCompPrice, "DKK")}</p>
                  </Card>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Bil</th>
                        <th className="pb-2 font-medium">Årgang</th>
                        <th className="pb-2 font-medium">Kilometer</th>
                        <th className="pb-2 font-medium text-right">Pris</th>
                        <th className="pb-2 font-medium">Lokation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allComps.map((c, i) => (
                        <tr key={c.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-accent/30" : ""}`}>
                          <td className="py-2">{c.make} {c.model} {c.variant || ""}</td>
                          <td className="py-2">{c.year}</td>
                          <td className="py-2">{formatNumber(c.mileageKm)} km</td>
                          <td className="py-2 text-right font-semibold tabular-nums">{formatCurrency(c.price, c.currency)}</td>
                          <td className="py-2 text-muted-foreground">{c.location || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Ingen markedssammenligninger tilgængelige</p>
                <p className="text-xs text-muted-foreground mt-1">Aktivér Live Mode for at hente reelle markedsdata</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Skat & Registreringsafgift</h3>
            <StatRow label="Registreringsafgift" value={v.registrationTax != null ? formatCurrency(v.registrationTax, "DKK") : "Ukendt"} />
            {v.registrationTax == null && (
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Registreringsafgift er ukendt. Tilføj manuelt eller brug ASG-integration i Live Mode.</span>
              </div>
            )}
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              Ansvarsfraskrivelse: Alle afgiftsberegninger er vejledende. Kontakt officielle myndigheder inden køb.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card className="p-4 space-y-0">
            <h3 className="text-sm font-semibold mb-3">Omkostningsspecifikation</h3>
            <StatRow label="Indkøbspris" value={formatCurrency(v.purchasePrice || 0, v.purchaseCurrency)} />
            <StatRow label="Auktionsgebyr" value={formatCurrency(v.auctionFees || 0, "DKK")} />
            <StatRow label="Transport" value={formatCurrency(v.transportCost || 0, "DKK")} />
            <StatRow label="Klargøring" value={formatCurrency(v.preparationCost || 0, "DKK")} />
            <StatRow label="Syn/Nummerplader" value={formatCurrency(v.inspectionCost || 0, "DKK")} />
            <StatRow label="Øvrige Omkostninger" value={formatCurrency(v.otherCosts || 0, "DKK")} />
            <StatRow label="Registreringsafgift" value={formatCurrency(v.registrationTax || 0, "DKK")} />
            <Separator className="my-2" />
            <StatRow label="Momstype" value={v.vatType === "unknown" ? "Ukendt" : v.vatType} />
            <StatRow label="Momsrefusion" value={formatCurrency(v.vatReturn || 0, "DKK")} color="text-emerald-500" />
            <Separator className="my-2" />
            <StatRow label="Totale Omkostninger (Netto)" value={formatCurrency(totalCost, "DKK")} />
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-0">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Salgsscenarier
              </h3>
              <StatRow label="Konservativ" value={formatCurrency(v.resaleConservative || 0, "DKK")} />
              <StatRow label="Normal" value={formatCurrency(v.resaleNormal || 0, "DKK")} />
              <StatRow label="Optimistisk" value={formatCurrency(v.resaleOptimistic || 0, "DKK")} />
              <Separator className="my-2" />
              <StatRow label="Break-even" value={formatCurrency(totalCost, "DKK")} />
            </Card>

            <Card className="p-4 space-y-0">
              <h3 className="text-sm font-semibold mb-3">Fortjeneste & ROI</h3>
              <StatRow label="Konservativ Fortjeneste" value={formatCurrency(profitC, "DKK")} color={profitC >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label="Konservativ ROI" value={`${roiC.toFixed(1)}%`} color={roiC >= 0 ? "text-emerald-500" : "text-red-500"} />
              <Separator className="my-1" />
              <StatRow label="Normal Fortjeneste" value={formatCurrency(profitN, "DKK")} color={profitN >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label="Normal ROI" value={`${roiN.toFixed(1)}%`} color={roiN >= 0 ? "text-emerald-500" : "text-red-500"} />
              <Separator className="my-1" />
              <StatRow label="Optimistisk Fortjeneste" value={formatCurrency(profitO, "DKK")} color={profitO >= 0 ? "text-emerald-500" : "text-red-500"} />
              <StatRow label="Optimistisk ROI" value={`${roiO.toFixed(1)}%`} color={roiO >= 0 ? "text-emerald-500" : "text-red-500"} />
            </Card>
          </div>

          <Card className="p-4 mt-4 space-y-0">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> MaxBud Strategier
            </h3>
            <StatRow label="Sikker (20K profit)" value={formatCurrency(calcMaxBid(v, 20000), "DKK")} />
            <StatRow label="Balanceret (15K profit)" value={formatCurrency(calcMaxBid(v, 15000), "DKK")} />
            <StatRow label="Aggressiv (8K profit)" value={formatCurrency(calcMaxBid(v, 8000), "DKK")} />
          </Card>

          {riskFlags.length > 0 && (
            <Card className="p-4 mt-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Risikofaktorer
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {riskFlags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    {flag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Noter & Historik</h3>
            {v.notes ? (
              <p className="text-sm whitespace-pre-wrap">{v.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen noter tilføjet endnu.</p>
            )}
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Status: <Badge variant="outline" className="text-xs ml-1">{v.status}</Badge></p>
              <p>Oprettet: {v.createdAt ? new Date(v.createdAt).toLocaleDateString("da-DK") : "N/A"}</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
