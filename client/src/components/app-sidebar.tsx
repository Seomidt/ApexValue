import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Search, GitBranch, Receipt, Layers, Settings,
  FileText, LogOut, Sun, Moon, GitCompareArrows, Shield, Calculator
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarFooter, SidebarHeader
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoPath from "@assets/image_1770840196054.png";

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { title: t("nav.dashboard"), url: "/app", icon: LayoutDashboard },
    { title: t("nav.auction_finder"), url: "/app/auction-finder", icon: Search },
    { title: t("nav.pipeline"), url: "/app/pipeline", icon: GitBranch },
    { title: t("nav.compare"), url: "/app/compare", icon: GitCompareArrows },
    { title: t("nav.vat_tax"), url: "/app/vat-tax", icon: Receipt },
    { title: t("nav.vat_calculator"), url: "/app/vat/calculator", icon: Calculator },
    { title: t("nav.cost_templates"), url: "/app/cost-templates", icon: Layers },
    { title: t("nav.reports"), url: "/app/reports", icon: FileText },
  ];

  const settingsItem = { title: t("nav.settings"), url: "/app/settings", icon: Settings };
  const adminItem = { title: t("nav.admin"), url: "/app/admin", icon: Shield };

  const isActive = (url: string) => {
    if (url === "/app") return location === "/app";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/app" data-testid="link-logo">
          <div className="flex items-center gap-2">
            <img src={logoPath} alt="ApexValue" className="h-10 w-auto" />
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs" data-testid="badge-mode">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-chart-3 mr-1.5" />
            {t("mode.demo")}
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild data-active={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.url.replace(/\//g, '') || 'dashboard'}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.system")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-active={isActive(adminItem.url)}>
                    <Link href={adminItem.url} data-testid="link-nav-admin">
                      <adminItem.icon className="w-4 h-4" />
                      <span>{adminItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={isActive(settingsItem.url)}>
                  <Link href={settingsItem.url} data-testid="link-nav-settings">
                    <settingsItem.icon className="w-4 h-4" />
                    <span>{settingsItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {user && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-2 px-1">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">
                {(user.firstName || user.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" data-testid="text-username">
                {user.firstName || user.email || t("common.user")}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
