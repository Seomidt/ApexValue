import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GitBranch,
  Inbox,
  Link2,
  ListChecks,
  MessageSquareText,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaskStatus = "todo" | "doing" | "waiting" | "done";
type Priority = "high" | "medium" | "low";
type AutomationType = "daily" | "alert" | "followup" | "report";

const tasks: Array<{
  title: string;
  owner: string;
  area: string;
  due: string;
  status: TaskStatus;
  priority: Priority;
}> = [
  { title: "Opret GitHub repo og monorepo-struktur", owner: "Kristian", area: "Kodebase", due: "Fase 1", status: "todo", priority: "high" },
  { title: "Azure Resource Group, Key Vault og secrets", owner: "Kristian", area: "Azure", due: "Fase 2", status: "doing", priority: "high" },
  { title: "MySQL dump fra gammel OXEN", owner: "Emil/Rene", area: "Migration", due: "Kritisk før dev", status: "waiting", priority: "high" },
  { title: "Søg adgang til SUS, CHR, FVST og Traces", owner: "NV-Randers", area: "Myndigheder", due: "Start tidligt", status: "todo", priority: "high" },
  { title: "Entra ID app registration og secrets", owner: "Kristian", area: "Auth", due: "Klar", status: "done", priority: "medium" },
];

const automations: Array<{
  title: string;
  description: string;
  cadence: string;
  type: AutomationType;
  active: boolean;
  lastRun: string;
}> = [
  {
    title: "Morgenoverblik",
    description: "Samler Azure-faser, blokerede trin, API-adgange og dagens vigtigste Oxen+ handlinger.",
    cadence: "Hver hverdag 08:00",
    type: "daily",
    active: true,
    lastRun: "I dag 08:00",
  },
  {
    title: "Migration alert",
    description: "Giver besked når datamigration mangler dump, mapping, testvalidering eller delta-plan.",
    cadence: "Når data ændrer sig",
    type: "alert",
    active: true,
    lastRun: "For 18 min siden",
  },
  {
    title: "API-godkendelser",
    description: "Følger op på SUS, CHR, FVST, Traces, Logbog, Linkitall, SmartTID og Business Central.",
    cadence: "Hver 2. time",
    type: "followup",
    active: true,
    lastRun: "For 1 time siden",
  },
  {
    title: "Fredagsrapport",
    description: "Opsummerer fremdrift, åbne risici, næste uges leverancer og go-live-parathed.",
    cadence: "Fredag 15:00",
    type: "report",
    active: false,
    lastRun: "Ikke kørt endnu",
  },
];

const decisions = [
  { title: "Migration er separat kritisk fase", owner: "Kristian", date: "Nu", reason: "Gammel OXEN-data afgør om go-live kan ske uden driftstab." },
  { title: "Myndighedsadgange startes før feature-arbejde", owner: "NV-Randers", date: "Nu", reason: "SUS, CHR, FVST og Traces har lang godkendelsestid." },
  { title: "Key Vault bliver eneste sted for API-nøgler", owner: "Team", date: "Nu", reason: "Projektet har mange eksterne nøgler og Level 1-adgangskrav." },
];

const phases = [
  { name: "Forudsætninger", done: 1, total: 3 },
  { name: "GitHub & kode", done: 0, total: 6 },
  { name: "Azure infrastruktur", done: 0, total: 7 },
  { name: "CI/CD", done: 0, total: 4 },
  { name: "Auth SSO", done: 0, total: 5 },
  { name: "Datamigration", done: 0, total: 10 },
  { name: "Backend API", done: 0, total: 6 },
  { name: "Frontend", done: 0, total: 11 },
  { name: "Integrationer", done: 0, total: 11 },
  { name: "Test & go-live", done: 0, total: 7 },
];

const links = [
  { title: "Pipeline", url: "/app/pipeline", icon: GitBranch },
  { title: "Afgift", url: "/app/vat-tax", icon: ShieldCheck },
  { title: "Rapporter", url: "/app/reports", icon: FileText },
  { title: "Bilfinder", url: "/app/auction-finder", icon: Inbox },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Klar",
  doing: "I gang",
  waiting: "Venter",
  done: "Færdig",
};

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  doing: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  waiting: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const priorityClasses: Record<Priority, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground",
};

const automationIcons: Record<AutomationType, typeof CalendarDays> = {
  daily: CalendarDays,
  alert: Bell,
  followup: TimerReset,
  report: FileText,
};

function StatCard({ label, value, detail, icon: Icon, accent }: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CalendarDays;
  accent?: boolean;
}) {
  return (
    <Card className="p-4" data-testid={`card-os-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-[#FF6319]" : ""}`}>{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function AutomationCard({ automation, enabled, onToggle }: {
  automation: (typeof automations)[number];
  enabled: boolean;
  onToggle: () => void;
}) {
  const Icon = automationIcons[automation.type];

  return (
    <Card className="p-4" data-testid={`card-automation-${automation.title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{automation.title}</h3>
              <Badge variant="outline" className={enabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "text-muted-foreground"}>
                {enabled ? "Aktiv" : "Pause"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{automation.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {automation.cadence}
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                {automation.lastRun}
              </span>
            </div>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Skift ${automation.title}`} />
      </div>
    </Card>
  );
}

function TaskRow({ task }: { task: (typeof tasks)[number] }) {
  return (
    <div className="grid gap-3 border-b px-3 py-3 last:border-b-0 md:grid-cols-[1fr_110px_110px_100px] md:items-center" data-testid={`row-os-task-${task.title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <Badge variant="outline" className={`text-xs ${priorityClasses[task.priority]}`}>
            {task.priority === "high" ? "Høj" : task.priority === "medium" ? "Mellem" : "Lav"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{task.area} / {task.due}</p>
      </div>
      <p className="text-sm text-muted-foreground">{task.owner}</p>
      <Badge variant="outline" className={`w-fit text-xs ${statusClasses[task.status]}`}>
        {statusLabels[task.status]}
      </Badge>
      <Button size="sm" variant="ghost" className="w-fit justify-self-start md:justify-self-end">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function TeamOS() {
  const [enabledMap, setEnabledMap] = useState(() =>
    automations.reduce<Record<string, boolean>>((acc, automation) => {
      acc[automation.title] = automation.active;
      return acc;
    }, {})
  );

  const completion = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "done").length;
    return Math.round((completed / tasks.length) * 100);
  }, []);

  const blockedCount = tasks.filter((task) => task.status === "waiting").length;
  const activeAutomations = Object.values(enabledMap).filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 bg-[#FF6319]/10 text-[#FF6319] border-[#FF6319]/30">
            Team OS
          </Badge>
          <h1 className="flex items-center gap-2 text-xl font-bold" data-testid="text-page-title">
            <Users className="h-5 w-5" />
            Oxen+ Azure kontrolrum
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Projektstyring for Azure-infrastruktur, OXEN-migration, API-godkendelser, frontend, backend og go-live.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" data-testid="button-os-add-note">
            <Plus className="mr-2 h-4 w-4" />
            Ny note
          </Button>
          <Button className="bg-[#FF6319] text-white hover:bg-[#FF6319]/90" data-testid="button-os-run-brief">
            <Play className="mr-2 h-4 w-4" />
            Kør overblik
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projekttrin" value="1/83" detail="82 trin tilbage fra planen" icon={ListChecks} accent />
        <StatCard label="Kritiske blokeringer" value={String(blockedCount)} detail="Migration/API afventer input" icon={AlertTriangle} />
        <StatCard label="API-spor" value="13" detail="Myndigheder, Azure og eksterne" icon={Bot} accent />
        <StatCard label="Fremdrift" value="1%" detail="Ifølge projektplanen" icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4" />
                  Næste kritiske handlinger
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">De ting der bør løses før feature-arbejdet får fart.</p>
              </div>
              <div className="min-w-[180px]">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Fremdrift</span>
                  <span>{completion}%</span>
                </div>
                <Progress value={completion} className="h-2" />
              </div>
            </div>
            <div className="overflow-hidden rounded-md border">
              {tasks.map((task) => (
                <TaskRow key={task.title} task={task} />
              ))}
            </div>
          </Card>

          <Tabs defaultValue="automations" className="space-y-3">
            <TabsList>
              <TabsTrigger value="automations">
                <Zap className="mr-2 h-4 w-4" />
                Automatisering
              </TabsTrigger>
              <TabsTrigger value="decisions">
                <MessageSquareText className="mr-2 h-4 w-4" />
                Beslutninger
              </TabsTrigger>
            </TabsList>
            <TabsContent value="automations" className="space-y-3">
              {automations.map((automation) => (
                <AutomationCard
                  key={automation.title}
                  automation={automation}
                  enabled={enabledMap[automation.title]}
                  onToggle={() => setEnabledMap((current) => ({ ...current, [automation.title]: !current[automation.title] }))}
                />
              ))}
            </TabsContent>
            <TabsContent value="decisions">
              <Card className="divide-y">
                {decisions.map((decision) => (
                  <div key={decision.title} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{decision.title}</h3>
                      <Badge variant="outline" className="text-xs">{decision.date}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Ansvarlig: {decision.owner}</p>
                  </div>
                ))}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-[#FF6319]" />
              Handling kræves
            </h2>
            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">OXEN-data er go-live kritisk</p>
                <p className="mt-1 text-xs text-muted-foreground">Få MySQL dump, tabelmapping og testmigration tidligt.</p>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Myndighedsadgange tager tid</p>
                <p className="mt-1 text-xs text-muted-foreground">SUS, CHR, FVST, Traces og Logbog bør startes først.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4" />
              Faser
            </h2>
            <div className="mt-3 space-y-3">
              {phases.map((phase) => {
                const value = Math.round((phase.done / phase.total) * 100);
                return (
                  <div key={phase.name}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium">{phase.name}</span>
                      <span className="text-muted-foreground">{phase.done}/{phase.total}</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" />
              Ugeplan
            </h2>
            <div className="mt-3 space-y-3">
              {["Mandag: Azure base + repo", "Onsdag: migration dump og mapping", "Fredag: API-adgangsstatus"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FF6319]" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Link2 className="h-4 w-4" />
              Hurtige links
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {links.map((item) => (
                <Link key={item.title} href={item.url}>
                  <Button variant="outline" className="w-full justify-start">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
