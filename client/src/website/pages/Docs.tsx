import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/website/components/SiteFooter";
import {
  Book, ChevronRight, ChevronLeft,
  Cpu, Shield, Zap, Layers,
  Search, Activity, Database, Globe,
  ShieldAlert, Target,
  TrendingUp, MapPin, Eye, BarChart3,
  AlertTriangle, Brain, ArrowRight, Copy, Check,
  GitBranch, Github, Twitter, ExternalLink, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Group structure — nav = 6 groups, each group = 1 page ─────────────── */
const GROUPS = [
  { id: "getting-started",   title: "Getting Started",   icon: Book,     items: ["What is CRZP APEX?", "Quick Start Guide", "Core Concepts"] },
  { id: "risk-intelligence", title: "Risk Intelligence", icon: Shield,   items: ["Risk Score (RSI)", "RSI Formula", "Risk Dimensions", "Temporal Analysis", "Anomaly Detection"] },
  { id: "platform-features", title: "Platform Features", icon: Layers,   items: ["Location Search", "Risk Overview", "Incidents Feed", "Trends & Charts", "Compare Mode", "Watchlist", "Risk Leaderboard", "Proximity Radar", "Threat Briefing"] },
  { id: "data-ml",           title: "Data & ML",         icon: Cpu,      items: ["Data Sources", "ML Engine", "Ingress Pipeline"] },
  { id: "api-reference",     title: "API Reference",     icon: Database, items: ["Overview", "Location Search", "Risk Assessment", "Incidents", "Trends"] },
  { id: "about",             title: "About",             icon: User,     items: ["Founder"] },
];

/* ── Shared micro-components ────────────────────────────────────────────── */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-10">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-5 h-px bg-amber-500/50" />
      <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em]">{children}</span>
    </div>
  );
}

function SHead({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl lg:text-[2.4rem] font-black text-white tracking-tight leading-tight">{children}</h2>
      {sub && <p className="text-slate-400 text-[15px] leading-relaxed mt-3 max-w-2xl">{sub}</p>}
    </div>
  );
}

function ICard({ icon: Icon, title, desc, color = "amber" }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; color?: "amber"|"blue"|"emerald"|"red"|"purple" }) {
  const c = { amber:"bg-amber-500/8 border-amber-500/20 text-amber-400", blue:"bg-blue-500/8 border-blue-500/20 text-blue-400", emerald:"bg-emerald-500/8 border-emerald-500/20 text-emerald-400", red:"bg-red-500/8 border-red-500/20 text-red-400", purple:"bg-purple-500/8 border-purple-500/20 text-purple-400" }[color];
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 transition-all space-y-3">
      <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", c)}><Icon className="w-4 h-4" /></div>
      <h5 className="text-[13px] font-bold text-white/90">{title}</h5>
      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function CBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] mb-5">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/40" /><div className="w-2 h-2 rounded-full bg-yellow-500/40" /><div className="w-2 h-2 rounded-full bg-green-500/40" /></div>
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest ml-1">{lang}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[8px] text-white/25 hover:text-white/60 transition-colors font-mono uppercase tracking-widest">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-[12px] font-mono text-amber-300/80 leading-relaxed bg-black/60 whitespace-pre-wrap"><code>{code}</code></pre>
    </div>
  );
}

function Badge({ children, color = "amber" }: { children: React.ReactNode; color?: "amber"|"green"|"blue"|"red" }) {
  const c = { amber:"bg-amber-500/10 text-amber-400 border-amber-500/20", green:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20", blue:"bg-blue-500/10 text-blue-400 border-blue-500/20", red:"bg-red-500/10 text-red-400 border-red-500/20" }[color];
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", c)}>{children}</span>;
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const mc = method === "GET" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/15 transition-all">
      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded border font-mono tracking-widest self-start flex-shrink-0", mc)}>{method}</span>
      <code className="font-mono text-[12px] text-white/70 flex-1 break-all">{path}</code>
      <span className="text-[11px] text-slate-600 flex-shrink-0">{desc}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GROUP PAGES — each group = one page with all subtopics
══════════════════════════════════════════════════════════════════════════ */

function PageGettingStarted() {
  return (
    <div>
      {/* ── What is CRZP APEX? ── */}
      <SLabel>01 · Introduction</SLabel>
      <SHead children="What is CRZP APEX?" sub="A real-time geopolitical intelligence platform that monitors, scores, and visualises political instability across any location on Earth — powered by live data and machine learning." />
      <div className="p-6 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-transparent mb-6">
        <p className="text-amber-200/70 italic text-base font-serif leading-relaxed">
          "Predicting the event is the standard. Identifying the microscopic shift that makes the event inevitable — that is our protocol."
        </p>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed mb-7">
        Historically, high-fidelity geopolitical risk intelligence was the exclusive domain of sovereign intelligence agencies and billion-dollar hedge funds. CRZP democratises access to this layer — giving researchers, journalists, analysts, NGOs, and security professionals the same signal quality, in real time, in a single browser tab.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <ICard icon={Globe}  title="Global Coverage"    desc="Monitor any city, region, or country worldwide. No geographic restrictions." />
        <ICard icon={Zap}    title="Real-Time Data"     desc="GDELT global news ingested every 15 minutes across 100+ languages." color="blue" />
        <ICard icon={Brain}  title="AI-Powered Scoring" desc="Multi-model ML ensemble combining gradient boosting, LSTM, and transformers." color="purple" />
        <ICard icon={Shield} title="Open Methodology"   desc="Full transparency on how every Risk Score is computed — no black boxes." color="emerald" />
      </div>

      <Divider label="Quick Start Guide" />

      {/* ── Quick Start ── */}
      <SLabel>02 · Quick Start</SLabel>
      <SHead children="Up in 30 seconds" sub="No account required. Open the app and start querying immediately." />
      <div className="space-y-3 mb-4">
        {[
          { n:"01", title:"Open the Intelligence App",  desc:"Navigate to the app from the homepage or the Launch App button. The dashboard loads immediately." },
          { n:"02", title:"Search any location",        desc:"Use the search bar at the top. Type a city name, country, or region — suggestions appear instantly." },
          { n:"03", title:"Read the Risk Score",        desc:"The large coloured score (0–100) is your Risk Score Index. Green = low risk, Amber = elevated, Red = high risk." },
          { n:"04", title:"Explore the tabs",           desc:"Switch between Overview, Incidents, and Trends. Use Compare Mode to analyse two locations side by side." },
          { n:"05", title:"Save to Watchlist",          desc:"Click the bookmark icon on any location to add it to your Watchlist for continuous monitoring." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:border-amber-500/15 transition-all">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-black text-amber-400 font-mono">{step.n}</span>
            </div>
            <div>
              <h5 className="text-[13px] font-bold text-white mb-1">{step.title}</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider label="Core Concepts" />

      {/* ── Core Concepts ── */}
      <SLabel>03 · Core Concepts</SLabel>
      <SHead children="Key terms explained" sub="A glossary of terminology used throughout the platform and this documentation." />
      <div className="space-y-2.5">
        {[
          { term:"Risk Score Index (RSI)", def:"A 0–100 score representing overall geopolitical instability for a location at a given moment. Higher = more unstable." },
          { term:"Risk Dimension",         def:"One of four weighted sub-categories composing the RSI: Kinetic Tension, Policy Resilience, Economic Friction, and Social Cohesion." },
          { term:"Temporal Drift",         def:"The rate of change in RSI over time. Rising drift velocity means a location is accelerating toward instability." },
          { term:"Incident",               def:"A discrete reported event (conflict, protest, disaster) sourced from GDELT or ReliefWeb and linked to a geographic location." },
          { term:"Sentiment Signal",       def:"An NLP-derived score from media reporting that measures emotional polarity — calm vs alarmed — in coverage of a region." },
          { term:"Anomaly",                def:"A sudden, statistically significant deviation in RSI from the 90-day rolling baseline for that location, exceeding +2σ." },
          { term:"Watchlist",              def:"A personal list of locations you are monitoring, saved in your browser and accessible via the Watchlist drawer." },
        ].map(({ term, def }) => (
          <div key={term} className="flex gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="w-1 bg-amber-500/25 rounded-full flex-shrink-0 self-stretch" />
            <div>
              <span className="text-[12px] font-bold text-amber-400/80 font-mono">{term}</span>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{def}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageRiskIntelligence() {
  return (
    <div>
      {/* ── Risk Scoring ── */}
      <SLabel>01 · Risk Score Index</SLabel>
      <SHead children="Risk Score Index (RSI)" sub="A single number from 0 to 100 representing geopolitical instability, computed every 15 minutes using four weighted dimensions." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { label:"Kinetic Tension",   weight:"45%", color:"text-red-400",     bar:"bg-red-500",     desc:"Military mobilisation, cross-border skirmishes, armed group activity, and conflict escalation indicators." },
          { label:"Policy Resilience", weight:"25%", color:"text-blue-400",    bar:"bg-blue-500",    desc:"Governmental stability, election integrity, coup risk, and bureaucratic continuity scoring." },
          { label:"Economic Friction", weight:"15%", color:"text-amber-400",   bar:"bg-amber-500",   desc:"Asset volatility, supply chain disruption, currency stress, sanctions pressure, and inflationary trends." },
          { label:"Social Cohesion",   weight:"15%", color:"text-emerald-400", bar:"bg-emerald-500", desc:"Civil unrest potential, sentiment polarity, ethnic/sectarian tension markers, and protest density mapping." },
        ].map(item => (
          <div key={item.label} className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-amber-500/15 transition-all">
            <div className="flex justify-between items-center mb-2">
              <h5 className={cn("text-[13px] font-bold", item.color)}>{item.label}</h5>
              <Badge color="amber">{item.weight}</Badge>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{item.desc}</p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: item.weight }} transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full opacity-50", item.bar)} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[["0–25","Low","green"],["25–50","Moderate","amber"],["50–75","High","red"],["75–100","Critical","red"]].map(([r,l,c]) => (
          <div key={r} className={cn("px-4 py-3 rounded-xl border text-center", c === "green" ? "border-emerald-500/20 bg-emerald-500/5" : c === "amber" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5")}>
            <div className={cn("text-xl font-black font-mono", c === "green" ? "text-emerald-400" : c === "amber" ? "text-amber-400" : "text-red-400")}>{r}</div>
            <div className="text-[10px] font-bold text-white/45 uppercase tracking-widest mt-1">{l}</div>
          </div>
        ))}
      </div>

      <Divider label="RSI Formula" />

      {/* ── Formula ── */}
      <SLabel>02 · Scientific Specification</SLabel>
      <SHead children="RSI Formula" sub="Weighted summation across four dimensions, plus a temporal acceleration term that captures the velocity of change." />
      <CBlock lang="formula" code={`RSI = ∑ (Wᵢ × Dᵢ) + λ × (ΔD / Δt)

Where:
  Wᵢ     =  Weight per dimension
             { Kinetic: 0.45, Policy: 0.25, Economic: 0.15, Social: 0.15 }
  Dᵢ     =  Normalised dimension intensity  [0, 100]
  λ      =  Entropy acceleration constant  (κ = 0.42)
  ΔD/Δt  =  Rate of change per 15-minute window
             positive → accelerating instability
             negative → de-escalation
Output:  RSI ∈ [0, 100]  (clamped)`} />
      <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.01] mb-4">
        <h5 className="text-[13px] font-bold text-white mb-2">Why the temporal term matters</h5>
        <p className="text-[12px] text-slate-500 leading-relaxed">The λ term ensures that a location rapidly deteriorating — even from a low baseline — scores higher than a static high-risk zone. It captures <strong className="text-white/60">momentum</strong>, not just state. A region jumping from RSI 30 to RSI 55 in 24 hours is more alarming than one that has been at RSI 60 for months.</p>
      </div>

      <Divider label="Risk Dimensions" />

      {/* ── Dimensions ── */}
      <SLabel>03 · Sub-Signal Breakdown</SLabel>
      <SHead children="Risk Dimensions" sub="Each dimension is computed from multiple sub-signals across live data sources." />
      <div className="space-y-4 mb-4">
        {[
          { dim:"Kinetic Tension", color:"text-red-400", sigs:["Armed conflict event density (GDELT CAMEO codes)","Military movement & mobilisation signals","Cross-border skirmish frequency","Weapon seizure & trafficking indicators","Territorial dispute activity index"] },
          { dim:"Policy Resilience", color:"text-blue-400", sigs:["Government stability composite (World Bank)","Election integrity & contested outcome risk","Legislative dysfunction & gridlock score","Coup & leadership transition probability","International treaty adherence index"] },
          { dim:"Economic Friction", color:"text-amber-400", sigs:["Currency volatility & devaluation pressure","Sovereign debt distress signals","Trade route disruption indicators","Sanctions exposure score","Supply chain fragility index"] },
          { dim:"Social Cohesion", color:"text-emerald-400", sigs:["Protest & civil unrest event density","Ethnic & sectarian tension markers","Media sentiment polarity (NLP-derived)","Refugee & displacement flow tracking","Internet & communications freedom index"] },
        ].map(d => (
          <div key={d.dim} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
            <h5 className={cn("text-[13px] font-bold mb-3", d.color)}>{d.dim}</h5>
            <div className="flex flex-wrap gap-2">
              {d.sigs.map(s => <span key={s} className="px-3 py-1 rounded-full text-[10px] font-mono text-slate-500 bg-white/[0.03] border border-white/[0.05]">{s}</span>)}
            </div>
          </div>
        ))}
      </div>

      <Divider label="Temporal Analysis" />

      {/* ── Temporal ── */}
      <SLabel>04 · Time-Series Analysis</SLabel>
      <SHead children="Temporal Analysis" sub="CRZP tracks how a location's score changes over time, computing drift velocity against a 90-day rolling baseline." />
      <div className="p-6 rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[["Baseline Window","90 days","Rolling mean used as the stability reference"],["Refresh Interval","15 min","Frequency of new data ingestion and scoring"],["Trend Resolution","7 days","Granularity of the trends chart in-app"]].map(([l,v,d]) => (
            <div key={l} className="p-4 rounded-xl bg-black/30 border border-white/[0.05]">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">{l}</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">{v}</div>
              <div className="text-[9px] text-slate-600 mt-1">{d}</div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed">The temporal drift (ΔD/Δt) feeds directly into the RSI formula — a rapidly accelerating score carries extra weight. A positive drift value means the situation is worsening; negative means de-escalation.</p>
      </div>

      <Divider label="Anomaly Detection" />

      {/* ── Anomaly ── */}
      <SLabel>05 · Statistical Deviation</SLabel>
      <SHead children="Anomaly Detection" sub="Identifies statistically significant RSI deviations — often catching emerging crises 24–72 hours before mainstream coverage." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">An anomaly is flagged when RSI deviates by more than <code className="text-amber-400">+2σ</code> from the 90-day rolling mean in a single 15-minute window, using Z-score normalisation on the composite RSI time-series.</p>
      <CBlock lang="logic" code={`anomaly_threshold = μ₉₀ + 2σ₉₀

If RSI_current > anomaly_threshold:
    → Flag anomaly
    → Surface in Incidents feed  [REALTIME label]
    → Boost in Risk Leaderboard

Where:
    μ₉₀  =  90-day rolling mean RSI for location
    σ₉₀  =  90-day rolling standard deviation`} />
    </div>
  );
}

function PagePlatformFeatures() {
  return (
    <div>
      {/* ── Search ── */}
      <SLabel>01 · Input Layer</SLabel>
      <SHead children="Location Search" sub="The universal search bar accepts any city name, country, or geographic region. Results are returned instantly from the location index." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Type at least 2 characters to trigger live suggestions. The backend location resolution API normalises names across languages and aliases.</p>
      <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] mb-4">
        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Example queries</div>
        {["Gaza","Ukraine","Sahel region","Taiwan Strait","Kashmir","Nagorno-Karabakh"].map(q => (
          <div key={q} className="flex items-center gap-3 py-1.5">
            <Search className="w-3 h-3 text-amber-500/35 flex-shrink-0" />
            <span className="font-mono text-[12px] text-slate-400">{q}</span>
          </div>
        ))}
      </div>

      <Divider label="Risk Overview" />

      {/* ── Overview Tab ── */}
      <SLabel>02 · Primary Intelligence View</SLabel>
      <SHead children="Risk Overview Tab" sub="The main dashboard for any location — Risk Score, dimension breakdown, live statistics, and the AI-generated summary." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <ICard icon={Target}    title="Risk Score Gauge"  desc="0–100 indicator with colour coding (green/amber/red) and a model confidence percentage." />
        <ICard icon={BarChart3} title="Dimension Bars"    desc="Four sub-score bars — Kinetic, Policy, Economic, Social — with their weighted contribution visible." color="blue" />
        <ICard icon={Activity}  title="Live Statistics"   desc="Incident count, peak risk period, 24h change delta, and data source attribution." color="emerald" />
        <ICard icon={Brain}     title="AI Summary"        desc="2–3 sentence plain-English summary of the current threat landscape, auto-generated from live data." color="purple" />
      </div>

      <Divider label="Incidents Feed" />

      {/* ── Incidents ── */}
      <SLabel>03 · Event Stream</SLabel>
      <SHead children="Incidents Feed" sub="Chronological feed of all reported events linked to the selected location, with three filter modes." />
      <div className="flex flex-wrap gap-3 mb-4">
        <Badge color="amber">All Incidents</Badge>
        <Badge color="red">Realtime Only</Badge>
        <Badge color="blue">Past Events</Badge>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed mb-4"><Badge color="red">REALTIME</Badge> events are freshly ingested GDELT signals from the last 15-minute window. Past events are archival incidents from ReliefWeb and the historical GDELT corpus. Each card shows title, source, timestamp, category, and relevance score.</p>
      <div className="p-5 rounded-2xl border border-white/[0.06] bg-black/30 mb-4">
        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Incident categories</div>
        <div className="flex flex-wrap gap-2">
          {["CONFLICT","PROTEST","HUMANITARIAN","NATURAL DISASTER","POLITICAL","ECONOMIC","SECURITY"].map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded text-[9px] font-black font-mono text-white/30 border border-white/[0.07]">{tag}</span>
          ))}
        </div>
      </div>

      <Divider label="Trends & Charts" />

      {/* ── Trends ── */}
      <SLabel>04 · Temporal View</SLabel>
      <SHead children="Trends & Charts" sub="7-day RSI time-series chart with daily resolution and anomaly highlighting." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Anomalous days are marked with a red reference line. The chart also shows whether the trajectory is accelerating or de-escalating based on ΔD/Δt. Positive drift = worsening situation.</p>

      <Divider label="Compare Mode" />

      {/* ── Compare ── */}
      <SLabel>05 · Dual Intelligence</SLabel>
      <SHead children="Compare Mode" sub="Analyse two locations simultaneously — ideal for understanding relative risk, regional spillover, or operational prioritisation." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Activate via the Compare button in the toolbar. A second location search bar appears. Both locations render full Overview tabs side by side with a delta indicator showing which is more volatile.</p>

      <Divider label="Watchlist" />

      {/* ── Watchlist ── */}
      <SLabel>06 · Persistent Monitoring</SLabel>
      <SHead children="Watchlist" sub="Save locations for ongoing monitoring. Persists in browser local storage across sessions." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Click the bookmark icon on any location. Open the Watchlist drawer via the flag icon in the navigation bar. The drawer shows all saved locations with current RSI — click any to reload that profile.</p>

      <Divider label="Risk Leaderboard" />

      {/* ── Leaderboard ── */}
      <SLabel>07 · Global Rankings</SLabel>
      <SHead children="Risk Leaderboard" sub="The highest-risk active zones globally, ranked by RSI and updated in real time." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Access via the trophy icon in the toolbar. Entries with an upward arrow indicate rising drift velocity — these represent accelerating instability, not just chronic high-risk zones. Click any entry to load its full dashboard.</p>

      <Divider label="Proximity Radar" />

      {/* ── Radar ── */}
      <SLabel>08 · Regional Mapping</SLabel>
      <SHead children="Proximity Radar" sub="Visualises nearby high-risk zones relative to the currently selected location — helping identify regional spillover and threat corridors." />
      <p className="text-slate-400 text-sm leading-relaxed mb-5">Rendered as a polar chart using Recharts. Surrounding regions are plotted at relative compass bearings and distances, with RSI encoded as radial magnitude. A high-risk neighbour at close range is a strong spillover signal.</p>

      <Divider label="Threat Briefing" />

      {/* ── Briefing ── */}
      <SLabel>09 · AI Narrative</SLabel>
      <SHead children="Threat Briefing" sub="AI-synthesised narrative summarising the current threat environment for a location, in plain intelligence-report prose." />
      <p className="text-slate-400 text-sm leading-relaxed">Generated by the ML engine using the incident feed, RSI dimension scores, and historical baseline context. Covers active threats, contributing factors, trend direction, and recommended monitoring posture. Refreshes automatically when location data updates.</p>
    </div>
  );
}

function PageDataML() {
  return (
    <div>
      {/* ── Data Sources ── */}
      <SLabel>01 · Ingestion Sources</SLabel>
      <SHead children="Data Sources" sub="CRZP ingests from two primary global data sources, processed through a real-time NLP pipeline before ML scoring." />
      <div className="space-y-5 mb-4">
        <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.01] space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><Database className="w-5 h-5 text-amber-400" /></div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[14px] font-bold text-white">GDELT Project</h5>
              <p className="text-[10px] text-slate-600 font-mono">Global Database of Events, Language, and Tone</p>
            </div>
            <Badge color="green">Live · 15 min</Badge>
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed">Monitors broadcast, print, and online news media in 100+ languages across every country, 24/7. Codes events using the CAMEO taxonomy and provides tone/sentiment scores per article. CRZP ingests GDELT's 15-minute update feed for real-time incident detection.</p>
          <div className="flex flex-wrap gap-2"><Badge color="amber">100+ Languages</Badge><Badge color="amber">CAMEO Event Coding</Badge><Badge color="amber">Tone Scoring</Badge><Badge color="amber">Global Coverage</Badge></div>
        </div>
        <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.01] space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"><ShieldAlert className="w-5 h-5 text-blue-400" /></div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[14px] font-bold text-white">ReliefWeb / UN OCHA</h5>
              <p className="text-[10px] text-slate-600 font-mono">Office for the Coordination of Humanitarian Affairs</p>
            </div>
            <Badge color="blue">Archival · Verified</Badge>
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed">The humanitarian information service of the United Nations. Provides verified, structured reports on crises, disasters, and conflict zones. UN-confirmed events receive elevated weight in the RSI calculation.</p>
          <div className="flex flex-wrap gap-2"><Badge color="blue">UN-Verified</Badge><Badge color="blue">Structured Data</Badge><Badge color="blue">Humanitarian Focus</Badge><Badge color="blue">Historical Archive</Badge></div>
        </div>
      </div>

      <Divider label="ML Engine" />

      {/* ── ML Engine ── */}
      <SLabel>02 · Neural Ensemble</SLabel>
      <SHead children="ML Engine" sub="A multi-model ensemble running on a dedicated Python ML server. No single model — a combination produces more robust predictions." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-3">
          <div className="p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 w-fit"><BarChart3 className="w-4 h-4 text-amber-400" /></div>
          <h5 className="text-[13px] font-bold text-white">Gradient Boosting</h5>
          <p className="text-[11px] text-slate-500 leading-relaxed">XGBoost ensemble trained on 10+ years of historical conflict data. Handles structured tabular features — event counts, frequencies, baseline deviations.</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-3">
          <div className="p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15 w-fit"><GitBranch className="w-4 h-4 text-blue-400" /></div>
          <h5 className="text-[13px] font-bold text-white">LSTM Networks</h5>
          <p className="text-[11px] text-slate-500 leading-relaxed">Long Short-Term Memory networks for temporal pattern recognition. Captures cyclical risk patterns — election seasons, seasonal conflict cycles, escalation spirals.</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-3">
          <div className="p-2.5 rounded-xl bg-purple-500/8 border border-purple-500/15 w-fit"><Brain className="w-4 h-4 text-purple-400" /></div>
          <h5 className="text-[13px] font-bold text-white">Transformer NLP</h5>
          <p className="text-[11px] text-slate-500 leading-relaxed">Transformer-based sentiment analysis on news text. Detects emotional polarity shifts in media coverage before they translate into kinetic events.</p>
        </div>
      </div>
      <p className="text-[12px] text-slate-500 leading-relaxed mb-4">The Python ML server runs independently on port 5001, auto-spawned by the Express backend. All ML inference is server-side — no model weights are exposed to the client.</p>

      <Divider label="Ingress Pipeline" />

      {/* ── Pipeline ── */}
      <SLabel>03 · Data Flow</SLabel>
      <SHead children="Ingress Pipeline" sub="From raw global news to a Risk Score in under 60 seconds — the full data pipeline." />
      <div className="space-y-2.5">
        {[
          { step:"1", label:"Ingest",       desc:"GDELT 15-min update feed pulled. Raw event records parsed from CSV format." },
          { step:"2", label:"Filter",       desc:"Events geo-resolved to location. Events outside the relevance window are discarded." },
          { step:"3", label:"NLP",          desc:"Article tone scores extracted. Transformer model runs sentiment classification on headlines." },
          { step:"4", label:"Feature Eng",  desc:"Event counts, tone averages, CAMEO codes, and temporal deltas computed into feature vectors." },
          { step:"5", label:"ML Score",     desc:"Ensemble runs inference. Gradient boosting + LSTM + transformer outputs averaged." },
          { step:"6", label:"RSI Compute",  desc:"Weighted dimension scores summed with temporal drift term. Final RSI clamped [0, 100]." },
          { step:"7", label:"Cache",        desc:"Score cached by location key. API serves cached response until the next 15-min cycle." },
        ].map((s, i) => (
          <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-black text-amber-400 font-mono">{s.step}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-black text-white/65 uppercase tracking-wider">{s.label}</span>
                {i < 6 && <ArrowRight className="w-3 h-3 text-white/15" />}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageAPIReference() {
  return (
    <div>
      {/* ── Overview ── */}
      <SLabel>01 · API Overview</SLabel>
      <SHead children="API Overview" sub="CRZP exposes a REST API via the Express backend. All endpoints return JSON. No authentication required for development use." />
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-5">
        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Base URL</div>
        <code className="text-amber-400 font-mono text-sm">/api</code>
      </div>
      <div className="space-y-2.5 mb-4">
        <Endpoint method="GET"  path="/api/locations/search?q={query}" desc="Search locations by name" />
        <Endpoint method="GET"  path="/api/risk/{location}"             desc="Get risk assessment" />
        <Endpoint method="GET"  path="/api/incidents/{location}"        desc="Get incident feed" />
        <Endpoint method="GET"  path="/api/trends/{location}"           desc="Get 7-day trend data" />
        <Endpoint method="POST" path="/api/feedback"                    desc="Submit user feedback" />
      </div>

      <Divider label="Location Search" />

      {/* ── Search endpoint ── */}
      <SLabel>02 · Location Search</SLabel>
      <SHead children="GET /api/locations/search" />
      <CBlock lang="request" code={`GET /api/locations/search?q=Gaza

Query Parameters:
  q  (string, required)  —  Search query, minimum 2 characters`} />
      <CBlock lang="response · json" code={`[
  {
    "name":    "Gaza Strip",
    "country": "Palestinian Territories",
    "region":  "Middle East",
    "lat":      31.5,
    "lon":      34.47
  }
]`} />

      <Divider label="Risk Assessment" />

      {/* ── Risk endpoint ── */}
      <SLabel>03 · Risk Assessment</SLabel>
      <SHead children="GET /api/risk/{location}" />
      <CBlock lang="request" code={`GET /api/risk/Ukraine`} />
      <CBlock lang="response · json" code={`{
  "location":    "Ukraine",
  "rsi":          82,
  "confidence":   0.94,
  "level":        "critical",
  "trend":        "rising",
  "drift":        +3.2,
  "dimensions": {
    "kinetic":    78,
    "policy":     65,
    "economic":   71,
    "social":     60
  },
  "summary":      "Active armed conflict in eastern regions...",
  "updated_at":   "2025-05-03T06:30:00Z"
}`} />

      <Divider label="Incidents" />

      {/* ── Incidents endpoint ── */}
      <SLabel>04 · Incidents Feed</SLabel>
      <SHead children="GET /api/incidents/{location}" />
      <CBlock lang="request" code={`GET /api/incidents/Sudan`} />
      <CBlock lang="response · json" code={`{
  "location":  "Sudan",
  "incidents": [
    {
      "id":          "inc_9f3a",
      "title":       "Clashes reported near Khartoum",
      "category":    "CONFLICT",
      "source":      "GDELT",
      "is_realtime": true,
      "severity":    "high",
      "timestamp":   "2025-05-03T05:45:00Z",
      "summary":     "Armed clashes between RSF and SAF..."
    }
  ]
}`} />

      <Divider label="Trends" />

      {/* ── Trends endpoint ── */}
      <SLabel>05 · Trend Data</SLabel>
      <SHead children="GET /api/trends/{location}" />
      <CBlock lang="request" code={`GET /api/trends/Myanmar`} />
      <CBlock lang="response · json" code={`{
  "location": "Myanmar",
  "period":   "7d",
  "series": [
    { "date": "2025-04-27", "rsi": 71, "anomaly": false },
    { "date": "2025-04-28", "rsi": 73, "anomaly": false },
    { "date": "2025-04-29", "rsi": 79, "anomaly": true  },
    { "date": "2025-04-30", "rsi": 81, "anomaly": true  },
    { "date": "2025-05-01", "rsi": 78, "anomaly": false },
    { "date": "2025-05-02", "rsi": 80, "anomaly": false },
    { "date": "2025-05-03", "rsi": 82, "anomaly": true  }
  ],
  "drift": +1.8
}`} />
      <p className="text-[11px] text-slate-600 leading-relaxed">The <code className="text-amber-400">anomaly</code> flag is true when that day's RSI exceeded the 90-day mean by more than 2σ. The <code className="text-amber-400">drift</code> value is the linear slope of the 7-day series.</p>
    </div>
  );
}

/* ── Typewriter hook ────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 38, startDelay = 400) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

/* ── Founder page ───────────────────────────────────────────────────────── */
function PageAbout() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const bio = useTypewriter(
    "Software engineer. Built CRZP APEX to surface geopolitical signal that was previously locked inside institutional intelligence systems. The mission is simple — give anyone access to the same risk picture that state actors and sovereign funds have.",
    26, 700
  );

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.55, delay: 0.12 * i, ease: [0.2, 0, 0.2, 1] },
  });

  return (
    <div ref={ref}>
      <SLabel>About the Founder</SLabel>
      <SHead children="Behind CRZP APEX" sub="Built independently. No VC. No committee. Just signal." />

      {/* ── Main card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.2, 0, 0.2, 1] }}
        className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.025] to-transparent overflow-hidden mb-8"
      >
        {/* Ambient glow behind card */}
        <div className="absolute -inset-px rounded-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 30% 50%, rgba(245,158,11,0.05) 0%, transparent 70%)" }} />

        {/* Corner bracket decorations */}
        {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos, bdr]) => (
          <div key={pos} className={cn("absolute w-5 h-5 border-amber-500/30 pointer-events-none", pos, bdr)} />
        ))}

        <div className="relative flex flex-col md:flex-row gap-0">

          {/* ── Photo panel ── */}
          <div className="md:w-64 flex-shrink-0 relative overflow-hidden">
            {/* Red tint background matching the photo vibe */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black/80 to-[#03060e]" />

            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.2, 0, 0.2, 1] }}
              className="relative p-8 md:py-10 flex items-center justify-center md:h-full min-h-[220px]"
            >
              {/* Photo container with glitch-border effect */}
              <div className="relative group">
                {/* Animated scan line over photo */}
                <motion.div
                  className="absolute inset-0 z-20 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(245,158,11,0.07) 50%, transparent 55%)" }}
                  animate={{ y: ["-100%", "200%"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                />

                {/* Glitch layer — offset red channel */}
                <motion.img
                  src="/founder.png"
                  alt=""
                  className="absolute inset-0 w-36 h-36 rounded-2xl object-cover opacity-25 pointer-events-none select-none"
                  style={{ filter: "hue-rotate(0deg) saturate(2) blur(1px)", mixBlendMode: "screen" }}
                  animate={{ x: [0, -3, 3, 0], opacity: [0.25, 0.15, 0.25] }}
                  transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4.5, ease: "linear" }}
                />

                {/* Main photo */}
                <motion.img
                  src="/founder.png"
                  alt="Founder"
                  draggable={false}
                  className="relative z-10 w-36 h-36 rounded-2xl object-cover select-none"
                  style={{
                    filter: "contrast(1.15) brightness(0.92)",
                    boxShadow: "0 0 0 1px rgba(245,158,11,0.2), 0 20px 60px -12px rgba(0,0,0,0.8)",
                  }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Live indicator */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#03060e] border border-white/[0.08]">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">Active</span>
                </div>
              </div>
            </motion.div>

            {/* Vertical separator line */}
            <div className="hidden md:block absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
          </div>

          {/* ── Info panel ── */}
          <div className="flex-1 p-7 md:p-9 flex flex-col justify-center gap-5 min-w-0">

            {/* Name + handle */}
            <div>
              <motion.div {...stagger(0)} className="flex items-center gap-3 mb-2">
                <div className="text-[8px] font-black text-amber-500/50 uppercase tracking-[0.4em] font-mono">// FOUNDER & ENGINEER</div>
              </motion.div>
              <motion.h3 {...stagger(1)} className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                Anas
              </motion.h3>
              <motion.div {...stagger(2)} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-amber-400/60">@i_anasop</span>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[10px] text-slate-600 uppercase tracking-widest">Builder · Analyst</span>
              </motion.div>
            </div>

            {/* Typewriter bio */}
            <motion.div {...stagger(3)} className="relative">
              <div className="text-[8px] font-black text-white/15 uppercase tracking-[0.35em] font-mono mb-2">// BIO</div>
              <p className="text-[13px] text-slate-400 leading-relaxed font-mono">
                {bio.displayed}
                {!bio.done && (
                  <motion.span
                    className="inline-block w-0.5 h-3.5 bg-amber-400 align-middle ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </p>
            </motion.div>

            {/* Social links */}
            <motion.div {...stagger(4)} className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://github.com/i-anasop"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.03] to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                />
                <Github className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-[11px] font-mono text-white/45 group-hover:text-white/80 transition-colors">i-anasop</span>
                <ExternalLink className="w-2.5 h-2.5 text-white/20 group-hover:text-white/40 transition-colors" />
              </a>

              <a
                href="https://x.com/i_anasop"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:border-sky-500/25 hover:bg-sky-500/[0.04] transition-all overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/[0.04] to-sky-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                />
                {/* X logo as SVG */}
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white/50 group-hover:text-sky-400 transition-colors fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
                <span className="text-[11px] font-mono text-white/45 group-hover:text-sky-400/80 transition-colors">i_anasop</span>
                <ExternalLink className="w-2.5 h-2.5 text-white/20 group-hover:text-sky-400/40 transition-colors" />
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Terminal manifest ─────────────────────────────────────────────── */}
      <motion.div
        {...stagger(5)}
        className="rounded-2xl border border-white/[0.06] bg-black/50 overflow-hidden mb-8"
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[8px] text-white/15 font-mono uppercase tracking-widest ml-2">crzp — manifest</span>
        </div>
        <div className="p-5 font-mono text-[12px] leading-7 space-y-0.5">
          {[
            { prefix: "$ ", text: "whoami",                  color: "text-amber-400/70" },
            { prefix: "> ", text: "Anas · Software Engineer", color: "text-white/50"    },
            { prefix: "$ ", text: "cat mission.txt",          color: "text-amber-400/70" },
            { prefix: "> ", text: "Make elite intelligence accessible. No gatekeepers.", color: "text-emerald-400/60" },
            { prefix: "$ ", text: "cat stack.txt",            color: "text-amber-400/70" },
            { prefix: "> ", text: "React · Express · Python ML · GDELT · ReliefWeb",    color: "text-blue-400/60"  },
            { prefix: "$ ", text: "cat status.txt",           color: "text-amber-400/70" },
            { prefix: "> ", text: "Building in public. Shipping alone. No shortcuts.",  color: "text-white/40"    },
          ].map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.08 }}
              className="flex"
            >
              <span className="text-white/20 mr-1 select-none">{line.prefix}</span>
              <span className={line.color}>{line.text}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 1.8 }}
            className="flex items-center gap-1 pt-1"
          >
            <span className="text-white/20 select-none">$ </span>
            <motion.span
              className="inline-block w-1.5 h-3.5 bg-amber-400/60"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <motion.div {...stagger(6)} className="grid grid-cols-3 gap-3">
        {[
          { val: "GDELT", label: "Primary Source",     sub: "15-min global ingestion"  },
          { val: "4",     label: "Risk Dimensions",    sub: "Kinetic · Policy · Econ · Social" },
          { val: "v2.0",  label: "Current Build",      sub: "React + Express + Python ML" },
        ].map(({ val, label, sub }) => (
          <div key={label} className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.01] text-center">
            <div className="text-xl font-black text-amber-400 font-mono mb-1">{val}</div>
            <div className="text-[9px] font-black text-white/35 uppercase tracking-widest">{label}</div>
            <div className="text-[8px] text-slate-700 mt-1 font-mono">{sub}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const GROUP_PAGES: Record<string, () => JSX.Element> = {
  "getting-started":  PageGettingStarted,
  "risk-intelligence": PageRiskIntelligence,
  "platform-features": PagePlatformFeatures,
  "data-ml":          PageDataML,
  "api-reference":    PageAPIReference,
  "about":            PageAbout,
};

/* ══════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════ */
export default function Docs() {
  const [activeId, setActiveId] = useState("getting-started");

  const currentIdx = GROUPS.findIndex(g => g.id === activeId);
  const prev = GROUPS[currentIdx - 1];
  const next = GROUPS[currentIdx + 1];

  const navigate = (id: string) => {
    setActiveId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PageContent = GROUP_PAGES[activeId];

  return (
    <div className="min-h-screen bg-[#020617] pt-16 flex flex-col xl:flex-row font-sans selection:bg-amber-500/30">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="xl:fixed xl:left-0 xl:top-16 xl:bottom-0 xl:w-72 w-full border-b xl:border-b-0 xl:border-r border-white/[0.05] bg-[#03060e]/95 backdrop-blur-xl z-40 xl:overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Logo — compact, tight padding */}
        <div className="flex items-center gap-3 px-8 pt-6 pb-5 border-b border-white/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Book className="w-3 h-3 text-amber-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">CRZP Docs</h3>
            <p className="text-[7px] text-slate-600 font-mono uppercase tracking-widest mt-0.5">Platform v2.0</p>
          </div>
        </div>

        {/* Desktop nav — starts directly below logo */}
        <nav className="hidden xl:flex flex-col gap-0.5 px-8 pt-4 pb-10">
          {GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = activeId === group.id;
            return (
              <div key={group.id}>
                {/* Group button */}
                <button
                  onClick={() => navigate(group.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all relative group",
                    isActive
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "border border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-amber-400" : "text-slate-600 group-hover:text-slate-400")} />
                  <span className="text-[12px] font-semibold flex-1">{group.title}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                </button>

                {/* Subtopics — shown when group is active */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-3.5 border-l border-amber-500/15 mt-0.5 mb-1.5 flex flex-col gap-0">
                        {group.items.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 px-2 py-1.5 group/item cursor-default"
                          >
                            <div className="w-1 h-1 rounded-full bg-amber-500/30 flex-shrink-0" />
                            <span className="text-[10.5px] text-slate-500 group-hover/item:text-slate-300 transition-colors leading-tight">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Mobile horizontal nav */}
        <nav className="flex xl:hidden overflow-x-auto gap-1.5 px-6 pb-4 pt-3" style={{ scrollbarWidth: "none" }}>
          {GROUPS.map(group => (
            <button key={group.id} onClick={() => navigate(group.id)}
              className={cn("flex-shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-semibold transition-all border",
                activeId === group.id
                  ? "bg-amber-500/12 text-amber-400 border-amber-500/25"
                  : "text-slate-600 hover:text-slate-300 border-transparent hover:bg-white/[0.03]")}>
              {group.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 xl:ml-72 min-w-0 flex flex-col">
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 sm:px-10 lg:px-14 py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10 text-[9px] font-mono text-slate-700 uppercase tracking-widest border-b border-white/[0.04] pb-4">
            <Link href="/landing" className="hover:text-amber-500 transition-colors">CRZP</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-slate-500">Docs</span>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-amber-400/70">{GROUPS.find(g => g.id === activeId)?.title}</span>
          </div>

          {/* Page content — animated on group change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
            >
              {PageContent ? <PageContent /> : null}
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next */}
          <div className="flex items-center justify-between mt-16 pt-6 border-t border-white/[0.05]">
            {prev ? (
              <button onClick={() => navigate(prev.id)}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-amber-500/20 transition-all group text-left">
                <ChevronLeft className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                <div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest mb-0.5">Previous</div>
                  <div className="text-[12px] font-semibold text-white/60 group-hover:text-white transition-colors">{prev.title}</div>
                </div>
              </button>
            ) : <div />}

            {next ? (
              <button onClick={() => navigate(next.id)}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-amber-500/20 transition-all group text-right">
                <div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest mb-0.5">Next</div>
                  <div className="text-[12px] font-semibold text-white/60 group-hover:text-white transition-colors">{next.title}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </button>
            ) : <div />}
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
