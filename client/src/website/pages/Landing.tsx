import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "wouter";
import { Globe, Shield, Zap, ArrowRight, Activity, Radar, Cpu, Target, Brain, ChevronDown, Database, Search, TrendingUp, MapPin, AlertTriangle, Eye, BarChart3 } from "lucide-react";
import { ParticleCanvas } from "@/shared/components/ParticleCanvas";
import { Button } from "@/components/ui/button";
import { Globe3D } from "@/website/components/Globe3D";
import { SiteFooter } from "@/website/components/SiteFooter";
import { SiteNavbar } from "@/website/components/SiteNavbar";
import { cn } from "@/lib/utils";

/* ── Animation presets ─────────────────────────────────────────────────── */
const up = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } } };
const st = { show: { transition: { staggerChildren: 0.1 } } };

/* ── Floating wireframe diamond ─────────────────────────────────────────── */
function WireDiamond({ size = 80, className = "", delay = 0, duration = 20 }: { size?: number; className?: string; delay?: number; duration?: number }) {
  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      style={{ width: size, height: size, perspective: 400 }}
      animate={{ y: [0, -18, 0], rotateY: [0, 360], rotateX: [15, 35, 15] }}
      transition={{ y: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut" }, rotateY: { duration, repeat: Infinity, ease: "linear" }, rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
    >
      <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}>
        {[0, 60, 120].map((r, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `rotateY(${r}deg)`, border: "1px solid rgba(245,158,11,0.2)", borderRadius: "50%", transformStyle: "preserve-3d" }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 4, height: 4, background: "rgba(245,158,11,0.6)", borderRadius: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 8px rgba(245,158,11,0.8)" }} />
      </div>
    </motion.div>
  );
}

/* ── Floating 3D cube wireframe ─────────────────────────────────────────── */
function WireCube({ size = 40, className = "", delay = 0, speed = 25 }: { size?: number; className?: string; delay?: number; speed?: number }) {
  const s = size;
  const faces = [
    { transform: `translateZ(${s/2}px)` },
    { transform: `translateZ(-${s/2}px) rotateY(180deg)` },
    { transform: `rotateY(90deg) translateZ(${s/2}px)` },
    { transform: `rotateY(-90deg) translateZ(${s/2}px)` },
    { transform: `rotateX(90deg) translateZ(${s/2}px)` },
    { transform: `rotateX(-90deg) translateZ(${s/2}px)` },
  ];
  return (
    <motion.div
      className={cn("absolute pointer-events-none", className)}
      style={{ width: s, height: s, perspective: 300 }}
      animate={{ y: [0, -12, 0], rotateX: [20, 50, 20], rotateY: [0, 360] }}
      transition={{ y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }, rotateX: { duration: 7, repeat: Infinity, ease: "easeInOut", delay }, rotateY: { duration: speed, repeat: Infinity, ease: "linear", delay } }}
    >
      <div style={{ width: s, height: s, transformStyle: "preserve-3d", position: "relative" }}>
        {faces.map((f, i) => (
          <div key={i} style={{ position: "absolute", width: s, height: s, border: "1px solid rgba(245,158,11,0.15)", ...f, transformStyle: "preserve-3d" }} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Scan line ──────────────────────────────────────────────────────────── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none"
      animate={{ top: ["-2%", "102%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
    />
  );
}

const FEATURES = [
  { icon: Search,        title: "Universal Search",    desc: "Any city, country, or region. Instant risk assessments from live global data across 100+ countries.", tag: "SEARCH"  },
  { icon: Activity,      title: "Real-Time Incidents", desc: "Continuous stream of live events sourced from GDELT and ReliefWeb, filtered by type and recency.",   tag: "FEEDS"   },
  { icon: TrendingUp,    title: "Temporal Trends",     desc: "RSI charted over time. 7-day volatility, drift velocity, and acceleration of geopolitical tension.",  tag: "TRENDS"  },
  { icon: MapPin,        title: "Compare Regions",     desc: "Dual-pane comparison of any two locations. Pin to your watchlist for continuous monitoring.",         tag: "COMPARE" },
  { icon: AlertTriangle, title: "Threat Briefings",    desc: "Auto-generated intelligence briefs summarising the threat landscape for any selected location.",      tag: "AI"      },
  { icon: Radar,         title: "Proximity Radar",     desc: "Visualise nearby risk zones relative to a target. Identify threat corridors before they escalate.",   tag: "RADAR"   },
  { icon: Eye,           title: "Watchlist",           desc: "Save high-priority locations. Monitor their RSI movement across sessions without losing context.",     tag: "WATCH"   },
  { icon: BarChart3,     title: "Risk Leaderboard",    desc: "Global ranking of highest-risk zones updated in real time. Track which regions are accelerating.",    tag: "RANK"    },
];

const STATS = [
  { val: "15 min", label: "Data Refresh Rate",   sub: "GDELT ingestion cycle",              color: "amber"   },
  { val: "100+",   label: "Languages Monitored", sub: "Cross-lingual NLP pipeline",         color: "blue"    },
  { val: "94.2%",  label: "Model Confidence",    sub: "ML ensemble accuracy",               color: "emerald" },
  { val: "4",      label: "Risk Dimensions",     sub: "Kinetic · Policy · Economy · Social", color: "purple"  },
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-[#020617] font-sans selection:bg-amber-500/30 overflow-x-hidden overflow-y-auto snap-y snap-mandatory"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(245,158,11,0.12) transparent" }}
    >
      {/* Scroll bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 z-[100] origin-left" style={{ scaleX }} />

      {/* Fixed background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-[#020617]/85 to-[#020617]" />
        <motion.div animate={{ opacity: [0.04, 0.09, 0.04] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-amber-500 blur-[200px]" />
        <motion.div animate={{ opacity: [0.02, 0.05, 0.02] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/3 -right-60 w-[600px] h-[600px] rounded-full bg-blue-600 blur-[200px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:72px_72px]" />
        <ScanLine />
      </div>

      {/* Navbar */}
      <SiteNavbar />

      <div className="relative z-10 w-full">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="h-screen snap-start flex flex-col justify-between overflow-hidden relative pt-[60px]">

          {/* Far-edge decorators only */}
          <WireDiamond size={64} className="top-[18%] left-[1.5%] opacity-30" delay={0} duration={28} />
          <WireCube   size={32} className="bottom-[28%] left-[1%] opacity-20" delay={2} speed={35} />
          <WireDiamond size={42} className="top-[22%] right-[1.5%] opacity-20" delay={1} duration={22} />

          {/* ── Main grid ── */}
          <div className="flex-1 flex items-center">
            <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-[1fr_1.15fr] gap-8 xl:gap-20 items-center">

              {/* ── LEFT ─────────────────────────────────────────────────── */}
              <motion.div variants={st} initial="hidden" animate="show" className="flex flex-col gap-8">

                {/* Eyebrow */}
                <motion.div variants={up} className="flex items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/25 bg-red-500/[0.07]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <span className="text-[9px] font-black text-red-400/80 uppercase tracking-[0.45em]">Live Intelligence</span>
                  </div>
                  <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.02]">
                    <span className="text-[9px] font-black text-white/28 uppercase tracking-[0.4em]">v4.0 Alpha</span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={up} className="space-y-1">
                  <h1 className="font-black uppercase leading-[0.84] tracking-[-0.045em]">
                    <span className="block text-[72px] sm:text-[88px] lg:text-[96px] xl:text-[112px] text-white">
                      KNOW
                    </span>
                    <span
                      className="block text-[72px] sm:text-[88px] lg:text-[96px] xl:text-[112px] text-transparent bg-clip-text"
                      style={{ backgroundImage: "linear-gradient(115deg, #fde68a 0%, #f59e0b 38%, #92400e 100%)" }}
                    >
                      THE RISK.
                    </span>
                  </h1>
                  <div className="flex items-center gap-3 pt-3">
                    <div className="h-px w-12 bg-amber-500/20" />
                    <span className="text-[8px] font-mono text-white/15 uppercase tracking-[0.4em]">Geopolitical Intelligence Platform</span>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.p variants={up} className="text-[14px] text-slate-400/85 leading-[1.8] max-w-[430px]">
                  Search any city or country. Get a real-time risk score powered by live GDELT feeds, UN incident data, and a neural ML ensemble — updated every 15 minutes.
                </motion.p>

                {/* CTAs */}
                <motion.div variants={up} className="flex items-center gap-3 flex-wrap">
                  <Link href="/">
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 0 64px rgba(245,158,11,0.28)" }}
                      whileTap={{ scale: 0.97 }}
                      className="group inline-flex items-center gap-2.5 h-[52px] px-9 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-[11px] shadow-[0_0_48px_rgba(245,158,11,0.2)] hover:bg-amber-400 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      Launch Intelligence App
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </motion.button>
                  </Link>
                  <Link href="/docs">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center h-[52px] px-7 rounded-xl border border-white/[0.08] text-white/45 font-semibold uppercase tracking-wider text-[11px] hover:border-white/14 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                    >
                      Documentation
                    </motion.button>
                  </Link>
                </motion.div>

                {/* Data sources — icon row */}
                <motion.div variants={up} className="flex items-center gap-4">
                  <span className="text-[7.5px] font-black text-white/12 uppercase tracking-[0.35em] shrink-0">Sources</span>
                  <div className="h-3 w-px bg-white/[0.08]" />
                  {[
                    { icon: Database, name: "GDELT" },
                    { icon: Globe,    name: "ReliefWeb" },
                    { icon: Cpu,      name: "ML Engine" },
                  ].map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 opacity-35 hover:opacity-60 transition-opacity cursor-default">
                      <s.icon className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-wide">{s.name}</span>
                    </div>
                  ))}
                </motion.div>

              </motion.div>

              {/* ── RIGHT — Globe ────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex items-center justify-center relative"
                style={{ minHeight: 520 }}
              >
                {/* Layered ambient glow */}
                <div className="absolute w-[560px] h-[560px] rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(15,50,170,0.14) 0%, transparent 62%)", filter: "blur(55px)" }} />
                <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 68%)", filter: "blur(32px)" }} />

                {/* Corner brackets — slow breathing pulse */}
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-4 pointer-events-none"
                >
                  {[
                    "top-0 left-0 border-t-2 border-l-2",
                    "top-0 right-0 border-t-2 border-r-2",
                    "bottom-0 left-0 border-b-2 border-l-2",
                    "bottom-0 right-0 border-b-2 border-r-2",
                  ].map((cls, i) => (
                    <div key={i} className={cn("absolute w-9 h-9 border-amber-400/50", cls)} />
                  ))}
                </motion.div>

                {/* Orbital rings */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[490px] h-[490px] rounded-full border border-dashed border-amber-400/[0.07] pointer-events-none" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[400px] h-[400px] rounded-full border border-dotted border-blue-400/[0.05] pointer-events-none" />

                {/* Globe label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-none z-10">
                  <div className="h-px w-10 bg-amber-400/15" />
                  <span className="text-[6.5px] font-black uppercase tracking-[0.45em] text-amber-400/25">CRZP · INTEL GLOBE</span>
                  <div className="h-px w-10 bg-amber-400/15" />
                </div>

                <Globe3D size={456} />

                {/* Chip 1 — Crisis alert (top-left) */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-[13%] -left-16"
                >
                  <div className="px-4 py-3 rounded-2xl border border-red-500/20 backdrop-blur-2xl min-w-[138px]"
                    style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.04) 100%)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      <span className="text-[7px] font-black text-red-400/55 uppercase tracking-[0.25em]">Active Crisis</span>
                    </div>
                    <div className="text-[17px] font-black text-red-300 font-mono leading-none tracking-tight">Syria · 97</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="h-0.5 flex-1 rounded-full bg-red-500/15">
                        <div className="h-full w-[97%] rounded-full bg-red-500/50" />
                      </div>
                      <span className="text-[6px] text-red-400/35 font-mono uppercase tracking-widest">CRITICAL</span>
                    </div>
                  </div>
                </motion.div>

                {/* Chip 2 — ML confidence (right) */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="absolute top-[38%] -right-18"
                >
                  <div className="px-4 py-3 rounded-2xl border border-emerald-500/18 backdrop-blur-2xl min-w-[128px]"
                    style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.03) 100%)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Cpu className="w-2.5 h-2.5 text-emerald-400/55" />
                      <span className="text-[7px] font-black text-emerald-400/55 uppercase tracking-[0.25em]">ML Engine</span>
                    </div>
                    <div className="text-[17px] font-black text-emerald-300 font-mono leading-none tracking-tight">94.2%</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="h-0.5 flex-1 rounded-full bg-emerald-500/15">
                        <div className="h-full w-[94%] rounded-full bg-emerald-500/45" />
                      </div>
                      <span className="text-[6px] text-emerald-400/35 font-mono uppercase tracking-widest">CONF</span>
                    </div>
                  </div>
                </motion.div>

                {/* Chip 3 — Flagged zones (bottom-right) */}
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute bottom-[20%] -right-14"
                >
                  <div className="px-4 py-3 rounded-2xl border border-amber-400/18 backdrop-blur-2xl min-w-[122px]"
                    style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.03) 100%)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity className="w-2.5 h-2.5 text-amber-400/55" />
                      <span className="text-[7px] font-black text-amber-400/55 uppercase tracking-[0.25em]">Flagged</span>
                    </div>
                    <div className="text-[17px] font-black text-amber-300 font-mono leading-none tracking-tight">24 Zones</div>
                    <div className="text-[6px] text-amber-400/30 font-mono mt-1.5 uppercase tracking-widest">Worldwide</div>
                  </div>
                </motion.div>

                {/* Coordinate footer */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
                  <span className="text-[6px] font-mono text-white/12 uppercase tracking-widest">LAT 20.0°</span>
                  <span className="text-white/8">·</span>
                  <span className="text-[6px] font-mono text-white/12 uppercase tracking-widest">LON −20.0°</span>
                  <span className="text-white/8">·</span>
                  <span className="text-[6px] font-mono text-amber-400/20 uppercase tracking-widest">AUTO-SPIN</span>
                </div>
              </motion.div>

            </div>
          </div>

          {/* ── Proof bar — full width, above scroll hint ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 border-t border-white/[0.05] bg-white/[0.015] backdrop-blur-sm"
          >
            <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
              <div className="flex items-stretch divide-x divide-white/[0.05]">
                {[
                  { val: "100+",   label: "Countries Covered",   color: "text-white" },
                  { val: "15 min", label: "Data Refresh Cycle",  color: "text-amber-400" },
                  { val: "94.2%",  label: "ML Model Accuracy",   color: "text-emerald-400" },
                  { val: "24",     label: "Active Crisis Zones",  color: "text-red-400" },
                  { val: "4",      label: "Risk Dimensions",      color: "text-blue-400" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 flex flex-col items-center justify-center py-4 px-3 gap-1 group">
                    <span className={cn("text-[20px] font-black tabular-nums leading-none tracking-tight", s.color)}>{s.val}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.18em] text-center leading-tight group-hover:text-white/35 transition-colors">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}
            className="absolute bottom-[68px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/12 pointer-events-none"
          >
            <span className="text-[7px] font-bold uppercase tracking-[0.55em]">Scroll</span>
            <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>

          {/* Section fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #020617)" }} />
        </section>

        {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
        <section className="min-h-screen snap-start flex flex-col justify-center py-20 relative overflow-hidden">
          {/* 3D background elements */}
          <WireDiamond size={120} className="top-10 right-[5%]" delay={0} duration={35} />
          <WireCube size={60} className="bottom-20 left-[3%]" delay={2} speed={30} />

          <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={st} className="space-y-4">
              <motion.div variants={up} className="flex items-center gap-4">
                <div className="h-px w-10 bg-amber-500/25" />
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.55em]">Platform Capabilities</span>
              </motion.div>
              <motion.div variants={up}>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                  Everything you need
                </h2>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  to read the world.
                </h2>
              </motion.div>
              <motion.p variants={up} className="text-slate-500 text-sm max-w-md leading-relaxed">
                A full-stack intelligence dashboard — live incident feeds, AI-generated threat briefings, and a real-time global risk leaderboard.
              </motion.p>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={st}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map(f => (
                <motion.div key={f.title} variants={up}
                  className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all duration-500 cursor-default"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/0 group-hover:border-amber-500/35 transition-colors duration-500" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/0 group-hover:border-amber-500/35 transition-colors duration-500" />
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/12 group-hover:bg-amber-500/15 transition-colors">
                        <f.icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-[8px] font-black text-white/12 group-hover:text-amber-500/35 uppercase tracking-widest font-mono transition-colors">{f.tag}</span>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-white/85 group-hover:text-white transition-colors mb-2">{f.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed group-hover:text-slate-500 transition-colors">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ STATS ══════════════════════════════════════════════════════════ */}
        <section className="h-screen snap-start flex flex-col justify-center bg-[#010411] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.025),transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:52px_52px] opacity-30 pointer-events-none" />
          <WireDiamond size={100} className="top-[10%] right-[6%]" delay={1} duration={28} />
          <WireCube size={55} className="bottom-[15%] left-[4%]" delay={0} speed={22} />

          <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14 relative z-10">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={st} className="text-center space-y-4">
              <motion.div variants={up} className="flex items-center justify-center gap-4">
                <div className="h-px w-10 bg-amber-500/20" />
                <span className="px-5 py-1.5 rounded border border-amber-500/15 bg-amber-500/5 text-amber-500 text-[9px] font-black uppercase tracking-[0.5em]">Intelligence Metrics</span>
                <div className="h-px w-10 bg-amber-500/20" />
              </motion.div>
              <motion.h2 variants={up} className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">Built on real data.</motion.h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={st}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((s, i) => (
                <motion.div key={s.label} variants={up}
                  className="group relative p-8 border border-white/[0.05] hover:border-amber-500/20 transition-all duration-700 bg-white/[0.01]"
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/8 group-hover:border-amber-500/40 transition-colors duration-500" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/8 group-hover:border-amber-500/40 transition-colors duration-500" />
                  <div className="space-y-5">
                    <div className={cn("text-5xl md:text-6xl font-black tabular-nums tracking-tighter",
                      s.color === "amber" ? "text-amber-400" : s.color === "blue" ? "text-blue-400" : s.color === "emerald" ? "text-emerald-400" : "text-purple-400")}>
                      {s.val}
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{s.label}</div>
                      <div className="h-px w-full bg-white/5">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }}
                          transition={{ duration: 1.4, delay: 0.3 + i * 0.08 }}
                          className={cn("h-full", s.color === "amber" ? "bg-amber-500" : s.color === "blue" ? "bg-blue-500" : s.color === "emerald" ? "bg-emerald-500" : "bg-purple-500")} />
                      </div>
                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{s.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section className="min-h-screen snap-start flex flex-col justify-center py-24 relative overflow-hidden">
          <WireDiamond size={70} className="top-[8%] left-[4%]" delay={2} duration={25} />
          <WireCube size={45} className="bottom-[12%] right-[5%]" delay={1} speed={35} />

          <div className="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={st} className="space-y-4">
              <motion.div variants={up} className="flex items-center gap-4">
                <div className="h-px w-10 bg-amber-500/20" />
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.55em]">Workflow</span>
              </motion.div>
              <motion.div variants={up}>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">How it works.</h2>
              </motion.div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={st}
              className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "01", icon: Search, title: "Search a location", desc: "Type any city, country, or region. CRZP queries live global databases in real time." },
                { step: "02", icon: Brain,  title: "AI analyses the data", desc: "The ML ensemble processes GDELT feeds, UN incident reports, and sentiment signals to compute a Risk Score." },
                { step: "03", icon: Shield, title: "Receive your brief", desc: "A full intelligence dashboard: Risk Score, live incidents, trend charts, proximity radar, and an AI threat briefing." },
              ].map((step, i) => (
                <motion.div key={step.step} variants={up}
                  className="relative group p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-amber-500/20 transition-all duration-400"
                  whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-6 h-px bg-gradient-to-r from-amber-500/25 to-transparent z-10" />
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/12">
                      <step.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-6xl font-black text-white/30 group-hover:text-amber-500/40 transition-colors font-mono">{step.step}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight mb-3">{step.title}</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ CTA ══════════════════════════════════════════════════════════ */}
        <section className="h-screen snap-start flex flex-col items-center justify-center relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.055),transparent_60%)] pointer-events-none" />

          {/* Rotating orbital rings */}
          {[85, 60, 38].map((pct, i) => (
            <motion.div key={i} animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 55 + i * 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-amber-500/8 pointer-events-none"
              style={{ width: `${pct}vw`, height: `${pct}vw` }} />
          ))}

          {/* 3D elements in CTA */}
          <WireDiamond size={80}  className="top-[12%] left-[8%]"   delay={0} duration={20} />
          <WireCube   size={45}  className="top-[15%] right-[10%]"  delay={2} speed={25} />
          <WireDiamond size={50}  className="bottom-[20%] right-[7%]" delay={1} duration={30} />

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/[0.02] pointer-events-none" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-white/[0.02] pointer-events-none" />

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={st}
            className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 text-center space-y-10">
            <motion.div variants={up} className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.45em]">Ready For Deployment</span>
            </motion.div>

            <motion.div variants={up}>
              <h3 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
                INITIALIZE
              </h3>
              <h3 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none text-amber-500">
                COMMAND.
              </h3>
            </motion.div>

            <motion.p variants={up} className="text-slate-600 text-sm font-mono tracking-widest max-w-sm mx-auto">
              Intelligence architecture ready. Access the full platform now.
            </motion.p>

            <motion.div variants={up} className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500/12 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />
              <Link href="/">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button className="relative z-10 h-20 px-20 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] rounded-none text-sm border-2 border-black transition-all">
                    Launch App
                    <div className="absolute top-0 right-0 w-2 h-2 bg-black -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 bg-black translate-y-1/2 -translate-x-1/2" />
                  </Button>
                </motion.div>
              </Link>
              <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
              <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500" />
            </motion.div>
          </motion.div>

          <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur-3xl border-t border-white/5">
            <SiteFooter />
          </div>
        </section>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </div>
  );
}
