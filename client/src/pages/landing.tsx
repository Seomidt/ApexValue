import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Search, GitBranch, Receipt, FileText, Shield,
  TrendingUp, Target, Globe, ArrowRight, Zap, Play
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/image_1770805863097.png";

const features = [
  {
    icon: Search,
    title: "Auction Finder",
    description: "Smart search across auction platforms with instant deal scoring and risk analysis.",
  },
  {
    icon: BarChart3,
    title: "Market Analysis",
    description: "Compare against live market data. Know the true value before you bid.",
  },
  {
    icon: Target,
    title: "MaxBid Calculator",
    description: "AI-powered bid recommendations based on your profit targets and risk tolerance.",
  },
  {
    icon: Receipt,
    title: "VAT & Tax Center",
    description: "Country-specific VAT templates, registration tax calculations, and margin schemes.",
  },
  {
    icon: GitBranch,
    title: "Pipeline Management",
    description: "Track every vehicle from discovery to sale with automated status workflows.",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description: "Professional dealer investment reports with full financial analysis and recommendations.",
  },
];

const markets = [
  { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "BE", name: "Belgium" },
  { code: "FR", name: "France" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <img src={logoPath} alt="ApexValue" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-try-demo">Try Demo</Button>
            </Link>
            <a href="/api/login">
              <Button size="sm" data-testid="button-login">Sign In</Button>
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#002776]/90 via-[#002776]/70 to-[#001a4d]/90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgc3Ryb2tlPSJyZ2JhKDE4NSwyMTcsMjM1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Badge variant="outline" className="mb-4 border-[#B9D9EB]/30 text-[#B9D9EB] bg-[#B9D9EB]/10 no-default-hover-elevate no-default-active-elevate">
            <Zap className="w-3 h-3 mr-1" /> B2B Car Trading Intelligence
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            Know the value.
            <br />
            <span className="text-[#FF6319]">Win the deal.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#B9D9EB]/80 max-w-2xl mx-auto">
            Professional car valuation, market analysis, and deal scoring for importers and dealers
            across 8 European markets. From auction to sale in one cockpit.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/">
              <Button size="lg" className="font-semibold" data-testid="button-hero-cta">
                <Play className="w-4 h-4 mr-1" /> Try Demo Now
              </Button>
            </Link>
            <a href="/api/login">
              <Button size="lg" variant="outline" className="font-semibold border-[#B9D9EB]/30 text-[#B9D9EB] backdrop-blur-sm bg-white/5" data-testid="button-hero-login">
                Sign In <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            {markets.map((m) => (
              <span key={m.code} className="text-xs text-[#B9D9EB]/60">{m.name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">Everything you need for smart car trading</h2>
          <p className="text-sm text-muted-foreground mt-2">From discovery to sale, one platform for your entire workflow</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="p-2 rounded-md bg-primary/10 w-fit mb-3">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card/50 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">8</p>
              <p className="text-xs text-muted-foreground mt-1">European Markets</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100+</p>
              <p className="text-xs text-muted-foreground mt-1">Deal Score Factors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-500">3</p>
              <p className="text-xs text-muted-foreground mt-1">Profit Scenarios</p>
            </div>
            <div>
              <p className="text-3xl font-bold">PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Investment Reports</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Ready to trade smarter?</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Start with a free demo to explore all features. No credit card, no API keys required.
        </p>
        <Link href="/">
          <Button size="lg" className="mt-6 font-semibold" data-testid="button-bottom-cta">
            Try Demo Now <Play className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>

      <footer className="border-t bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground">
          <img src={logoPath} alt="ApexValue" className="h-5 w-auto opacity-50" />
          <p>ApexValue &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
