import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Receipt, Info, AlertTriangle } from "lucide-react";
import { MARKET_COUNTRIES } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

const vatTemplates = [
  {
    id: "eu_reverse_charge",
    nameKey: "vat.tmpl.eu_reverse_charge.name",
    descKey: "vat.tmpl.eu_reverse_charge.desc",
    countries: ["DE", "NL", "BE", "FR", "SE", "PL"],
    purchaseKey: "vat.tmpl.eu_reverse_charge.purchase",
    resaleKey: "vat.tmpl.eu_reverse_charge.resale",
    returnKey: "vat.tmpl.eu_reverse_charge.return",
    bindingKey: "vat.tmpl.eu_reverse_charge.binding",
  },
  {
    id: "dk_vat",
    nameKey: "vat.tmpl.dk_vat.name",
    descKey: "vat.tmpl.dk_vat.desc",
    countries: ["DK"],
    purchaseKey: "vat.tmpl.dk_vat.purchase",
    resaleKey: "vat.tmpl.dk_vat.resale",
    returnKey: "vat.tmpl.dk_vat.return",
    bindingKey: "vat.tmpl.dk_vat.binding",
  },
  {
    id: "margin",
    nameKey: "vat.tmpl.margin.name",
    descKey: "vat.tmpl.margin.desc",
    countries: ["DK", "DE", "NL", "FR", "BE"],
    purchaseKey: "vat.tmpl.margin.purchase",
    resaleKey: "vat.tmpl.margin.resale",
    returnKey: "vat.tmpl.margin.return",
    bindingKey: "vat.tmpl.margin.binding",
  },
  {
    id: "no_vat",
    nameKey: "vat.tmpl.no_vat.name",
    descKey: "vat.tmpl.no_vat.desc",
    countries: ["NO"],
    purchaseKey: "vat.tmpl.no_vat.purchase",
    resaleKey: "vat.tmpl.no_vat.resale",
    returnKey: "vat.tmpl.no_vat.return",
    bindingKey: "vat.tmpl.no_vat.binding",
  },
  {
    id: "se_vat",
    nameKey: "vat.tmpl.se_vat.name",
    descKey: "vat.tmpl.se_vat.desc",
    countries: ["SE"],
    purchaseKey: "vat.tmpl.se_vat.purchase",
    resaleKey: "vat.tmpl.se_vat.resale",
    returnKey: "vat.tmpl.se_vat.return",
    bindingKey: "vat.tmpl.se_vat.binding",
  },
  {
    id: "private",
    nameKey: "vat.tmpl.private.name",
    descKey: "vat.tmpl.private.desc",
    countries: ["DK", "DE", "NL", "BE", "FR", "SE", "NO", "PL"],
    purchaseKey: "vat.tmpl.private.purchase",
    resaleKey: "vat.tmpl.private.resale",
    returnKey: "vat.tmpl.private.return",
    bindingKey: "vat.tmpl.private.binding",
  },
];

const registrationTax: Record<string, { labelKey: string; rate: string; detailKey: string }> = {
  DK: { labelKey: "vat.reg.dk.label", rate: "85-150%", detailKey: "vat.reg.dk.detail" },
  DE: { labelKey: "vat.reg.de.label", rate: "~0%", detailKey: "vat.reg.de.detail" },
  NL: { labelKey: "vat.reg.nl.label", rate: "BPM (CO2)", detailKey: "vat.reg.nl.detail" },
  NO: { labelKey: "vat.reg.no.label", rate: "Vægt+CO2+NOx", detailKey: "vat.reg.no.detail" },
  SE: { labelKey: "vat.reg.se.label", rate: "Lav", detailKey: "vat.reg.se.detail" },
  FR: { labelKey: "vat.reg.fr.label", rate: "CO2-baseret", detailKey: "vat.reg.fr.detail" },
  BE: { labelKey: "vat.reg.be.label", rate: "BIV (regional)", detailKey: "vat.reg.be.detail" },
  PL: { labelKey: "vat.reg.pl.label", rate: "Akcyza 3.1-18.6%", detailKey: "vat.reg.pl.detail" },
};

export default function VatTax() {
  const { t } = useLanguage();
  const [countryFilter, setCountryFilter] = useState("all");

  const filteredTemplates = countryFilter === "all"
    ? vatTemplates
    : vatTemplates.filter(tmpl => tmpl.countries.includes(countryFilter));

  const filteredRegTax = countryFilter === "all"
    ? Object.entries(registrationTax)
    : Object.entries(registrationTax).filter(([code]) => code === countryFilter);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Receipt className="w-5 h-5" /> {t("vat.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("vat.subtitle")}</p>
        </div>
        <div className="w-48">
          <Label className="text-xs">{t("vat.filter_country")}</Label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger data-testid="select-vat-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("vat.all_countries")}</SelectItem>
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
          <p className="font-medium text-amber-600 dark:text-amber-400">{t("vat.disclaimer_title")}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {t("vat.disclaimer_text")}
          </p>
        </div>
      </Card>

      {filteredTemplates.length === 0 && (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          {t("vat.no_rules")}
        </Card>
      )}

      <div className="space-y-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-4" data-testid={`card-vat-${template.id}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">{t(template.nameKey)}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t(template.descKey)}</p>
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
                <p className="text-muted-foreground">{t("vat.on_purchase")}</p>
                <p className="font-semibold mt-0.5">{t(template.purchaseKey)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("vat.on_resale")}</p>
                <p className="font-semibold mt-0.5">{t(template.resaleKey)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("vat.vat_return")}</p>
                <p className="font-semibold mt-0.5">{t(template.returnKey)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("vat.capital_binding")}</p>
                <p className="font-semibold mt-0.5">{t(template.bindingKey)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> {t("vat.reg_tax_title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {t("vat.reg_tax_description")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {filteredRegTax.map(([code, info]) => (
            <div key={code} className="p-3 rounded-md border space-y-1" data-testid={`card-regtax-${code}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{t(info.labelKey)}</p>
                <Badge variant="outline" className="text-xs">{info.rate}</Badge>
              </div>
              <p className="text-muted-foreground">{t(info.detailKey)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
