import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useAppMode } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, User, Building2, Users, Key, Globe, Shield, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Zap, AlertTriangle, Save, CreditCard, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MARKET_COUNTRIES } from "@shared/schema";
import { useLanguage, LANGUAGE_LABELS, type SupportedLanguage } from "@/lib/i18n";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CATEGORY_MAP: Record<string, string> = {
  market: "settings.category_market",
  auction: "settings.category_auction",
  tax: "settings.category_tax",
  listing: "settings.category_listing",
};

const CONNECTORS = [
  { name: "mobile.de API", descKey: "settings.connector_mobile_desc", key: "MOBILE_DE", category: "market" },
  { name: "AutoScout24 API", descKey: "settings.connector_autoscout_desc", key: "AUTOSCOUT24", category: "market" },
  { name: "BCA Auctions", descKey: "settings.connector_bca_desc", key: "BCA", category: "auction" },
  { name: "Auto1 / wkda", descKey: "settings.connector_auto1_desc", key: "AUTO1", category: "auction" },
  { name: "ASG Digital", descKey: "settings.connector_asg_desc", key: "ASG", category: "tax" },
  { name: "DMR API", descKey: "settings.connector_dmr_desc", key: "DMR", category: "tax" },
  { name: "Bilinfo", descKey: "settings.connector_bilinfo_desc", key: "BILINFO", category: "listing" },
];

type TestResult = { success: boolean; message: string; status?: number } | null;

function ConnectorCard({ connector, isConfigured, onConfigure, testResult, isTesting, onTest }: {
  connector: typeof CONNECTORS[0];
  isConfigured: boolean;
  onConfigure: (key: string) => void;
  testResult: TestResult;
  isTesting: boolean;
  onTest: (key: string) => void;
}) {
  const { mode } = useAppMode();
  const { t } = useLanguage();
  const isDemo = mode === "demo";

  return (
    <div className="p-3 rounded-md border space-y-2" data-testid={`connector-${connector.key}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{connector.name}</p>
            <Badge variant="secondary" className="text-[10px]" data-testid={`badge-category-${connector.key}`}>
              {t(CATEGORY_MAP[connector.category])}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t(connector.descKey)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConfigured ? (
            <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" /> {t("settings.connected")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <XCircle className="w-3 h-3 mr-1" /> {t("settings.not_configured")}
            </Badge>
          )}
          {isConfigured && (
            <Button
              size="sm"
              variant="outline"
              disabled={isTesting}
              onClick={() => onTest(connector.key)}
              data-testid={`button-test-${connector.key}`}
            >
              {isTesting ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t("settings.testing")}</>
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1" /> {t("settings.test_connection")}</>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfigure(connector.key)}
            data-testid={`button-configure-${connector.key}`}
          >
            {t("common.configure")}
          </Button>
        </div>
      </div>
      {testResult && (
        <div className={`flex items-start gap-2 text-xs p-2 rounded-md ${
          testResult.success
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-red-500/10 text-red-700 dark:text-red-400"
        }`} data-testid={`test-result-${connector.key}`}>
          {testResult.success ? (
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}

function APIKeyDialog({ connectorKey, onClose, onSave }: { connectorKey: string; onClose: () => void; onSave: (key: string, apiKey: string, apiSecret: string) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const connector = CONNECTORS.find(c => c.key === connectorKey);

  const handleTest = async () => {
    if (!apiKey) {
      toast({ title: t("settings.missing_key"), description: t("settings.enter_key_first"), variant: "destructive" });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/connectors/test", { connectorKey, apiKey, apiSecret });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: t("settings.network_error") });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Key className="w-4 h-4" /> {t("common.configure")} {connector?.name}
        </h4>
        <Button size="sm" variant="ghost" onClick={onClose} data-testid="button-cancel-dialog">{t("common.cancel")}</Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">{t("settings.api_key")}</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("settings.enter_key")}
              data-testid={`input-api-key-${connectorKey}`}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setShowKey(!showKey)}
              data-testid="button-toggle-key-visibility"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">{t("settings.api_secret")}</Label>
          <Input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder={t("settings.enter_secret")}
            data-testid={`input-api-secret-${connectorKey}`}
          />
        </div>
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 text-xs p-2 rounded-md ${
          testResult.success
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-red-500/10 text-red-700 dark:text-red-400"
        }`} data-testid={`test-result-dialog-${connectorKey}`}>
          {testResult.success ? (
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        <span>{t("settings.keys_local")}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={isTesting || !apiKey}
          onClick={handleTest}
          data-testid={`button-test-dialog-${connectorKey}`}
        >
          {isTesting ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t("settings.testing")}</>
          ) : (
            <><Zap className="w-3.5 h-3.5 mr-1" /> {t("settings.test_connection")}</>
          )}
        </Button>
        <Button
          size="sm"
          disabled={!apiKey}
          onClick={() => {
            onSave(connectorKey, apiKey, apiSecret);
            toast({ title: t("settings.key_saved"), description: t("settings.key_saved_desc").replace("{name}", connector?.name || "") });
            onClose();
          }}
          data-testid={`button-save-key-${connectorKey}`}
        >
          {t("settings.save_credentials")}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} data-testid="button-cancel-save">{t("common.cancel")}</Button>
      </div>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { mode } = useAppMode();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());
  const [savedCredentials, setSavedCredentials] = useState<Record<string, { apiKey: string; apiSecret: string }>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());

  const { language: currentLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const savedMarket = localStorage.getItem("apexvalue_market") || "DK";
  const [marketCountry, setMarketCountry] = useState(savedMarket);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const [orgDirty, setOrgDirty] = useState(false);

  const [companyName, setCompanyName] = useState(() => localStorage.getItem("apexvalue_org_name") || "");
  const [cvrVatId, setCvrVatId] = useState(() => localStorage.getItem("apexvalue_cvr") || "");
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem("apexvalue_address") || "");

  const handleSaveOrgSettings = () => {
    localStorage.setItem("apexvalue_market", marketCountry);
    localStorage.setItem("apexvalue_org_name", companyName);
    localStorage.setItem("apexvalue_cvr", cvrVatId);
    localStorage.setItem("apexvalue_address", companyAddress);
    setGlobalLanguage(selectedLanguage as SupportedLanguage);
    setOrgDirty(false);
    toast({ title: t("settings.saved"), description: t("settings.saved_desc") });
  };

  const handleSaveKey = (key: string, apiKey: string, apiSecret: string) => {
    setConfiguredKeys(prev => { const next = new Set(Array.from(prev)); next.add(key); return next; });
    setSavedCredentials(prev => ({ ...prev, [key]: { apiKey, apiSecret } }));
    setTestResults(prev => ({ ...prev, [key]: null }));
  };

  const handleTestFromCard = async (connectorKey: string) => {
    const creds = savedCredentials[connectorKey];
    if (!creds?.apiKey) {
      toast({ title: t("settings.no_key"), description: t("settings.configure_first"), variant: "destructive" });
      return;
    }
    setTestingKeys(prev => { const next = new Set(Array.from(prev)); next.add(connectorKey); return next; });
    setTestResults(prev => ({ ...prev, [connectorKey]: null }));
    try {
      const res = await apiRequest("POST", "/api/connectors/test", {
        connectorKey,
        apiKey: creds.apiKey,
        apiSecret: creds.apiSecret,
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [connectorKey]: data }));
    } catch {
      setTestResults(prev => ({ ...prev, [connectorKey]: { success: false, message: t("settings.network_error") } }));
    } finally {
      setTestingKeys(prev => { const next = new Set(prev); next.delete(connectorKey); return next; });
    }
  };

  const userInitials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map(n => n?.charAt(0).toUpperCase())
    .join("") || "U";

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "";

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <SettingsIcon className="w-5 h-5" /> {t("settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="w-3.5 h-3.5 mr-1" /> {t("settings.tab_profile")}
          </TabsTrigger>
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="w-3.5 h-3.5 mr-1" /> {t("settings.tab_organization")}
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Key className="w-3.5 h-3.5 mr-1" /> {t("settings.tab_integrations")}
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            <CreditCard className="w-3.5 h-3.5 mr-1" /> {t("settings.tab_billing")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">{t("settings.profile")}</h3>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16" data-testid="img-avatar">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="text-profile-name">{fullName || t("settings.demo_user")}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email || ""}</p>
                <Badge variant="secondary" className="mt-1">{t("settings.demo_user")}</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("common.name")}</Label>
                <Input value={fullName} readOnly data-testid="input-profile-name" />
              </div>
              <div>
                <Label className="text-xs">{t("common.email")}</Label>
                <Input value={user?.email || ""} readOnly data-testid="input-profile-email" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("settings.language")}</Label>
                <Select value={selectedLanguage} onValueChange={(v) => { setSelectedLanguage(v); setOrgDirty(true); }}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("settings.market_country")}</Label>
                <Select value={marketCountry} onValueChange={(v) => { setMarketCountry(v); setOrgDirty(true); }}>
                  <SelectTrigger data-testid="select-market-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveOrgSettings} disabled={!orgDirty} data-testid="button-save-profile-settings">
                <Save className="w-3.5 h-3.5 mr-1.5" /> {t("settings.save_settings")}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">{t("settings.tab_organization")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("settings.company_name")}</Label>
                <Input
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setOrgDirty(true); }}
                  placeholder={t("settings.company_name")}
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label className="text-xs">{t("settings.cvr_vat_id")}</Label>
                <Input
                  value={cvrVatId}
                  onChange={(e) => { setCvrVatId(e.target.value); setOrgDirty(true); }}
                  placeholder={t("settings.cvr_vat_id")}
                  data-testid="input-cvr-vat"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("settings.company_address")}</Label>
              <Input
                value={companyAddress}
                onChange={(e) => { setCompanyAddress(e.target.value); setOrgDirty(true); }}
                placeholder={t("settings.company_address")}
                data-testid="input-company-address"
              />
            </div>
            <div>
              <Label className="text-xs">{t("settings.plan")}</Label>
              <div className="mt-1">
                <Badge className="bg-primary/15 text-primary no-default-hover-elevate no-default-active-elevate">{t("settings.free_demo")}</Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md border">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t("settings.logo_hint")}</span>
            </div>
            <Separator />
            <div>
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> {t("settings.team_members")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("settings.team_hint")}
              </p>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSaveOrgSettings} disabled={!orgDirty} data-testid="button-save-org-settings">
                <Save className="w-3.5 h-3.5 mr-1.5" /> {t("settings.save_settings")}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t("settings.api_integrations")}</h3>
              <Badge variant="outline" className={`text-xs ${mode === "live" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : ""}`}>
                {mode === "demo" ? `${t("mode.demo")} Mode` : `${t("mode.live")} Mode`}
              </Badge>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md border bg-[#B9D9EB]/10 dark:bg-[#002776]/10" data-testid="banner-byok">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#002776] dark:text-[#B9D9EB]" />
              <p className="text-xs text-muted-foreground">
                {t("settings.byok_banner")}
              </p>
            </div>

            <Separator />

            {configuring && (
              <APIKeyDialog connectorKey={configuring} onClose={() => setConfiguring(null)} onSave={handleSaveKey} />
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.market_data")}</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "market").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.auction_platforms")}</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "auction").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.tax_reg")}</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "tax").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("settings.listing_dist")}</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "listing").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>{t("settings.upgrade_hint")}</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> {t("billing.title")}
              </h3>
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/15 text-primary no-default-hover-elevate no-default-active-elevate" data-testid="badge-current-plan">
                  {t("billing.current_plan")}: {t("billing.free_plan")}
                </Badge>
                <span className="text-xs text-muted-foreground" data-testid="text-plan-desc">{t("billing.free_desc")}</span>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 space-y-3 border-2" data-testid="card-plan-free">
                <div>
                  <h4 className="text-sm font-semibold">{t("billing.free_plan")}</h4>
                  <p className="text-2xl font-bold mt-1">
                    &euro;0<span className="text-sm font-normal text-muted-foreground">{t("billing.per_month")}</span>
                  </p>
                </div>
                <Separator />
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    {t("billing.features_free")}
                  </li>
                  <li className="flex items-start gap-2">
                    <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {t("billing.users_1")}
                  </li>
                </ul>
                <Button variant="outline" disabled className="w-full" data-testid="button-current-plan">
                  {t("billing.current_plan")}
                </Button>
              </Card>

              <Card className="p-4 space-y-3 border-2 border-[#FF6319]" data-testid="card-plan-pro">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{t("billing.pro_plan")}</h4>
                    <Badge className="bg-[#FF6319] text-white no-default-hover-elevate no-default-active-elevate text-[10px]">Popular</Badge>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    &euro;299<span className="text-sm font-normal text-muted-foreground">{t("billing.per_month")}</span>
                  </p>
                </div>
                <Separator />
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    {t("billing.features_pro")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {t("billing.users_3")}
                  </li>
                </ul>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full inline-block">
                      <Button className="w-full bg-[#FF6319] text-white border-[#FF6319]" disabled data-testid="button-upgrade-pro">
                        {t("billing.upgrade")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("billing.coming_soon")}</p>
                  </TooltipContent>
                </Tooltip>
              </Card>

              <Card className="p-4 space-y-3 border-2 border-[#002776]" data-testid="card-plan-team">
                <div>
                  <h4 className="text-sm font-semibold">{t("billing.team_plan")}</h4>
                  <p className="text-2xl font-bold mt-1">
                    &euro;799<span className="text-sm font-normal text-muted-foreground">{t("billing.per_month")}</span>
                  </p>
                </div>
                <Separator />
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    {t("billing.features_team")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    {t("billing.users_10")}
                  </li>
                </ul>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full inline-block">
                      <Button variant="outline" className="w-full border-[#002776] text-[#002776] dark:text-[#B9D9EB] dark:border-[#B9D9EB]" disabled data-testid="button-upgrade-team">
                        {t("billing.upgrade")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("billing.coming_soon")}</p>
                  </TooltipContent>
                </Tooltip>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
