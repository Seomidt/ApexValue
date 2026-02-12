import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDealRecommendation } from "@/lib/calculations";
import { useLanguage } from "@/lib/i18n";
import { Info, X } from "lucide-react";

interface DealScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function DealScoreBadge({ score, size = "md" }: DealScoreBadgeProps) {
  const rec = getDealRecommendation(score);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const colorClasses = {
    buy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    consider: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    drop: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses[size]} ${colorClasses[rec]} font-bold tabular-nums`}
      data-testid={`badge-deal-score-${score}`}
    >
      {score}
    </Badge>
  );
}

export function DealRecommendationBadge({ score }: { score: number }) {
  const rec = getDealRecommendation(score);
  const { t } = useLanguage();
  const labels = { buy: t("common.buy"), consider: t("common.consider"), drop: t("common.drop") };
  const colors = {
    buy: "bg-emerald-500 text-white",
    consider: "bg-amber-500 text-white",
    drop: "bg-red-500 text-white",
  };

  return (
    <Badge className={`${colors[rec]} font-bold text-xs no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-recommendation-${rec}`}>
      {labels[rec]}
    </Badge>
  );
}

const LEGEND_STORAGE_KEY = "apexvalue_score_legend_hidden";

function getStoredLegendPref(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(LEGEND_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function DealScoreLegend() {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(() => getStoredLegendPref());

  const handleDismiss = () => {
    setHidden(true);
    localStorage.setItem(LEGEND_STORAGE_KEY, "true");
  };

  const handleShow = () => {
    setHidden(false);
    localStorage.removeItem(LEGEND_STORAGE_KEY);
  };

  if (hidden) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShow}
        className="text-muted-foreground gap-1"
        data-testid="button-show-score-legend"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="text-xs">{t("score.whats_this")}</span>
      </Button>
    );
  }

  return (
    <div className="rounded-md border bg-card p-3 text-xs space-y-2" data-testid="score-legend">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm">{t("score.legend_title")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          data-testid="button-hide-score-legend"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400">{t("common.buy")} (70-100)</strong>
            {" — "}{t("score.buy_desc")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>
            <strong className="text-amber-600 dark:text-amber-400">{t("common.consider")} (40-69)</strong>
            {" — "}{t("score.consider_desc")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span>
            <strong className="text-red-600 dark:text-red-400">{t("common.drop")} (0-39)</strong>
            {" — "}{t("score.drop_desc")}
          </span>
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed">{t("score.explanation")}</p>
    </div>
  );
}
