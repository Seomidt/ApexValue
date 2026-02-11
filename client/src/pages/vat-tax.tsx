import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Info, AlertTriangle } from "lucide-react";

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
    id: "private",
    name: "Privat Salg",
    description: "Køb fra privat sælger. Ingen moms opkrævet eller fradragsberettiget.",
    countries: ["Alle"],
    vatOnPurchase: "0%",
    vatOnResale: "Brugtmoms kan anvendes",
    vatReturn: "N/A",
    capitalBinding: "Ingen",
  },
];

export default function VatTax() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Receipt className="w-5 h-5" /> Moms & Afgiftscenter
        </h1>
        <p className="text-sm text-muted-foreground">Skabeloner og regler for de 8 største markeder</p>
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

      <div className="space-y-3">
        {vatTemplates.map((template) => (
          <Card key={template.id} className="p-4" data-testid={`card-vat-${template.id}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {template.countries.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
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
        <p className="text-sm text-muted-foreground">
          Registreringsafgiften varierer betydeligt efter land og bilspecifikationer (CO2, værdi, alder).
          I Danmark kan registreringsafgiften være 85-150% af bilens værdi for standardbiler.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
          <div>
            <p className="text-muted-foreground">Danmark</p>
            <p className="font-semibold mt-0.5">85-150%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tyskland</p>
            <p className="font-semibold mt-0.5">~0% (kun CO2-afgift)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Holland</p>
            <p className="font-semibold mt-0.5">BPM (CO2-baseret)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Norge</p>
            <p className="font-semibold mt-0.5">Vægt + CO2 + NOx</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
