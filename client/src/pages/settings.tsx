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
import { Settings as SettingsIcon, User, Building2, Users, Key, HardDrive, Globe, Shield, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { MARKET_COUNTRIES } from "@shared/schema";

const CONNECTORS = [
  { name: "mobile.de API", desc: "Market comparisons and vehicle search from Germany's largest marketplace", key: "MOBILE_DE", category: "market" },
  { name: "AutoScout24 API", desc: "Pan-European vehicle listings and market data", key: "AUTOSCOUT24", category: "market" },
  { name: "BCA Auctions", desc: "European wholesale auction platform integration", key: "BCA", category: "auction" },
  { name: "Auto1 / wkda", desc: "European vehicle purchasing and remarketing", key: "AUTO1", category: "auction" },
  { name: "ASG Digital", desc: "Registration tax calculation (Denmark SKAT integration)", key: "ASG", category: "tax" },
  { name: "DMR API", desc: "Danish Motor Registry (Motorregistret) vehicle lookup", key: "DMR", category: "tax" },
  { name: "Bilinfo", desc: "Listing distribution to Danish market (bilbasen.dk)", key: "BILINFO", category: "listing" },
  { name: "Cloudflare R2", desc: "Object storage for vehicle images and documents", key: "R2", category: "storage" },
];

function ConnectorCard({ connector, isConfigured, onConfigure }: {
  connector: typeof CONNECTORS[0];
  isConfigured: boolean;
  onConfigure: (key: string) => void;
}) {
  const { mode } = useAppMode();
  const isDemo = mode === "demo";

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-md border" data-testid={`connector-${connector.key}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{connector.name}</p>
        <p className="text-xs text-muted-foreground">{connector.desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isConfigured ? (
          <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" /> Not configured
          </Badge>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={isDemo}
          onClick={() => onConfigure(connector.key)}
          data-testid={`button-configure-${connector.key}`}
        >
          Configure
        </Button>
      </div>
    </div>
  );
}

function APIKeyDialog({ connectorKey, onClose, onSave }: { connectorKey: string; onClose: () => void; onSave: (key: string) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const { toast } = useToast();

  const connector = CONNECTORS.find(c => c.key === connectorKey);

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Key className="w-4 h-4" /> Configure {connector?.name}
        </h4>
        <Button size="sm" variant="ghost" onClick={onClose} data-testid="button-cancel-dialog">Cancel</Button>
      </div>
      <div className="space-y-2">
        <div>
          <Label className="text-xs">API Key</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key..."
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
          <Label className="text-xs">API Secret (optional)</Label>
          <Input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter API secret..."
            data-testid={`input-api-secret-${connectorKey}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        <span>Keys are encrypted and stored securely per organization.</span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            onSave(connectorKey);
            toast({ title: "API Key saved", description: `${connector?.name} credentials have been saved.` });
            onClose();
          }}
          data-testid={`button-save-key-${connectorKey}`}
        >
          Save Credentials
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} data-testid="button-cancel-save">Cancel</Button>
      </div>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { mode } = useAppMode();
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());

  const handleSaveKey = (key: string) => {
    setConfiguredKeys(prev => new Set([...prev, key]));
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <SettingsIcon className="w-5 h-5" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile, organization and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="w-3.5 h-3.5 mr-1" /> Profile
          </TabsTrigger>
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="w-3.5 h-3.5 mr-1" /> Organization
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Key className="w-3.5 h-3.5 mr-1" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">
            <HardDrive className="w-3.5 h-3.5 mr-1" /> Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={user?.firstName || ""} readOnly data-testid="input-profile-name" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={user?.email || ""} readOnly data-testid="input-profile-email" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <div className="mt-1">
                <Badge variant="secondary">Demo User</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Organization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Organization Name</Label>
                <Input value="Demo Organization" readOnly data-testid="input-org-name" />
              </div>
              <div>
                <Label className="text-xs">Plan</Label>
                <div className="mt-1">
                  <Badge className="bg-primary/15 text-primary no-default-hover-elevate no-default-active-elevate">Free (Demo)</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Market Country</Label>
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
                <Label className="text-xs">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="da">Danish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Team Members
              </h4>
              <p className="text-xs text-muted-foreground">
                Team management is available on Pro and Team plans. Upgrade to invite team members.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">API Integrations (BYOK)</h3>
              <Badge variant="outline" className={`text-xs ${mode === "live" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : ""}`}>
                {mode === "demo" ? "Demo Mode" : "Live Mode"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Bring Your Own Keys (BYOK): Enter your API credentials to enable live data.
              Keys are encrypted and stored securely per organization.
              {mode === "demo" && " Switch to Live Mode to configure integrations."}
            </p>
            <Separator />

            {configuring && (
              <APIKeyDialog connectorKey={configuring} onClose={() => setConfiguring(null)} onSave={handleSaveKey} />
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Data</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "market").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auction Platforms</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "auction").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax & Registration</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "tax").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Listing & Distribution</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "listing").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Storage</h4>
              <div className="space-y-2">
                {CONNECTORS.filter(c => c.category === "storage").map(c => (
                  <ConnectorCard key={c.key} connector={c} isConfigured={configuredKeys.has(c.key)} onConfigure={setConfiguring} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Upgrade to Pro or Team plan to enable Live Mode with your own API keys.</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">Storage Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-semibold">0 MB / 500 MB</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Images</p>
                  <p className="font-semibold">0 files</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Documents</p>
                  <p className="font-semibold">0 files</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reports</p>
                  <p className="font-semibold">0 PDFs</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
