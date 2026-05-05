import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBox, type SelectedLocation } from "@/app/components/SearchBox";
import { useRiskAnalysis, useCompare } from "@/hooks/use-risk";
import { TrendChart } from "@/app/components/TrendChart";
import { IncidentCard } from "@/app/components/IncidentCard";
import { LiveNewsFeed } from "@/app/components/LiveNewsFeed";
import { CountryProfile } from "@/app/components/CountryProfile";
import { RiskBreakdownChart } from "@/app/components/RiskBreakdownChart";
import { DashboardSkeleton } from "@/app/components/DashboardSkeleton";
import { GlobeView } from "@/app/components/GlobeView";
import { ParticleCanvas } from "@/shared/components/ParticleCanvas";
import { RippleReveal } from "@/shared/components/RippleReveal";
import { ThreatBriefing } from "@/app/components/ThreatBriefing";
import { ProximityRadar } from "@/app/components/ProximityRadar";
import { IntelDrawer } from "@/app/components/IntelDrawer";
import FeedbackButton from "@/app/components/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCw,
  BarChart3,
  Newspaper,
  Globe,
  Github,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  ChevronDown,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Info,
  History,
  X as XIcon,
  Crosshair,
  BookOpen,
  ExternalLink,
  Brain,
  Cpu,
  Radio,
  LayoutList,
} from "lucide-react";
import { getRiskColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────────────────�[...]
interface HistoryEntry extends SelectedLocation {
  score?: number;
}

/* ── constants ────────────────────────────────────────────────────────────[...]
const REFRESH_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "1 min", value: 60_000 },
  { label: "2 min", value: 120_000 },
  { label: "5 min", value: 300_000 },
];

/* ── tiny helpers ───────────────────────────────────────────────────────────[...]
function useTypewriter(text: string, speed = 16) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      setOut(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return out;
}

function confidence(data: any): number {
  const tier = data?.scoringDebug?.tier ?? 4;
  const news = data?.news?.length ?? 0;
  const inc = data?.incidents?.length ?? 0;
  const base = tier === 1 ? 85 : tier === 2 ? 72 : tier === 3 ? 58 : 42;
  return Math.min(
    97,
    base + (news >= 8 ? 10 : news >= 4 ? 5 : 0) + (inc > 2 ? 2 : 0),
  );
}

function riskBg(score: number) {
  if (score >= 75) return "bg-red-500/8    border-red-500/20";
  if (score >= 50) return "bg-orange-500/8 border-orange-500/20";
  if (score >= 25) return "bg-yellow-500/8 border-yellow-500/20";
  return "bg-emerald-500/8 border-emerald-500/20";
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const color = getRiskColor(value);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0 capitalize">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      <span
        className="text-xs font-semibold w-7 text-right tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function LiveBadge({ updatedAt }: { updatedAt?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [updatedAt]);
  useEffect(() => setSecs(0), [updatedAt]);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m`} ago
    </span>
  );
}

function RiskIcon({ score }: { score: number }) {
  if (score >= 75) return <Flame className="w-4 h-4" />;
  if (score >= 50) return <AlertTriangle className="w-4 h-4" />;
  if (score >= 25) return <Info className="w-4 h-4" />;
  return <ShieldCheck className="w-4 h-4" />;
}

function ConfidenceMeter({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Model confidence</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════[...]
export default function Home() {
  const [loc, setLoc] = useState<SelectedLocation | null>(null);
  const [tab, setTab] = useState("overview");
  const [incFilter, setIncFilter] = useState<"all" | "realtime" | "past">(
    "all",
  );
  const [refreshMs, setRefreshMs] = useState(0);
  const [intelDrawer, setIntelDrawer] = useState<
    "watchlist" | "leaderboard" | null
  >(null);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [loc2, setLoc2] = useState<SelectedLocation | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [riskPulse, setRiskPulse] = useState(false);
  const [riskGlitch, setRiskGlitch] = useState("Know the Risk");
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("risk_history") || "[]");
    } catch {
      return [];
    }
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const locStr = loc?.displayName ?? null;
  const loc2Str = loc2?.displayName ?? null;

  const { data, isLoading, isError, refetch, refreshFreshly, dataUpdatedAt } =
    useRiskAnalysis(locStr, refreshMs || undefined);
  const { data: compareData, isLoading: compareLoading } = useCompare(
    compareMode ? locStr : null,
    compareMode ? loc2Str : null,
  );

  // ── Save history after data loads ────────────────────────────────────────
  useEffect(() => {
    if (!data || !loc) return;
    const entry: HistoryEntry = { ...loc, score: data.riskScore };
    const updated = [
      entry,
      ...history.filter((h) => h.displayName !== loc.displayName),
    ].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("risk_history", JSON.stringify(updated));
  }, [data?.riskScore]);

  // ── Keyboard shortcut: "/" or Cmd+K ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setFocusTrigger((n) => n + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Close menus on outside click ─────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowRefreshMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelect = (selected: SelectedLocation) => {
    setLoc(selected);
    setTab("overview");
    setLoc2(null);
    setCompareMode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKnowRisk = useCallback(() => {
    if (riskPulse) return;
    setRiskPulse(true);
    const frames = [
      "Know the Risk",
      "DETECTING...",
      "▓▓▓▓▓▓▓▓▓▓▓",
      "CLASSIFIED",
      "THREAT ACTIVE",
      "Know the Risk",
    ];
    frames.forEach((f, i) => setTimeout(() => setRiskGlitch(f), i * 150));
    setTimeout(() => {
      setRiskPulse(false);
      setRiskGlitch("Know the Risk");
    }, frames.length * 150 + 200);
  }, [riskPulse]);

  const filteredIncidents = (data?.incidents ?? []).filter((inc) => {
    if (incFilter === "realtime") return inc.is_realtime;
    if (incFilter === "past") return !inc.is_realtime;
    return true;
  });

  const activeRefresh = REFRESH_OPTIONS.find((o) => o.value === refreshMs);
  const conf = confidence(data);

  // Build intel summary string for typewriter
  const summaryText = data
    ? `${data.location} exhibits a ${data.riskLevel.toLowerCase()} risk profile (score: ${data.riskScore}/100). ` +
      (data.newsStats?.total
        ? `Analyzed ${data.newsStats.total} articles — ${data.newsStats.negative} flagged negative. `
        : "") +
      `${data.factors.length} primary risk vectors detected.`
    : "";
  const typedSummary = useTypewriter(summaryText, 14);

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={cn(
        "min-h-screen bg-background relative hide-scrollbars",
        !loc ? "h-screen pb-0" : "pb-12",
      )}
      style={{ overflowY: "auto", width: "100%" }}
    >
      {/* ── MOBILE GATE — visible only below lg (1024px) ─────────────────── */}
      <div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center lg:hidden"
        style={{
          background:
            "linear-gradient(160deg, #020617 0%, #020810 60%, #050d1a 100%)",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)` ,
            backgroundSize: "44px 44px",
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(30,80,200,0.10) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-xs">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30 flex-shrink-0">
              <Globe className="w-4.5 h-4.5 text-black" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-black uppercase tracking-[0.18em] text-white leading-none">
                CRZP
              </span>
              <span className="text-[15px] font-black uppercase tracking-[0.18em] text-amber-400 leading-none">
                APEX
              </span>
            </div>
          </div>

          {/* Desktop icon */}
          <div className="relative mb-8">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
                transform: "scale(1.8)",
                animationDuration: "3s",
              }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl border border-amber-400/20 flex items-center justify-center"
              style={{
                background: "rgba(245,158,11,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Monitor SVG */}
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="5"
                  width="32"
                  height="22"
                  rx="2.5"
                  stroke="rgba(245,158,11,0.7)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="14"
                  y1="27"
                  x2="12"
                  y2="34"
                  stroke="rgba(245,158,11,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="26"
                  y1="27"
                  x2="28"
                  y2="34"
                  stroke="rgba(245,158,11,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="10"
                  y1="34"
                  x2="30"
                  y2="34"
                  stroke="rgba(245,158,11,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Tiny globe inside monitor */}
                <circle
                  cx="20"
                  cy="16"
                  r="6"
                  stroke="rgba(245,158,11,0.5)"
                  strokeWidth="1"
                  fill="none"
                />
                <ellipse
                  cx="20"
                  cy="16"
                  rx="3"
                  ry="6"
                  stroke="rgba(245,158,11,0.3)"
                  strokeWidth="0.8"
                  fill="none"
                />
                <line
                  x1="14"
                  y1="16"
                  x2="26"
                  y2="16"
                  stroke="rgba(245,158,11,0.3)"
                  strokeWidth="0.8"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-400/50 block mb-3">
              Desktop Experience
            </span>
            <h1 className="text-[22px] font-black leading-tight tracking-tight text-white">
              Open on a<br />
              <span className="text-amber-400">Desktop</span> for<br />
              Full Access
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 w-full">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <div className="w-1 h-1 rounded-full bg-amber-400/30" />
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Description */}
          <p className="text-[12px] text-white/35 leading-relaxed">
            CRZP APEX is a precision geopolitical intelligence platform built for
            large screens. Visit on a laptop or desktop to access the full
            interactive globe, live analytics, and threat briefings.
          </p>

          {/* URL hint */}
          <div
            className="mt-6 px-3 py-2 rounded-lg border border-white/[0.06] w-full"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-[10px] font-mono text-white/25 tracking-wide">
              crzp.replit.app
            </p>
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-1.5 mt-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-red-400/50">
              Live Intelligence Active
            </span>
          </div>
        </div>
      </div>

      {/* ── KNOW THE RISK: global red flash overlay ──────────────────────── */}
      <AnimatePresence>
        {riskPulse && (
          <motion.div
            key="risk-flash"
            className="fixed inset-0 pointer-events-none z-[9990]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0.04, 0.09, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(ellipse at center, #ef4444 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── INTEL DRAWER ────────────────────────────────────────────────── */}
      <IntelDrawer
        open={intelDrawer !== null}
        defaultTab={intelDrawer ?? "watchlist"}
        onClose={() => setIntelDrawer(null)}
        onSelectLocation={handleSelect}
      />

      {/* ... rest of file unchanged ... */}
      <FeedbackButton />
    </div>
  );
}
