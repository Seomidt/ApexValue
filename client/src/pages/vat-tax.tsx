import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Receipt, Info, AlertTriangle } from "lucide-react";
import { MARKET_COUNTRIES } from "@shared/schema";

const vatTemplates = [
  {
    id: "eu_reverse_charge",
    name: "EU Reverse Charge",
    description: "Køb fra EU-forhandler med momsnummer. Ingen moms ved køb, opkræv 25% DK moms ved videresalg.",
    countries: ["DE", "NL", "BE", "FR", "SE", "PL"],
    vatOnPurchase: "0%",
    vatOnResale: "25%",
    vatReturn: "N/A (ingen købsmoms)",
    capitalBinding: "Lav - ingen momsbinding",
  },
  {
    id: "dk_vat",
    name: "DK Moms (25%)",
    description: "Standard dansk moms. 25% moms ved køb, fradragsberettiget mod 25% moms ved videresalg.",
    countries: ["DK"],
    vatOnPurchase: "25%",
    vatOnResale: "25%",
    vatReturn: "Købsmoms fradragsberettiget",
    capitalBinding: "Middel - momsrefusion ved kvartalsafregning",
  },
  {
    id: "margin",
    name: "Brugtmoms",
    description: "Brugtmomsordning. Moms beregnes kun af avancen, ikke af den fulde salgspris.",
    countries: ["DK", "DE", "NL", "FR", "BE"],
    vatOnPurchase: "Inkluderet i prisen",
    vatOnResale: "25% af avancen",
    vatReturn: "N/A",
    capitalBinding: "Lav",
  },
  {
    id: "no_vat",
    name: "Norge MVA (25%)",
    description: "Norsk merverdiavgift. Import fra EU kræver toll- og MVA-beregning ved grænsen.",
    countries: ["NO"],
    vatOnPurchase: "25% MVA + evt. toll",
    vatOnResale: "25% MVA",
    vatReturn: "MVA fradragsberettiget for næringsdrivende",
    capitalBinding: "Høj - MVA betales ved import",
  },
  {
    id: "se_vat",
    name: "Sverige Moms (25%)",
    description: "Svensk moms på bilhandel. EU-intern handel med reverse charge for registrerede virksomheder.",
    countries: ["SE"],
    vatOnPurchase: "25% (eller 0% ved reverse charge)",
    vatOnResale: "25%",
    vatReturn: "Fradragsberettiget for momsregistrerede",
    capitalBinding: "Middel",
  },
  {
    id: "private",
    name: "Privat Salg",
    description: "Køb fra privat sælger. Ingen moms opkrævet eller fradragsberettiget.",
    countries: ["DK", "DE", "NL", "BE", "FR", "SE", "NO", "PL"],
    vatOnPurchase: "0%",
    vatOnResale: "Brugtmoms kan anvendes",
    vatReturn: "N/A",
    capitalBinding: "Ingen",
  },
];

const registrationTax: Record<string, { label: string; rate: string; detail: string }> = {
  DK: { label: "Danmark", rate: "85-150%", detail: "Progressiv afgift baseret på bilens værdi. Fradrag for sikkerhedsudstyr og brændstofeffektivitet. Elbiler har nedsat sats." },
  DE: { label: "Tyskland", rate: "~0%", detail: "Ingen registreringsafgift. Kun CO2-baseret kfz-steuer (årlig vægtafgift)." },
  NL: { label: "Holland", rate: "BPM (CO2)", detail: "BPM er CO2-baseret. Kan være meget høj for dieselbiler. Elbiler er fritaget." },
  NO: { label: "Norge", rate: "Vægt+CO2+NOx", detail: "Engangsafgift baseret på vægt, CO2 og NOx-udslip. Elbiler er fritaget." },
  SE: { label: "Sverige", rate: "Lav", detail: "Ingen registreringsafgift som sådan. Bonus-malus system baseret på CO2." },
  FR: { label: "Frankrig", rate: "CO2-baseret", detail: "Écotaxe baseret på CO2-udslip. Kan være betydelig for høj-CO2 biler." },
  BE: { label: "Belgien", rate: "BIV (regional)", detail: "Belasting op inverkeerstelling varierer efter region (Flandern, Vallonien, Bruxelles)." },
  PL: { label: "Polen", rate: "Akcyza 3.1-18.6%", detail: "Akcyza baseret på motorstørrelse. 3.1% for motorer under 2000cc, 18.6% for over." },
};

export default function VatTax() {
  const [countryFilter, setCountryFilter] = useState("all");

  const filteredTemplates = countryFilter === "all"
    ? vatTemplates
    : vatTemplates.filter(t => t.countries.includes(countryFilter));

  const filteredRegTax = countryFilter === "all"
    ? Object.entries(registrationTax)
    : Object.entries(registrationTax).filter(([code]) => code === countryFilter);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Receipt className="w-5 h-5" /> Moms & Afgiftscenter
          </h1>
          <p className="text-sm text-muted-foreground">Skabeloner og regler for de 8 største markeder</p>
        </div>
        <div className="w-48">
          <Label className="text-xs">Filtrer efter land</Label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger data-testid="select-vat-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle lande</SelectItem>
              {MARKET_COUNTRIES.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-3 flex items-start gap-2 border-amber-500/30 bg-amber-500/5">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">Vigtig Ansvarsfraskrivelse</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Alle moms- og afgiftsberegninger er vejledende. Kontakt altid din revisor
            eller den relevante skattemyndighed, inden du træffer købsbeslutninger. Reglerne varierer efter land og biltype.
          </p>
        </div>
      </Card>

      {filteredTemplates.length === 0 && (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          Ingen momsregler fundet for det valgte land.
        </Card>
      )}

      <div className="space-y-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-4" data-testid={`card-vat-${template.id}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {template.countries.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className={`text-xs cursor-pointer ${c === countryFilter ? "bg-[#FF6319]/15 text-[#FF6319] border-[#FF6319]/30" : ""}`}
                    onClick={() => setCountryFilter(c === countryFilter ? "all" : c)}
                    data-testid={`badge-country-${template.id}-${c}`}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Moms ved Køb</p>
                <p className="font-semibold mt-0.5">{template.vatOnPurchase}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Moms ved Salg</p>
                <p className="font-semibold mt-0.5">{template.vatOnResale}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Momsrefusion</p>
                <p className="font-semibold mt-0.5">{template.vatReturn}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kapitalbinding</p>
                <p className="font-semibold mt-0.5">{template.capitalBinding}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Registreringsafgift
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Registreringsafgiften varierer betydeligt efter land og bilspecifikationer (CO2, værdi, alder).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {filteredRegTax.map(([code, info]) => (
            <div key={code} className="p-3 rounded-md border space-y-1" data-testid={`card-regtax-${code}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{info.label}</p>
                <Badge variant="outline" className="text-xs">{info.rate}</Badge>
              </div>
              <p className="text-muted-foreground">{info.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
