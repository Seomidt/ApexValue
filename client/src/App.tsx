import { useState, createContext, useContext, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogIn, Zap } from "lucide-react";
import { LanguageContext, setLanguage as setI18nLanguage, getLanguage, t as i18nT, type SupportedLanguage } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AuctionFinder from "@/pages/auction-finder";
import VehicleDetail from "@/pages/vehicle-detail";
import Pipeline from "@/pages/pipeline";
import VatTax from "@/pages/vat-tax";
import CostTemplates from "@/pages/cost-templates";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Compare from "@/pages/compare";
import Admin from "@/pages/admin";

type AppMode = "demo" | "live";
const ModeContext = createContext<{ mode: AppMode; setMode: (m: AppMode) => void }>({ mode: "demo", setMode: () => {} });
export const useAppMode = () => useContext(ModeContext);

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auction-finder" component={AuctionFinder} />
      <Route path="/vehicle/:id" component={VehicleDetail} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/vat-tax" component={VatTax} />
      <Route path="/cost-templates" component={CostTemplates} />
      <Route path="/reports" component={Reports} />
      <Route path="/compare" component={Compare} />
      <Route path="/admin" component={Admin} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ModeToggle() {
  const { mode, setMode } = useAppMode();
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border bg-card p-0.5" data-testid="toggle-mode">
        <button
          className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${mode === "demo" ? "bg-[#FF6319] text-white" : "text-muted-foreground"}`}
          onClick={() => setMode("demo")}
          data-testid="button-mode-demo"
        >
          Demo
        </button>
        <button
          className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${mode === "live" ? "bg-emerald-500 text-white" : "text-muted-foreground"}`}
          onClick={() => {
            if (!user) {
              window.location.href = "/api/login";
              return;
            }
            setMode("live");
          }}
          data-testid="button-mode-live"
        >
          <Zap className="w-3 h-3 inline mr-0.5" />
          Live
        </button>
      </div>
      {mode === "live" && (
        <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
          Tilsluttet
        </Badge>
      )}
    </div>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b bg-card/30 sticky top-0 z-[999]">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              {!user && (
                <a href="/api/login">
                  <Button size="sm" variant="outline" data-testid="button-header-login">
                    <LogIn className="w-3.5 h-3.5 mr-1" /> Log Ind
                  </Button>
                </a>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (location === "/landing") {
    return <Landing />;
  }

  return <MainLayout />;
}

function App() {
  const [mode, setMode] = useState<AppMode>("demo");
  const [language, setLanguageState] = useState<SupportedLanguage>(getLanguage());

  const handleSetLanguage = useCallback((lang: SupportedLanguage) => {
    setI18nLanguage(lang);
    setLanguageState(lang);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: i18nT }}>
            <ModeContext.Provider value={{ mode, setMode }}>
              <Toaster />
              <AppContent />
            </ModeContext.Provider>
          </LanguageContext.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
