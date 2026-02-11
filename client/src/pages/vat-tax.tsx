import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Info, AlertTriangle } from "lucide-react";

const vatTemplates = [
  {
    id: "eu_reverse_charge",
    name: "EU Reverse Charge",
    description: "Purchase from EU dealer with VAT number. No VAT paid at purchase, charge 25% DK VAT on resale.",
    countries: ["DE", "NL", "BE", "FR", "SE", "PL"],
    vatOnPurchase: "0%",
    vatOnResale: "25%",
    vatReturn: "N/A (no purchase VAT)",
    capitalBinding: "Low - no VAT capital lock-up",
  },
  {
    id: "dk_vat",
    name: "DK VAT (25%)",
    description: "Standard Danish VAT. 25% VAT on purchase, deductible against 25% VAT on resale.",
    countries: ["DK"],
    vatOnPurchase: "25%",
    vatOnResale: "25%",
    vatReturn: "Purchase VAT deductible",
    capitalBinding: "Medium - VAT refund on quarterly return",
  },
  {
    id: "margin",
    name: "Margin Scheme (Brugtmoms)",
    description: "Used car margin scheme. VAT only on profit margin, not full resale price.",
    countries: ["DK", "DE", "NL", "FR", "BE"],
    vatOnPurchase: "Included in price",
    vatOnResale: "25% of margin only",
    vatReturn: "N/A",
    capitalBinding: "Low",
  },
  {
    id: "private",
    name: "Private Sale",
    description: "Purchase from private seller. No VAT charged or deductible.",
    countries: ["All"],
    vatOnPurchase: "0%",
    vatOnResale: "25% margin scheme applicable",
    vatReturn: "N/A",
    capitalBinding: "None",
  },
];

export default function VatTax() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Receipt className="w-5 h-5" /> VAT & Tax Center
        </h1>
        <p className="text-sm text-muted-foreground">Templates and rules for the top 8 markets</p>
      </div>

      <Card className="p-3 flex items-start gap-2 border-amber-500/30 bg-amber-500/5">
        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">Important Disclaimer</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            All VAT and tax calculations are indicative only. Always verify with your accountant
            or the relevant tax authority before making purchase decisions. Rules vary by country and vehicle type.
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
                <p className="text-muted-foreground">VAT on Purchase</p>
                <p className="font-semibold mt-0.5">{template.vatOnPurchase}</p>
              </div>
              <div>
                <p className="text-muted-foreground">VAT on Resale</p>
                <p className="font-semibold mt-0.5">{template.vatOnResale}</p>
              </div>
              <div>
                <p className="text-muted-foreground">VAT Return</p>
                <p className="font-semibold mt-0.5">{template.vatReturn}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Capital Binding</p>
                <p className="font-semibold mt-0.5">{template.capitalBinding}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Registration Tax (Afgift)
        </h3>
        <p className="text-sm text-muted-foreground">
          Registration tax varies significantly by country and vehicle specifications (CO2, value, age).
          In Denmark, registration tax can be 85-150% of vehicle value for standard cars.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
          <div>
            <p className="text-muted-foreground">Denmark</p>
            <p className="font-semibold mt-0.5">85-150%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Germany</p>
            <p className="font-semibold mt-0.5">~0% (CO2 tax only)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Netherlands</p>
            <p className="font-semibold mt-0.5">BPM (CO2 based)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Norway</p>
            <p className="font-semibold mt-0.5">Weight + CO2 + NOx</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
