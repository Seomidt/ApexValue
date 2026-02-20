import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Search, GitBranch, Receipt, FileText,
  TrendingUp, Target, Globe, ArrowRight, Zap, Play, LogIn
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import logoPath from "@assets/image_1770840196054.png";

const features = [
  { icon: Search, titleKey: "landing.feature_auction_title", descKey: "landing.feature_auction_desc" },
  { icon: BarChart3, titleKey: "landing.feature_market_title", descKey: "landing.feature_market_desc" },
  { icon: Target, titleKey: "landing.feature_maxbid_title", descKey: "landing.feature_maxbid_desc" },
  { icon: Receipt, titleKey: "landing.feature_vat_title", descKey: "landing.feature_vat_desc" },
  { icon: GitBranch, titleKey: "landing.feature_pipeline_title", descKey: "landing.feature_pipeline_desc" },
  { icon: FileText, titleKey: "landing.feature_reports_title", descKey: "landing.feature_reports_desc" },
];

const markets = [
  { code: "DE", nameKey: "landing.market_de" },
  { code: "DK", nameKey: "landing.market_dk" },
  { code: "NL", nameKey: "landing.market_nl" },
  { code: "SE", nameKey: "landing.market_se" },
  { code: "NO", nameKey: "landing.market_no" },
  { code: "PL", nameKey: "landing.market_pl" },
  { code: "BE", nameKey: "landing.market_be" },
  { code: "FR", nameKey: "landing.market_fr" },
];

export default function Landing() {
  const { t } = useLanguage();

  const loginUrl = "/api/login";
  const demoUrl = "/app";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#002776] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="ApexValue" className="h-10 w-auto" />
            <span className="text-white font-bold text-lg tracking-tight hidden sm:inline">ApexValue</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={demoUrl}>
              <Button variant="ghost" size="sm" className="text-[#B9D9EB] border-[#B9D9EB]/20" data-testid="button-try-demo">
                <Play className="w-3.5 h-3.5 mr-1" /> {t("landing.try_demo")}
              </Button>
            </a>
            <a href={loginUrl}>
              <Button size="sm" className="bg-[#FF6319] text-white border-[#FF6319]" data-testid="button-login">
                <LogIn className="w-3.5 h-3.5 mr-1" /> {t("landing.login")}
              </Button>
            </a>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#002776]/95 via-[#002776]/80 to-[#001a4d]/95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgc3Ryb2tlPSJyZ2JhKDE4NSwyMTcsMjM1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="mb-4 border-[#B9D9EB]/30 text-[#B9D9EB] bg-[#B9D9EB]/10 no-default-hover-elevate no-default-active-elevate">
            <Zap className="w-3 h-3 mr-1" /> {t("landing.badge_text")}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            {t("landing.hero_title1")}
            <br />
            <span className="text-[#FF6319]">{t("landing.hero_title2")}</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#B9D9EB]/80 max-w-2xl mx-auto">
            {t("landing.hero_subtitle")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <a href={demoUrl}>
              <Button size="lg" className="font-semibold bg-[#FF6319] text-white border-[#FF6319]" data-testid="button-hero-cta">
                <Play className="w-4 h-4 mr-1" /> {t("landing.try_demo_now")}
              </Button>
            </a>
            <a href={loginUrl}>
              <Button size="lg" variant="outline" className="font-semibold border-[#B9D9EB]/40 text-[#B9D9EB] backdrop-blur-sm bg-white/5" data-testid="button-hero-login">
                <LogIn className="w-4 h-4 mr-1" /> {t("landing.login")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            {markets.map((m) => (
              <span key={m.code} className="text-xs text-[#B9D9EB]/60">{t(m.nameKey)}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">{t("landing.features_title")}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t("landing.features_subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.titleKey} className="p-5" data-testid={`card-feature-${feature.titleKey.split('.').pop()}`}>
              <div className="p-2 rounded-md bg-[#B9D9EB]/15 w-fit mb-3">
                <feature.icon className="w-5 h-5 text-[#002776] dark:text-[#B9D9EB]" />
              </div>
              <h3 className="font-semibold text-sm">{t(feature.titleKey)}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t(feature.descKey)}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="bg-[#002776]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-[#FF6319]">8</p>
              <p className="text-xs text-[#B9D9EB]/70 mt-1">{t("landing.stat_markets")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100+</p>
              <p className="text-xs text-[#B9D9EB]/70 mt-1">{t("landing.stat_factors")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">3</p>
              <p className="text-xs text-[#B9D9EB]/70 mt-1">{t("landing.stat_scenarios")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">PDF</p>
              <p className="text-xs text-[#B9D9EB]/70 mt-1">{t("landing.stat_reports")}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">{t("landing.cta_title")}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {t("landing.cta_subtitle")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <a href={demoUrl}>
            <Button size="lg" className="font-semibold bg-[#FF6319] text-white border-[#FF6319]" data-testid="button-bottom-cta">
              {t("landing.try_demo_now")} <Play className="w-4 h-4 ml-1" />
            </Button>
          </a>
          <a href={loginUrl}>
            <Button size="lg" variant="outline" className="font-semibold" data-testid="button-bottom-login">
              <LogIn className="w-4 h-4 mr-1" /> {t("landing.login")}
            </Button>
          </a>
        </div>
      </section>
      <footer className="border-t bg-[#002776]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap text-xs text-[#B9D9EB]/60">
          <div className="flex items-center gap-3">
            <img src={logoPath} alt="ApexValue" className="h-7 w-auto" />
            <span className="text-[#B9D9EB] font-bold text-sm">ApexValue</span>
          </div>
          <p className="text-[#B9D9EB]/40">&copy; {new Date().getFullYear()} ApexValue. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
