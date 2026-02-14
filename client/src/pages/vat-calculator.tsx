import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info } from "lucide-react";
import { useLanguage, formatCurrency } from "@/lib/i18n";

const EUR_DKK_RATE = 7.45;

type VatScheme = "eu_reverse_charge" | "dk_vat" | "margin" | "private";

function calcVat(scheme: VatScheme, purchaseEur: number, resaleDkk: number) {
  const purchaseDkk = purchaseEur * EUR_DKK_RATE;
  let purchaseVat = 0;
  let salesVat = 0;
  let vatReturn = 0;
  let bindingLevel: "minimal" | "medium" | "high" = "minimal";

  switch (scheme) {
    case "eu_reverse_charge":
      purchaseVat = 0;
      salesVat = resaleDkk * 0.25;
      vatReturn = purchaseDkk * 0.25;
      bindingLevel = "minimal";
      break;
    case "dk_vat":
      purchaseVat = purchaseDkk * 0.25;
      salesVat = resaleDkk * 0.25;
      vatReturn = purchaseVat;
      bindingLevel = "medium";
      break;
    case "margin":
      purchaseVat = 0;
      salesVat = Math.max(0, (resaleDkk - purchaseDkk) * 0.25);
      vatReturn = 0;
      bindingLevel = "minimal";
      break;
    case "private":
      purchaseVat = 0;
      salesVat = resaleDkk * 0.25;
      vatReturn = 0;
      bindingLevel = "high";
      break;
  }

  const netVat = salesVat - vatReturn;

  return { purchaseVat, salesVat, vatReturn, netVat, bindingLevel };
}

export default function VatCalculator() {
  const { t } = useLanguage();
  const [scheme, setScheme] = useState<VatScheme>("eu_reverse_charge");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [resalePrice, setResalePrice] = useState<number>(0);

  const result = calcVat(scheme, purchasePrice, resalePrice);

  const bindingColor = result.bindingLevel === "minimal"
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    : result.bindingLevel === "medium"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
      : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";

  const bindingLabel = result.bindingLevel === "minimal"
    ? t("vat_calc.minimal")
    : result.bindingLevel === "medium"
      ? t("vat_calc.medium")
      : t("vat_calc.high");

  const bindingDesc = result.bindingLevel === "minimal"
    ? t("vat_calc.binding_minimal_desc")
    : result.bindingLevel === "medium"
      ? t("vat_calc.binding_medium_desc")
      : t("vat_calc.binding_high_desc");

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-vat-calc-title">
          <Calculator className="w-5 h-5" /> {t("vat_calc.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("vat_calc.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vat-scheme">{t("vat_calc.vat_scheme")}</Label>
            <Select value={scheme} onValueChange={(v) => setScheme(v as VatScheme)}>
              <SelectTrigger data-testid="select-vat-scheme" id="vat-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu_reverse_charge" data-testid="option-eu-reverse">{t("vat_calc.eu_reverse")}</SelectItem>
                <SelectItem value="dk_vat" data-testid="option-dk-vat">{t("vat_calc.dk_vat")}</SelectItem>
                <SelectItem value="margin" data-testid="option-margin">{t("vat_calc.margin_scheme")}</SelectItem>
                <SelectItem value="private" data-testid="option-private">{t("vat_calc.private_purchase")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-price">{t("vat_calc.purchase_price")}</Label>
            <Input
              id="purchase-price"
              type="number"
              min={0}
              value={purchasePrice || ""}
              onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
              data-testid="input-purchase-price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-price">{t("vat_calc.resale_price")}</Label>
            <Input
              id="resale-price"
              type="number"
              min={0}
              value={resalePrice || ""}
              onChange={(e) => setResalePrice(Number(e.target.value) || 0)}
              data-testid="input-resale-price"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-0">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.purchase_vat")}</span>
            <span className="text-sm font-semibold tabular-nums" data-testid="text-purchase-vat">
              {formatCurrency(result.purchaseVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.sales_vat")}</span>
            <span className="text-sm font-semibold tabular-nums" data-testid="text-sales-vat">
              {formatCurrency(result.salesVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.vat_return")}</span>
            <span className="text-sm font-semibold tabular-nums text-emerald-500" data-testid="text-vat-return">
              {formatCurrency(result.vatReturn, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold">{t("vat_calc.net_vat")}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: "#FF6319" }} data-testid="text-net-vat">
              {formatCurrency(result.netVat, "DKK")}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("vat_calc.capital_binding")}</span>
            <Badge variant="outline" className={bindingColor} data-testid="badge-capital-binding">
              {bindingLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-binding-desc">{bindingDesc}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> {t("vat_calc.scheme_explanations")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.eu_reverse")}</p>
            <p className="text-muted-foreground">{t("vat_calc.eu_reverse_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.dk_vat")}</p>
            <p className="text-muted-foreground">{t("vat_calc.dk_vat_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.margin_scheme")}</p>
            <p className="text-muted-foreground">{t("vat_calc.margin_desc")}</p>
          </div>
          <div className="p-3 rounded-md border space-y-1">
            <p className="font-semibold text-sm">{t("vat_calc.private_purchase")}</p>
            <p className="text-muted-foreground">{t("vat_calc.private_desc")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
