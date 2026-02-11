import { useState } from "react";
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
import { Settings as SettingsIcon, User, Building2, Users, Key, HardDrive, Globe, Shield, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Zap, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MARKET_COUNTRIES } from "@shared/schema";

const CONNECTORS = [
  { name: "mobile.de API", desc: "Markedssammenligninger og bilsøgning fra Tysklands største markedsplads", key: "MOBILE_DE", category: "market" },
  { name: "AutoScout24 API", desc: "Pan-europæiske bilannoncering og markedsdata", key: "AUTOSCOUT24", category: "market" },
  { name: "BCA Auctions", desc: "Europæisk engros-auktionsplatform", key: "BCA", category: "auction" },
  { name: "Auto1 / wkda", desc: "Europæisk bilindkøb og remarketing", key: "AUTO1", category: "auction" },
  { name: "ASG Digital", desc: "Registreringsafgift beregning (SKAT integration)", key: "ASG", category: "tax" },
  { name: "DMR API", desc: "Motorregistret - biloplysninger", key: "DMR", category: "tax" },
  { name: "Bilinfo", desc: "Annoncedistribution til dansk marked (bilbasen.dk)", key: "BILINFO", category: "listing" },
  { name: "Cloudflare R2", desc: "Objekt-lagring til billeder og dokumenter", key: "R2", category: "storage" },
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
  const isDemo = mode === "demo";

  return (
    <div className="p-3 rounded-md border space-y-2" data-testid={`connector-${connector.key}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{connector.name}</p>
          <p className="text-xs text-muted-foreground">{connector.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConfigured ? (
            <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Tilsluttet
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <XCircle className="w-3 h-3 mr-1" /> Ikke konfigureret
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
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Tester...</>
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1" /> Test Forbindelse</>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfigure(connector.key)}
            data-testid={`button-configure-${connector.key}`}
          >
            Konfigurér
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

  const connector = CONNECTORS.find(c => c.key === connectorKey);

  const handleTest = async () => {
    if (!apiKey) {
      toast({ title: "Manglende nøgle", description: "Indtast en API-nøgle først.", variant: "destructive" });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/connectors/test", { connectorKey, apiKey, apiSecret });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Netværksfejl — kunne ikke kontakte serveren." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Key className="w-4 h-4" /> Konfigurér {connector?.name}
        </h4>
        <Button size="sm" variant="ghost" onClick={onClose} data-testid="button-cancel-dialog">Annullér</Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">API Nøgle</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Indtast API nøgle..."
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
          <Label className="text-xs">API Hemmelighed (valgfrit)</Label>
          <Input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Indtast API hemmelighed..."
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
        <span>Nøgler gemmes lokalt i denne session. Aktivér Live Mode for permanent lagring.</span>
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
            <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Tester...</>
          ) : (
            <><Zap className="w-3.5 h-3.5 mr-1" /> Test Forbindelse</>
          )}
        </Button>
        <Button
          size="sm"
          disabled={!apiKey}
          onClick={() => {
            onSave(connectorKey, apiKey, apiSecret);
            toast({ title: "API Nøgle gemt", description: `${connector?.name} legitimationsoplysninger er gemt.` });
            onClose();
          }}
          data-testid={`button-save-key-${connectorKey}`}
        >
          Gem Legitimationsoplysninger
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} data-testid="button-cancel-save">Annullér</Button>
      </div>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { mode } = useAppMode();
  const { toast } = useToast();
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());
  const [savedCredentials, setSavedCredentials] = useState<Record<string, { apiKey: string; apiSecret: string }>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());

  const handleSaveKey = (key: string, apiKey: string, apiSecret: string) => {
    setConfiguredKeys(prev => { const next = new Set(Array.from(prev)); next.add(key); return next; });
    setSavedCredentials(prev => ({ ...prev, [key]: { apiKey, apiSecret } }));
    setTestResults(prev => ({ ...prev, [key]: null }));
  };

  const handleTestFromCard = async (connectorKey: string) => {
    const creds = savedCredentials[connectorKey];
    if (!creds?.apiKey) {
      toast({ title: "Ingen nøgle gemt", description: "Konfigurér API-nøglen først.", variant: "destructive" });
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
      setTestResults(prev => ({ ...prev, [connectorKey]: { success: false, message: "Netværksfejl — kunne ikke kontakte serveren." } }));
    } finally {
      setTestingKeys(prev => { const next = new Set(prev); next.delete(connectorKey); return next; });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <SettingsIcon className="w-5 h-5" /> Indstillinger
        </h1>
        <p className="text-sm text-muted-foreground">Administrer din profil, organisation og integrationer</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="w-3.5 h-3.5 mr-1" /> Profil
          </TabsTrigger>
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="w-3.5 h-3.5 mr-1" /> Organisation
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Key className="w-3.5 h-3.5 mr-1" /> Integrationer
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">
            <HardDrive className="w-3.5 h-3.5 mr-1" /> Lagring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Profil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Navn</Label>
                <Input value={user?.firstName || ""} readOnly data-testid="input-profile-name" />
              </div>
              <div>
                <Label className="text-xs">E-mail</Label>
                <Input value={user?.email || ""} readOnly data-testid="input-profile-email" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Rolle</Label>
              <div className="mt-1">
                <Badge variant="secondary">Demo Bruger</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Organisation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Organisationsnavn</Label>
                <Input value="Demo Organisation" readOnly data-testid="input-org-name" />
              </div>
              <div>
                <Label className="text-xs">Plan</Label>
                <div className="mt-1">
                  <Badge className="bg-primary/15 text-primary no-default-hover-elevate no-default-active-elevate">Gratis (Demo)</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Markedsland</Label>
                <Select defaultValue="DK">
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
                <Label className="text-xs">Sprog</Label>
                <Select defaultValue="da">
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="da">Dansk</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Teammedlemmer
              </h4>
              <p className="text-xs text-muted-foreground">
                Teamstyring er tilgængelig på Pro og Team planer. Opgrader for at invitere teammedlemmer.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">API Integrationer (BYOK)</h3>
              <Badge variant="outline" className={`text-xs ${mode === "live" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : ""}`}>
                {mode === "demo" ? "Demo Mode" : "Live Mode"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Bring Your Own Keys (BYOK): Indtast dine API-legitimationsoplysninger for at aktivere live data.
              Test forbindelsen inden du gemmer for at sikre, at dine nøgler virker korrekt.
            </p>
            <Separator />

            {configuring && (
              <APIKeyDialog connectorKey={configuring} onClose={() => setConfiguring(null)} onSave={handleSaveKey} />
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Markedsdata</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "market").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auktionsplatforme</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "auction").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skat & Registrering</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "tax").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Annoncering & Distribution</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "listing").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lagring</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "storage").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} testResult={testResults[c.key] || null} isTesting={testingKeys.has(c.key)} onTest={handleTestFromCard} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Opgrader til Pro eller Team plan for at aktivere Live Mode med dine egne API-nøgler.</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Lagringsforbrug</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Lagring Brugt</span>
                  <span className="font-semibold">0 MB / 500 MB</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Billeder</p>
                  <p className="font-semibold">0 filer</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dokumenter</p>
                  <p className="font-semibold">0 filer</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rapporter</p>
                  <p className="font-semibold">0 PDF'er</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
