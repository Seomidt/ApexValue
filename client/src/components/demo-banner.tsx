import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useLocation } from "wouter";
import { useAppMode } from "@/App";

export function DemoBanner() {
  const { t } = useLanguage();
  const { mode } = useAppMode();
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem("demo-banner-dismissed");
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("demo-banner-dismissed", "true");
  };

  if (mode !== "demo" || !isVisible) return null;

  return (
    <Card className="relative overflow-visible border-none bg-muted/30 p-4 mb-6" data-testid="banner-demo-mode">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#002776] dark:text-blue-200">
              {t("demo.banner_title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("demo.banner_desc")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#FF6319] text-white font-semibold px-6"
            onClick={() => setLocation("/settings")}
            data-testid="button-upgrade-pro"
          >
            {t("demo.upgrade_button")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            data-testid="button-dismiss-demo-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
