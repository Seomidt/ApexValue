import { Badge } from "@/components/ui/badge";
import { getDealRecommendation } from "@/lib/calculations";

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
  const labels = { buy: "KØB", consider: "OVERVEJ", drop: "DROP" };
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
