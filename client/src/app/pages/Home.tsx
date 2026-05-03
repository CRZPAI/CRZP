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
  Activity, MapPin, ShieldAlert, ShieldCheck, Zap, Clock, RefreshCw,
  BarChart3, Newspaper, Globe, Github, GitCompare, TrendingUp, TrendingDown, Minus,
  Database, ChevronDown, CheckCircle2, Flame, AlertTriangle, Info, History,
  X as XIcon, Crosshair, BookOpen, ExternalLink, Brain, Cpu, Radio, LayoutList,
} from "lucide-react";
import { getRiskColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────────────────── */
interface HistoryEntry extends SelectedLocation { score?: number }

/* ── constants ───────────────────────────────────────────────────────────── */
const REFRESH_OPTIONS = [
  { label: "Off",   value: 0 },
  { label: "1 min", value: 60_000 },
  { label: "2 min", value: 120_000 },
  { label: "5 min", value: 300_000 },
];

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
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
  const tier  = data?.scoringDebug?.tier ?? 4;
  const news  = data?.news?.length ?? 0;
  const inc   = data?.incidents?.length ?? 0;
  const base  = tier === 1 ? 85 : tier === 2 ? 72 : tier === 3 ? 58 : 42;
  return Math.min(97, base + (news >= 8 ? 10 : news >= 4 ? 5 : 0) + (inc > 2 ? 2 : 0));
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
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0 capitalize">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} />
      </div>
      <span className="text-xs font-semibold w-7 text-right tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function LiveBadge({ updatedAt }: { updatedAt?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => { const id = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(id); }, [updatedAt]);
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
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [loc, setLoc]                         = useState<SelectedLocation | null>(null);
  const [tab, setTab]                         = useState("overview");
  const [incFilter, setIncFilter]             = useState<"all" | "realtime" | "past">("all");
  const [refreshMs, setRefreshMs]             = useState(0);
  const [intelDrawer, setIntelDrawer]         = useState<"watchlist" | "leaderboard" | null>(null);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [compareMode, setCompareMode]         = useState(false);
  const [loc2, setLoc2]                       = useState<SelectedLocation | null>(null);
  const [focusTrigger, setFocusTrigger]       = useState(0);
  const [riskPulse, setRiskPulse]             = useState(false);
  const [riskGlitch, setRiskGlitch]           = useState("Know the Risk");
  const [history, setHistory]                 = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("risk_history") || "[]"); }
    catch { return []; }
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const locStr   = loc?.displayName ?? null;
  const loc2Str  = loc2?.displayName ?? null;

  const { data, isLoading, isError, refetch, refreshFreshly, dataUpdatedAt } = useRiskAnalysis(locStr, refreshMs || undefined);
  const { data: compareData, isLoading: compareLoading }     = useCompare(
    compareMode ? locStr : null,
    compareMode ? loc2Str : null,
  );

  // ── Save history after data loads ────────────────────────────────────────
  useEffect(() => {
    if (!data || !loc) return;
    const entry: HistoryEntry = { ...loc, score: data.riskScore };
    const updated = [entry, ...history.filter(h => h.displayName !== loc.displayName)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("risk_history", JSON.stringify(updated));
  }, [data?.riskScore]);

  // ── Keyboard shortcut: "/" or Cmd+K ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setFocusTrigger(n => n + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Close menus on outside click ─────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowRefreshMenu(false);
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
    const frames = ["Know the Risk", "DETECTING...", "▓▓▓▓▓▓▓▓▓▓▓", "CLASSIFIED", "THREAT ACTIVE", "Know the Risk"];
    frames.forEach((f, i) => setTimeout(() => setRiskGlitch(f), i * 150));
    setTimeout(() => { setRiskPulse(false); setRiskGlitch("Know the Risk"); }, frames.length * 150 + 200);
  }, [riskPulse]);

  const filteredIncidents = (data?.incidents ?? []).filter(inc => {
    if (incFilter === "realtime") return inc.is_realtime;
    if (incFilter === "past")     return !inc.is_realtime;
    return true;
  });

  const activeRefresh = REFRESH_OPTIONS.find(o => o.value === refreshMs);
  const conf = confidence(data);

  // Build intel summary string for typewriter
  const summaryText = data
    ? `${data.location} exhibits a ${data.riskLevel.toLowerCase()} risk profile (score: ${data.riskScore}/100). ` +
      (data.newsStats?.total ? `Analyzed ${data.newsStats.total} articles — ${data.newsStats.negative} flagged negative. ` : "") +
      `${data.factors.length} primary risk vectors detected.`
    : "";
  const typedSummary = useTypewriter(summaryText, 14);

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className={cn("min-h-screen bg-background relative hide-scrollbars", !loc ? "h-screen pb-0" : "pb-12")} style={{ overflowY: "auto", width: "100%" }}>

      {/* ── MOBILE GATE — visible only below lg (1024px) ─────────────────── */}
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center lg:hidden"
        style={{ background: "linear-gradient(160deg, #020617 0%, #020810 60%, #050d1a 100%)" }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }} />

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(30,80,200,0.10) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-xs">

          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/30 flex-shrink-0">
              <Globe className="w-4.5 h-4.5 text-black" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-black uppercase tracking-[0.18em] text-white leading-none">CRZP</span>
              <span className="text-[15px] font-black uppercase tracking-[0.18em] text-amber-400 leading-none">APEX</span>
            </div>
          </div>

          {/* Desktop icon */}
          <div className="relative mb-8">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full animate-pulse" style={{
              background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
              transform: "scale(1.8)",
              animationDuration: "3s",
            }} />
            <div className="relative w-20 h-20 rounded-2xl border border-amber-400/20 flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.06)", backdropFilter: "blur(12px)" }}>
              {/* Monitor SVG */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="32" height="22" rx="2.5" stroke="rgba(245,158,11,0.7)" strokeWidth="1.5" fill="none" />
                <line x1="14" y1="27" x2="12" y2="34" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="26" y1="27" x2="28" y2="34" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="34" x2="30" y2="34" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                {/* Tiny globe inside monitor */}
                <circle cx="20" cy="16" r="6" stroke="rgba(245,158,11,0.5)" strokeWidth="1" fill="none" />
                <ellipse cx="20" cy="16" rx="3" ry="6" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8" fill="none" />
                <line x1="14" y1="16" x2="26" y2="16" stroke="rgba(245,158,11,0.3)" strokeWidth="0.8" />
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
            CRZP APEX is a precision geopolitical intelligence platform built for large screens. Visit on a laptop or desktop to access the full interactive globe, live analytics, and threat briefings.
          </p>

          {/* URL hint */}
          <div className="mt-6 px-3 py-2 rounded-lg border border-white/[0.06] w-full"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] font-mono text-white/25 tracking-wide">crzp.replit.app</p>
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
            style={{ background: "radial-gradient(ellipse at center, #ef4444 0%, transparent 70%)" }}
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

      {/* ── LANDING (no location) ──────────────────────────────────────── */}
      <AnimatePresence>
        {!loc && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen overflow-x-hidden hide-scrollbars"
          >
            {/* Particle background */}
            <ParticleCanvas />

            {/* Intelligence grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)`,
              backgroundSize: "52px 52px",
            }} />

            {/* Ambient glow blobs */}
            <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] bg-amber-500/[0.035] rounded-full blur-[160px] pointer-events-none"
              style={{ animation: "hero-glow 9s ease-in-out infinite" }} />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-red-600/[0.035] rounded-full blur-[120px] pointer-events-none"
              style={{ animation: "hero-glow 13s ease-in-out infinite 5s" }} />

            {/* ── Clean fixed navbar ── */}
            <motion.nav
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="fixed top-0 inset-x-0 z-[9999] border-b border-white/[0.06]"
              style={{ background: "rgba(4,7,18,0.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            >
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 h-[60px] flex items-center justify-between">
              {/* Left: brand */}
              <a href="/" className="flex items-center gap-3 group" title="CRZP APEX">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 shadow-lg flex-shrink-0 group-hover:bg-amber-400 transition-colors">
                  <Globe className="w-4 h-4 text-black" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black uppercase tracking-[0.18em] text-white leading-none group-hover:text-white/80 transition-colors">CRZP</span>
                  <span className="text-[13px] font-black uppercase tracking-[0.18em] text-amber-400 leading-none group-hover:text-amber-300 transition-colors">APEX</span>
                </div>
              </a>

              {/* Center: tagline — interactive shockwave */}
              <div className="relative hidden md:flex items-center justify-center">
                {/* Shockwave rings */}
                <AnimatePresence>
                  {riskPulse && [0, 0.12, 0.26].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full pointer-events-none border"
                      style={{ borderColor: i === 0 ? "rgba(239,68,68,0.7)" : i === 1 ? "rgba(245,158,11,0.5)" : "rgba(239,68,68,0.3)" }}
                      initial={{ width: 4, height: 4, opacity: 1 }}
                      animate={{ width: 280, height: 280, opacity: 0 }}
                      exit={{}}
                      transition={{ duration: 0.75, delay, ease: [0.2, 0, 0.4, 1] }}
                    />
                  ))}
                </AnimatePresence>

                <motion.button
                  onClick={handleKnowRisk}
                  className="relative z-10 px-3 py-1 rounded cursor-pointer select-none outline-none"
                  animate={riskPulse ? {
                    x: [0, -4, 4, -3, 3, -2, 2, 0],
                    transition: { duration: 0.5, ease: "easeInOut" }
                  } : {}}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    className="text-[10px] font-bold uppercase tracking-[0.28em] block"
                    animate={riskPulse ? {
                      color: ["rgba(255,255,255,0.35)", "#ef4444", "#f59e0b", "#ef4444", "rgba(255,255,255,0.35)"],
                      textShadow: [
                        "none",
                        "0 0 12px rgba(239,68,68,0.8)",
                        "0 0 8px rgba(245,158,11,0.6)",
                        "0 0 12px rgba(239,68,68,0.8)",
                        "none",
                      ],
                    } : { color: "rgba(255,255,255,0.35)" }}
                    transition={{ duration: 0.8 }}
                  >
                    {riskGlitch}
                  </motion.span>
                </motion.button>
              </div>

              {/* Right: nav links */}
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/crzp_ai"
                  target="_blank"
                  rel="noreferrer"
                  title="X (Twitter)"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/20 bg-white/[0.06] text-white/80 hover:border-amber-400/60 hover:text-amber-300 hover:bg-amber-500/[0.12] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/i-anasop/CRZP"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/[0.06] text-white/80 text-[11px] font-semibold uppercase tracking-wider hover:border-amber-400/60 hover:text-amber-300 hover:bg-amber-500/[0.12] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-150"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <a
                  href="/landing"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/70 bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-amber-400 hover:border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] transition-all duration-150"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Portal</span>
                </a>
              </div>
            </div>
            </motion.nav>



            {/* ── MAIN HERO LAYOUT ──────────────────────────────────────── */}
            <div className="relative w-full min-h-screen flex overflow-x-hidden hide-scrollbars px-6 sm:px-10 lg:px-16 xl:px-28">

              {/* Left content panel — floats over left half */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="relative z-20 flex flex-col justify-center pr-6 pt-[88px] pb-28 w-full lg:w-[500px] shrink-0"
                style={{ perspective: "1000px" }}
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-400/60">
                    Live Intelligence
                  </span>
                </div>

                {/* Title — stacked large headline */}
                <h1 className="font-black leading-[0.86] tracking-[-0.03em] text-white mb-5">
                  <span className="block text-[40px] sm:text-5xl lg:text-[62px]">GLOBAL</span>
                  <span className="block text-[40px] sm:text-5xl lg:text-[62px]">CRISIS</span>
                  <span className="block text-[48px] sm:text-6xl lg:text-[76px] text-amber-400" style={{ textShadow: "0 4px 32px rgba(245,158,11,0.22)" }}>GENESIS</span>
                </h1>

                <p className="text-[13px] text-white/35 mb-7 leading-[1.7] max-w-sm pl-4 border-l border-amber-500/25">
                  Precision geopolitical intelligence and predictive volatility modeling. Decipher global instability with high-resolution tactical data.
                </p>

                {/* Search */}
                <div className="w-full max-w-md mb-4">
                  <SearchBox
                    onSelect={handleSelect}
                    autoFocus
                    externalFocusTrigger={focusTrigger}
                    className="mx-0"
                  />
                </div>

                {/* Recent searches */}
                {history.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] text-white/25 mb-2 flex items-center gap-1.5">
                      <History className="w-3 h-3" /> Recent searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {history.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(h)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-white/[0.07] bg-white/[0.03] hover:border-amber-500/30 hover:bg-amber-500/6 transition-all"
                        >
                          <span className="text-white/45">{h.displayName.split(",")[0]}</span>
                          {h.score != null && (
                            <span className="font-bold tabular-nums" style={{ color: getRiskColor(h.score) }}>
                              {h.score}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick stats row + actions */}
                <div className="mt-6 max-w-[440px]">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{ label: "NODES", value: "242+" }, { label: "SIGNALS", value: "8.4K" }, { label: "VERSION", value: "4.0" }].map((s) => (
                      <div key={s.label} className="py-3 px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-1 hover:border-amber-500/15 hover:bg-white/[0.035] transition-all duration-200">
                        <span className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-none">{s.value}</span>
                        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-semibold">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full flex gap-2.5">
                    {/* Live Monitor button */}
                    <button
                      onClick={() => setIntelDrawer("watchlist")}
                      className="flex-1 group relative inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl active:scale-[0.97] transition-all duration-150 overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        boxShadow: "0 4px 24px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }} />
                      <span className="relative flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-black/50" />
                        </span>
                        <span className="text-black font-black uppercase text-[11px] tracking-[0.12em]">Live Monitor</span>
                      </span>
                    </button>

                    {/* Leaderboard button */}
                    <button
                      onClick={() => setIntelDrawer("leaderboard")}
                      className="flex-1 group relative inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl active:scale-[0.97] transition-all duration-150 overflow-hidden"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: "rgba(245,158,11,0.06)" }} />
                      <span className="relative flex items-center gap-2">
                        <LayoutList className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400/70 transition-colors duration-150" />
                        <span className="text-white/55 group-hover:text-white/80 font-black uppercase text-[11px] tracking-[0.12em] transition-colors duration-150">Leaderboard</span>
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Globe — right side, extends under header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.1, ease: "easeOut" }}
                className="absolute inset-y-0 right-0 hidden lg:flex items-center z-0 overflow-visible"
                style={{ width: "68%" }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Blobs clipped in their own layer so they don't trigger scroll */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Deep blue ambient core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(30,80,200,0.14) 0%, rgba(10,30,90,0.07) 55%, transparent 80%)", filter: "blur(40px)" }} />
                    {/* Amber outer corona */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full"
                      style={{ background: "radial-gradient(circle, transparent 38%, rgba(245,158,11,0.06) 58%, transparent 78%)", filter: "blur(32px)" }} />
                  </div>

                  {/* ── HUD corner brackets ─────────────────────────────── */}
                  <div className="absolute pointer-events-none z-10" style={{ width: 560, height: 560 }}>
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-amber-400/30" />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-amber-400/30" />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-amber-400/30" />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-amber-400/30" />

                    {/* Scanning ring */}
                    <div className="absolute inset-0 rounded-full border border-blue-400/[0.07] animate-pulse" style={{ animationDuration: "4s" }} />

                    {/* Top label */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="h-px w-12 bg-amber-400/20" />
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-400/35">Risk Heatmap</span>
                      <div className="h-px w-12 bg-amber-400/20" />
                    </div>

                    {/* Live indicator — top right corner */}
                    <div className="absolute -top-5 right-0 flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-[0.25em] text-red-400/50">LIVE</span>
                    </div>

                    {/* Risk legend — bottom left */}
                    <div className="absolute -bottom-6 left-0 flex items-center gap-3">
                      {([
                        { label: "EXTREME", color: "#ef4444" },
                        { label: "HIGH",    color: "#f97316" },
                        { label: "MOD",     color: "#f59e0b" },
                        { label: "LOW",     color: "#22c55e" },
                        { label: "STABLE",  color: "#5091e6" },
                      ] as const).map((r) => (
                        <div key={r.label} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ background: r.color + "99" }} />
                          <span className="text-[7px] font-bold tracking-[0.1em] text-white/25">{r.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Hotspot count — bottom right */}
                    <div className="absolute -bottom-5 right-0 text-right">
                      <span className="text-[7px] font-mono text-white/20 tracking-wider">12 CRISIS ZONES</span>
                    </div>
                  </div>

                  <GlobeView
                    height={680}
                    onCountryClick={(name, clat, clon) =>
                      handleSelect({ displayName: name, lat: clat, lon: clon })
                    }
                  />
                </div>
              </motion.div>

              {/* Mobile globe */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="lg:hidden absolute bottom-32 left-0 right-0 px-4"
              >
                <GlobeView
                  height={320}
                  onCountryClick={(name, clat, clon) =>
                    handleSelect({ displayName: name, lat: clat, lon: clon })
                  }
                />
              </motion.div>

            </div>

            {/* ── BOTTOM FOOTER STRIP ──────────────────────────── */}
            <motion.footer
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 lg:px-10 py-3.5 border-t border-white/[0.05]"
              style={{ background: "rgba(4,7,18,0.7)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10 border border-amber-400/25">
                  <Globe className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">CRZP Protocol</span>
                <span className="text-[9px] text-white/15 hidden sm:inline">· ML-powered geopolitical intelligence</span>
              </div>

              <div className="flex items-center gap-4 text-[9px] text-white/25">
                <a href="https://github.com/i-anasop/CRZP" target="_blank" rel="noreferrer" className="hover:text-amber-300/70 transition-colors">GitHub</a>
                <a href="/docs" className="hover:text-amber-300/70 transition-colors">Docs</a>
                <span className="text-white/20">© 2026 CRZP</span>
              </div>
            </motion.footer>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loc && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full pb-10"
          >
            {/* ── Sticky dashboard header ── */}
            <div
              className="sticky top-0 z-40 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8"
              style={{ background: "rgba(4,7,18,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
            >
              <div className="max-w-7xl mx-auto flex items-center gap-3 h-[58px]">
                {/* Brand — links back to marketing site */}
                <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group" title="Back to CRZP site">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-md group-hover:bg-amber-400 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400/80 hidden sm:inline group-hover:text-amber-300 transition-colors">CRZP APEX</span>
                </a>

                <div className="h-4 w-px bg-white/10 flex-shrink-0 hidden sm:block" />

                {/* Search */}
                <div className="flex-1 min-w-0 max-w-sm">
                  <SearchBox onSelect={handleSelect} externalFocusTrigger={focusTrigger} />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative" ref={menuRef}>
                    <button
                      className={cn("h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                        refreshMs > 0
                          ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-400"
                          : "border-white/[0.07] bg-white/[0.03] text-white/45 hover:text-white/70 hover:border-white/12"
                      )}
                      onClick={() => setShowRefreshMenu(v => !v)}
                    >
                      <RefreshCw className={cn("w-3 h-3", refreshMs > 0 && "animate-spin [animation-duration:3s]")} />
                      <span className="hidden sm:inline">{activeRefresh?.label === "Off" ? "Auto" : activeRefresh?.label}</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {showRefreshMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-card border border-white/10 rounded-xl shadow-2xl z-50 min-w-[140px] overflow-hidden py-1.5">
                        {REFRESH_OPTIONS.map(opt => (
                          <button key={opt.value} className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-white/[0.04] transition-colors text-white/60 hover:text-white/90"
                            onClick={() => { setRefreshMs(opt.value); setShowRefreshMenu(false); }}>
                            {opt.label}
                            {opt.value === refreshMs && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-semibold border border-white/[0.07] bg-white/[0.03] text-white/45 hover:text-white/70 hover:border-white/12 transition-colors"
                    onClick={() => refreshFreshly()}
                    title="Force refresh"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden md:inline">Refresh</span>
                  </button>

                  <button
                    className={cn("h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                      compareMode
                        ? "border-amber-400/40 bg-amber-500/12 text-amber-300"
                        : "border-white/[0.07] bg-white/[0.03] text-white/45 hover:text-white/70 hover:border-white/12"
                    )}
                    onClick={() => { setCompareMode(v => !v); setLoc2(null); }}
                  >
                    <GitCompare className="w-3 h-3" />
                    <span className="hidden md:inline">Compare</span>
                  </button>

                  <button
                    onClick={() => { setLoc(null); setTab("overview"); }}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-black text-[11px] font-black uppercase tracking-wider hover:bg-amber-400 active:scale-[0.97] transition-all shadow-md shadow-amber-500/20"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto">

            <div className="pointer-events-none fixed top-[58px] right-0 h-64 w-64 rounded-full bg-amber-500/6 blur-3xl -z-10" />
            <div className="pointer-events-none fixed top-52 left-0 h-56 w-56 rounded-full bg-amber-400/5 blur-3xl -z-10" />

            {/* Loading */}
            {isLoading && (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardSkeleton />
              </motion.div>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <motion.div
                key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto mt-20 border border-border rounded-xl p-10 text-center bg-card"
              >
                <ShieldAlert className="w-10 h-10 mx-auto text-destructive mb-4 opacity-70" />
                <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Could not fetch risk data for <strong className="text-foreground">{loc.displayName}</strong>.
                </p>
                <Button onClick={() => refetch()} size="sm" className="gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </Button>
              </motion.div>
            )}

            {/* Data */}
            {data && !isLoading && (
              <motion.div key="data" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

                {/* Location header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/12 border border-amber-500/20 flex-shrink-0">
                      <MapPin className="w-4 h-4 text-amber-400" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-black truncate tracking-tight text-foreground">{data.location}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <LiveBadge updatedAt={data.lastUpdated} />
                        {data.dataSourcesUsed && (
                          <span className="hidden sm:inline text-[11px] text-muted-foreground/40 font-medium">{data.dataSourcesUsed.length} sources</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {data && <ThreatBriefing data={data} />}
                  </div>
                </div>

                {/* Compare search */}
                {compareMode && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <GitCompare className="w-3.5 h-3.5" /> Search a second location to compare
                    </p>
                    <SearchBox onSelect={setLoc2} className="max-w-lg" />
                  </motion.div>
                )}

                {/* Compare cards */}
                {compareMode && loc2 && (
                  <AnimatePresence>
                    {compareLoading ? (
                      <div className="border border-white/10 rounded-2xl p-8 text-center text-muted-foreground mb-5 text-sm bg-card/80">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                        Comparing…
                      </div>
                    ) : compareData ? (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {[compareData.location1, compareData.location2].map((r, i) => (
                          <div key={i} className="border border-white/10 rounded-2xl p-5 bg-gradient-to-br from-card to-card/70 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? "#6366f1" : "#f59e0b" }} />
                              <h3 className="font-semibold text-sm">{r.location}</h3>
                            </div>
                            <div className="flex items-baseline gap-3 mb-4">
                              <span className="text-4xl font-bold" style={{ color: getRiskColor(r.riskScore) }}>{r.riskScore}</span>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: getRiskColor(r.riskScore) }}>{r.riskLevel}</p>
                                <p className="text-xs text-muted-foreground">{r.incidents.length} incidents</p>
                              </div>
                            </div>
                            {r.breakdown && (
                              <div className="flex flex-col gap-2">
                                {Object.entries(r.breakdown).map(([k, v]) => (
                                  <DimensionBar key={k} label={k} value={v as number} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* ── Tabs ── */}
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="mb-5 flex gap-1.5 h-auto bg-card/60 border border-white/[0.07] rounded-2xl w-full p-1.5 overflow-x-auto hide-scrollbars backdrop-blur-sm">
                    {[
                      { v: "overview",  icon: Activity,    label: "Overview" },
                      { v: "conflict",  icon: Crosshair,   label: "Conflict", badge: data.conflictEvents?.length },
                      { v: "analysis",  icon: BarChart3,   label: "Analysis" },
                      { v: "incidents", icon: ShieldAlert, label: "Incidents", badge: data.incidents.length },
                      { v: "news",      icon: Newspaper,   label: "News",      badge: data.news?.length },
                      { v: "country",   icon: Globe,       label: "Country" },
                      { v: "trend",     icon: TrendingUp,  label: "Trend" },
                      { v: "radar",     icon: Radio,       label: "Radar" },
                    ].map(({ v, icon: Icon, label, badge }) => (
                      <TabsTrigger key={v} value={v}
                        className={cn(
                          "gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-muted-foreground whitespace-nowrap border border-transparent",
                          "data-[state=active]:border-amber-400/30 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-200 data-[state=active]:shadow-none",
                          "hover:text-foreground hover:bg-white/[0.04] transition-colors shadow-none",
                        )}>
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                        {badge ? <span className="text-[10px] bg-white/[0.07] text-muted-foreground/70 px-1.5 py-0.5 rounded-full ml-0.5 tabular-nums">{badge}</span> : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* ════ OVERVIEW ════ */}
                  <TabsContent value="overview">
                    <div className="space-y-5">

                      {/* Globe + Score row */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Globe */}
                        <div className="lg:col-span-2 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-card via-card to-amber-950/15 p-2">
                          <GlobeView
                            lat={loc?.lat}
                            lon={loc?.lon}
                            riskScore={data.riskScore}
                            locationName={data.location.split(",")[0]}
                            height={360}
                            onCountryClick={(name, clat, clon) =>
                              handleSelect({ displayName: name, lat: clat, lon: clon })
                            }
                          />
                        </div>

                        {/* Hero score card */}
                        <motion.div
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          className={cn("lg:col-span-3 border border-amber-400/20 rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card/90 to-amber-950/14 relative shadow-[0_16px_36px_rgba(0,0,0,0.25)]", riskBg(data.riskScore))}
                        >
                          <RippleReveal color={getRiskColor(data.riskScore)} trigger={data.riskScore} />

                          <div className="grid grid-cols-1 md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-border relative z-10">

                            {/* Score */}
                            <div className="flex flex-col items-center justify-center py-8 px-6 gap-4">
                              <div className="relative w-36 h-36 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                                  <circle cx="72" cy="72" r="58" fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
                                  <motion.circle cx="72" cy="72" r="58" fill="none"
                                    stroke={getRiskColor(data.riskScore)} strokeWidth="10" strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 58}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - data.riskScore / 100) }}
                                    transition={{ duration: 1, ease: "easeOut" }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                    className="text-4xl font-bold" style={{ color: getRiskColor(data.riskScore) }}>
                                    {data.riskScore}
                                  </motion.span>
                                  <span className="text-xs text-muted-foreground">/ 100</span>
                                </div>
                              </div>
                              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border"
                                style={{ color: getRiskColor(data.riskScore), borderColor: `${getRiskColor(data.riskScore)}30`, backgroundColor: `${getRiskColor(data.riskScore)}10` }}>
                                <RiskIcon score={data.riskScore} />
                                {data.riskLevel}
                              </div>
                              <ConfidenceMeter pct={conf} />

                              {/* GDELT Escalation Momentum Signal */}
                              {data.escalationMomentum && (
                                <div
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-help"
                                  style={{
                                    color: data.escalationMomentum.signal === "Escalating" ? "#ef4444" :
                                           data.escalationMomentum.signal === "De-escalating" ? "#22c55e" : "#f59e0b",
                                    borderColor: data.escalationMomentum.signal === "Escalating" ? "#ef444430" :
                                                 data.escalationMomentum.signal === "De-escalating" ? "#22c55e30" : "#f59e0b30",
                                    backgroundColor: data.escalationMomentum.signal === "Escalating" ? "#ef444410" :
                                                     data.escalationMomentum.signal === "De-escalating" ? "#22c55e10" : "#f59e0b10",
                                  }}
                                  title={data.escalationMomentum.description}
                                >
                                  {data.escalationMomentum.signal === "Escalating"
                                    ? <TrendingUp className="w-3 h-3" />
                                    : data.escalationMomentum.signal === "De-escalating"
                                    ? <TrendingDown className="w-3 h-3" />
                                    : <Minus className="w-3 h-3" />}
                                  {data.escalationMomentum.label}
                                </div>
                              )}
                            </div>

                            {/* Dimensions + factors */}
                            <div className="py-6 px-5 flex flex-col justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Risk Dimensions</p>
                                <div className="flex flex-col gap-2.5">
                                  {data.breakdown && Object.entries(data.breakdown).map(([k, v]) => (
                                    <DimensionBar key={k} label={k} value={v as number} />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Factors</p>
                                <div className="flex flex-col gap-1.5">
                                  {data.factors.slice(0, 4).map((f, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 + i * 0.05 }}
                                      className="flex items-start gap-2 text-xs text-foreground/75">
                                      <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getRiskColor(data.riskScore) }} />
                                      {f}
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { v: data.riskScore, l: "Risk Score",        s: "0–100 composite", c: getRiskColor(data.riskScore) },
                          { v: data.news?.length ?? 0, l: "News Articles", s: `${data.newsStats?.negative ?? 0} negative` },
                          { v: data.incidents.length,  l: "Incidents",     s: `${data.incidents.filter(i => i.is_realtime).length} real-time` },
                          { v: data.newsStats
                              ? `${Math.round(((data.newsStats.negative ?? 0) / Math.max(1, data.newsStats.total)) * 100)}%`
                              : "—",
                            l: "Neg. Sentiment", s: "of 48h news" },
                        ].map((s, i) => (
                          <div key={i} className="border border-white/[0.07] rounded-2xl px-4 py-3.5 bg-card/80 hover:border-white/[0.11] transition-colors duration-200">
                            <span className="text-2xl font-black tabular-nums block tracking-tight leading-tight" style={s.c ? { color: s.c } : undefined}>{s.v}</span>
                            <span className="text-[11px] font-semibold text-muted-foreground/80 block mt-1">{s.l}</span>
                            <span className="text-[10px] text-muted-foreground/40 block">{s.s}</span>
                          </div>
                        ))}
                      </div>

                      {/* ML Model Intelligence Card */}
                      {data.mlPrediction && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="border border-amber-400/20 rounded-2xl bg-gradient-to-br from-card to-amber-950/14 overflow-hidden"
                        >
                          <div className="px-5 py-3 border-b border-amber-400/15 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-amber-300" />
                              <span className="text-xs font-semibold text-amber-100/80 uppercase tracking-wider">ML Model Intelligence</span>
                            </div>
                            <span className="text-xs text-muted-foreground/35 hidden sm:inline">
                              VotingClassifier · RF×200 + GB×150 · 135 countries · CV 84.4%
                            </span>
                          </div>
                          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Tier probability bars */}
                            <div>
                              <p className="text-[10px] text-muted-foreground/55 mb-2.5 uppercase tracking-wider font-semibold">
                                Risk Tier Probabilities
                              </p>
                              <div className="flex flex-col gap-2">
                                {Object.entries(data.mlPrediction.probabilities).map(([tier, prob]) => {
                                  const colors: Record<string, string> = {
                                    Low: "#22c55e", Moderate: "#f59e0b", High: "#f97316", Extreme: "#ef4444",
                                  };
                                  const color = colors[tier] || "#888";
                                  const pct = Math.round((prob as number) * 100);
                                  return (
                                    <div key={tier} className="flex items-center gap-2">
                                      <span className="text-xs w-18 text-muted-foreground/70 min-w-[70px]">{tier}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <motion.div
                                          className="h-full rounded-full"
                                          style={{ backgroundColor: color }}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${pct}%` }}
                                          transition={{ duration: 0.8, delay: 0.4 }}
                                        />
                                      </div>
                                      <span className="text-xs tabular-nums text-muted-foreground/50 w-8 text-right">{pct}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-muted-foreground/30 mt-2">
                                Model confidence: {data.mlPrediction.confidence}%
                              </p>
                            </div>

                            {/* Input features */}
                            <div>
                              <p className="text-[10px] text-muted-foreground/55 mb-2.5 uppercase tracking-wider font-semibold">
                                Input Features
                              </p>
                              {data.mlPrediction.features ? (
                                <div className="flex flex-col gap-2">
                                  {[
                                    { k: "FSI 2024", v: `${data.mlPrediction.features.fsi.toFixed(1)} / 120`, pct: (data.mlPrediction.features.fsi / 120) * 100 },
                                    { k: "GPI Rank", v: `#${data.mlPrediction.features.gpiRank} of 163`, pct: (data.mlPrediction.features.gpiRank / 163) * 100 },
                                    { k: "Conflict (5yr)", v: ["None", "Low", "Medium", "High"][data.mlPrediction.features.conflict] ?? "—", pct: (data.mlPrediction.features.conflict / 3) * 100 },
                                  ].map(f => (
                                    <div key={f.k} className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground/70 min-w-[80px]">{f.k}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <motion.div
                                          className="h-full rounded-full bg-primary/40"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${f.pct}%` }}
                                          transition={{ duration: 0.8, delay: 0.5 }}
                                        />
                                      </div>
                                      <span className="text-xs tabular-nums text-muted-foreground/50 min-w-[90px] text-right">{f.v}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground/45">
                                  City-level intelligence profile (Tier 1)
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground/30 mt-2.5 leading-relaxed">
                                Fragile States Index 2024 · GPI 2024 · UCDP 2023
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Typewriter intel summary */}
                      <div className="border border-amber-400/20 rounded-2xl px-5 py-4 bg-gradient-to-br from-card to-amber-950/12 min-h-[56px]">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {typedSummary}
                          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
                        </p>
                      </div>

                      {/* Recent incidents */}
                      {data.incidents.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Incidents</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.incidents.slice(0, 3).map((inc, i) => (
                              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}>
                                <IncidentCard incident={inc} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ════ CONFLICT INTELLIGENCE ════ */}
                  <TabsContent value="conflict">
                    <div className="space-y-4">

                      {/* Wikipedia background brief */}
                      {data.wikiSummary && (
                        <div className="border border-border rounded-xl bg-card overflow-hidden">
                          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <h3 className="font-semibold text-sm">Background Intel — {data.wikiSummary.title}</h3>
                            </div>
                            {data.wikiSummary.url && (
                              <a href={data.wikiSummary.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                Source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="px-5 py-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{data.wikiSummary.summary}</p>
                          </div>
                        </div>
                      )}

                      {/* Conflict event articles */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-destructive" />
                            Conflict & Military Events
                            <span className="text-xs text-muted-foreground/50 font-normal">GDELT keyword-targeted feed</span>
                          </h3>
                          <span className="text-xs text-muted-foreground/40">{data.conflictEvents?.length ?? 0} articles · 7-day window</span>
                        </div>
                        {data.conflictEvents && data.conflictEvents.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {data.conflictEvents.map((art, i) => (
                              <motion.a
                                key={i}
                                href={art.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex gap-4 border border-border rounded-xl px-5 py-3.5 bg-card hover:border-white/20 transition-all group"
                              >
                                <div className="flex-shrink-0 w-1 self-stretch rounded-full"
                                  style={{ backgroundColor: art.sentiment === "negative" ? "#ef4444" : art.sentiment === "positive" ? "#22c55e" : "#3b82f6" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground truncate">{art.title}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/60">
                                    <span className="font-medium">{art.source}</span>
                                    <span>·</span>
                                    <span>{art.date}</span>
                                    <span className={cn("ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                                      art.sentiment === "negative" ? "text-red-400 bg-red-500/10"
                                      : art.sentiment === "positive" ? "text-emerald-400 bg-emerald-500/10"
                                      : "text-blue-400 bg-blue-500/10")}>
                                      {art.sentiment}
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5 group-hover:text-muted-foreground/60 transition-colors" />
                              </motion.a>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-border rounded-xl p-12 text-center bg-card">
                            <Crosshair className="w-10 h-10 mx-auto text-muted-foreground/25 mb-3" />
                            <p className="text-sm text-muted-foreground">No conflict-specific reports found in the 7-day window.</p>
                            <p className="text-xs text-muted-foreground/40 mt-1">This may indicate relatively lower conflict activity.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ════ ANALYSIS ════ */}
                  <TabsContent value="analysis">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.breakdown && <RiskBreakdownChart breakdown={data.breakdown} />}
                      {data.trend     && <TrendChart trend={data.trend} currentScore={data.riskScore} />}
                    </div>
                  </TabsContent>

                  {/* ════ INCIDENTS ════ */}
                  <TabsContent value="incidents">
                    <div className="mb-4 flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-sm">Verified Incidents</h3>
                      <div className="flex gap-1.5 ml-auto">
                        {(["all", "realtime", "past"] as const).map(f => (
                          <Button key={f} size="sm" variant={incFilter === f ? "default" : "outline"}
                            onClick={() => setIncFilter(f)} className="h-7 text-xs gap-1">
                            {f === "realtime" && <Zap className="w-3 h-3" />}
                            {f === "past"     && <Clock className="w-3 h-3" />}
                            {f === "all" ? "All" : f === "realtime" ? "Live" : "Past"}
                            <span className="opacity-60">
                              ({(data.incidents ?? []).filter(i => f === "realtime" ? i.is_realtime : f === "past" ? !i.is_realtime : true).length})
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    {filteredIncidents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredIncidents.map((inc, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <IncidentCard incident={inc} />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl p-12 text-center bg-card">
                        <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No incidents for the selected filter.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* ════ NEWS ════ */}
                  <TabsContent value="news">
                    <div className="border border-border rounded-xl p-5 bg-card">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <h3 className="font-semibold text-sm">Live News Feed</h3>
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Database className="w-3 h-3" /> GDELT 2.0
                        </span>
                      </div>
                      <LiveNewsFeed articles={data.news ?? []} stats={data.newsStats} location={data.location} />
                    </div>
                  </TabsContent>

                  {/* ════ COUNTRY ════ */}
                  <TabsContent value="country">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {data.countryProfile
                        ? <CountryProfile profile={data.countryProfile} />
                        : (
                          <div className="border border-border rounded-xl p-10 text-center bg-card">
                            <Globe className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">No profile for <strong className="text-foreground">{data.location}</strong>.</p>
                          </div>
                        )
                      }
                      <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" /> Risk Summary
                        </h3>
                        <div className="flex items-baseline gap-4 pb-4 border-b border-border">
                          <span className="text-5xl font-bold" style={{ color: getRiskColor(data.riskScore) }}>{data.riskScore}</span>
                          <div>
                            <p className="font-semibold" style={{ color: getRiskColor(data.riskScore) }}>{data.riskLevel}</p>
                            <p className="text-xs text-muted-foreground">{data.incidents.length} incidents · {data.news?.length ?? 0} articles</p>
                          </div>
                        </div>
                        {data.breakdown && (
                          <div className="flex flex-col gap-3">
                            {Object.entries(data.breakdown).map(([k, v]) => (
                              <DimensionBar key={k} label={k} value={v as number} />
                            ))}
                          </div>
                        )}
                        <ConfidenceMeter pct={conf} />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ════ TREND ════ */}
                  <TabsContent value="trend">
                    <div className="space-y-4">
                      {data.trend ? (
                        <>
                          <TrendChart trend={data.trend} currentScore={data.riskScore} />
                          <div className="border border-border rounded-xl p-5 bg-card">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Day-by-Day</p>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-end" style={{ height: 120 }}>
                              {data.trend.map((pt, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                                  <div className="w-full rounded-md flex items-end justify-center pb-1 text-xs font-semibold"
                                    style={{
                                      height: `${Math.max(24, (pt.score / 100) * 96)}px`,
                                      backgroundColor: `${getRiskColor(pt.score)}15`,
                                      border: `1px solid ${getRiskColor(pt.score)}30`,
                                      color: getRiskColor(pt.score),
                                    }}>
                                    {pt.score}
                                  </div>
                                  <span className="text-xs text-muted-foreground text-center leading-tight">{pt.date}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="border border-border rounded-xl p-12 text-center bg-card">
                          <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">Trend data not available.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ════ RADAR ════ */}
                  <TabsContent value="radar">
                    <div className="border border-border rounded-xl p-5 bg-card">
                      {loc?.lat != null && loc?.lon != null ? (
                        <ProximityRadar
                          lat={loc.lat}
                          lon={loc.lon}
                          locationName={data.location.split(",")[0]}
                          onSelectLocation={handleSelect}
                        />
                      ) : (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                          Location coordinates unavailable for radar.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
            </div>{/* end dashboard content */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback button (global) */}
      <FeedbackButton />


    </div>
  );
}
