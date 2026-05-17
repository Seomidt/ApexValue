import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, useLanguage } from "@/lib/i18n";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CostTemplate } from "@shared/schema";

export default function CostTemplates() {
  const { t } = useLanguage();
  const { data: templates, isLoading } = useQuery<CostTemplate[]>({
    queryKey: ["/api/cost-templates"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-md" />
        ))}
      </div>
    );
  }

  const allTemplates = templates || [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Layers className="w-5 h-5" /> {t("cost.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("cost.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allTemplates.map((template) => {
          const total = (template.transport || 0) + (template.preparation || 0) +
            (template.inspection || 0) + (template.plates || 0) + (template.buffer || 0);
          return (
            <Card key={template.id} className="p-4" data-testid={`card-cost-template-${template.id}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-xs">{template.marketCountry}</Badge>
                    <Badge variant="outline" className="text-xs">{template.currency}</Badge>
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">{t("cost.default")}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cost.transport")}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(template.transport || 0, template.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cost.preparation")}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(template.preparation || 0, template.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cost.inspection")}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(template.inspection || 0, template.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cost.plates")}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(template.plates || 0, template.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cost.buffer")}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(template.buffer || 0, template.currency)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>{t("common.total")}</span>
                  <span className="tabular-nums">{formatCurrency(total, template.currency)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {allTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">{t("cost.no_templates")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("cost.demo_hint")}</p>
        </div>
      )}
    </div>
  );
}
