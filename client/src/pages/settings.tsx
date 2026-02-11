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
import { Settings as SettingsIcon, User, Building2, Users, Key, Globe, Shield, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Zap, AlertTriangle, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MARKET_COUNTRIES } from "@shared/schema";
import { useLanguage, LANGUAGE_LABELS, type SupportedLanguage } from "@/lib/i18n";

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
          <p className="text-sm font-medium">{connector.name}</p>
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

  const handleSaveOrgSettings = () => {
    localStorage.setItem("apexvalue_market", marketCountry);
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
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">{t("settings.profile")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("common.name")}</Label>
                <Input value={user?.firstName || ""} readOnly data-testid="input-profile-name" />
              </div>
              <div>
                <Label className="text-xs">{t("common.email")}</Label>
                <Input value={user?.email || ""} readOnly data-testid="input-profile-email" />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("common.role")}</Label>
              <div className="mt-1">
                <Badge variant="secondary">{t("settings.demo_user")}</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">{t("settings.tab_organization")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("settings.org_name")}</Label>
                <Input value="Demo Organisation" readOnly data-testid="input-org-name" />
              </div>
              <div>
                <Label className="text-xs">{t("settings.plan")}</Label>
                <div className="mt-1">
                  <Badge className="bg-primary/15 text-primary no-default-hover-elevate no-default-active-elevate">{t("settings.free_demo")}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("settings.market_country")}</Label>
                <Select value={marketCountry} onValueChange={(v) => { setMarketCountry(v); setOrgDirty(true); }}>
                  <SelectTrigger data-testid="select-market-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <p className="text-xs text-muted-foreground">
              {t("settings.byok_desc")}
            </p>
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

      </Tabs>
    </div>
  );
}
