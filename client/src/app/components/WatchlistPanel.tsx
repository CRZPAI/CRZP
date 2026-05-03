import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Flame, AlertTriangle, ShieldCheck, RefreshCw, Activity } from "lucide-react";
import { getRiskColor } from "@/lib/utils";

interface WatchlistEntry {
  location: string;
  country: string;
  region: string;
  staticScore: number;
  lat: number;
  lon: number;
  flag: string;
}

const CRITICAL_HOTSPOTS: WatchlistEntry[] = [
  { location: "Gaza, Palestinian Territories",    country: "Palestine",   region: "Middle East",    staticScore: 91, lat: 31.35,  lon: 34.31,  flag: "🇵🇸" },
  { location: "Rafah, Palestinian Territories",   country: "Palestine",   region: "Middle East",    staticScore: 89, lat: 31.30,  lon: 34.24,  flag: "🇵🇸" },
  { location: "Bakhmut, Ukraine",                 country: "Ukraine",     region: "Eastern Europe", staticScore: 81, lat: 48.60,  lon: 38.00,  flag: "🇺🇦" },
  { location: "Khartoum, Sudan",                  country: "Sudan",       region: "Africa",         staticScore: 84, lat: 15.56,  lon: 32.53,  flag: "🇸🇩" },
  { location: "Sanaa, Yemen",                     country: "Yemen",       region: "Middle East",    staticScore: 84, lat: 15.37,  lon: 44.19,  flag: "🇾🇪" },
  { location: "Mogadishu, Somalia",               country: "Somalia",     region: "Africa",         staticScore: 83, lat:  2.05,  lon: 45.34,  flag: "🇸🇴" },
  { location: "Damascus, Syria",                  country: "Syria",       region: "Middle East",    staticScore: 80, lat: 33.51,  lon: 36.29,  flag: "🇸🇾" },
  { location: "Kabul, Afghanistan",               country: "Afghanistan", region: "Asia",           staticScore: 77, lat: 34.53,  lon: 69.17,  flag: "🇦🇫" },
];

function getRiskLevel(score: number): string {
  if (score >= 75) return "Extreme";
  if (score >= 50) return "High";
  if (score >= 25) return "Moderate";
  return "Safe";
}

function RiskBadgeIcon({ score }: { score: number }) {
  const s = { width: 10, height: 10 };
  if (score >= 75) return <Flame style={s} />;
  if (score >= 50) return <AlertTriangle style={s} />;
  return <ShieldCheck style={s} />;
}

function ScoreArc({ score, size = 60 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const color = getRiskColor(score);
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={3.5} className="text-white/6" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <span className="text-sm font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
    </div>
  );
}

function WatchlistCard({
  entry,
  index,
  onSelect,
}: {
  entry: WatchlistEntry;
  index: number;
  onSelect: (loc: { displayName: string; lat: number; lon: number }) => void;
}) {
  const { data, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["/api/risk/analyze", entry.location],
    queryFn: async () => {
      const res = await fetch(`/api/risk/analyze?location=${encodeURIComponent(entry.location)}`);
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<{ riskScore: number; riskLevel: string; escalationMomentum?: { signal: string } }>;
    },
    initialData: { riskScore: entry.staticScore, riskLevel: getRiskLevel(entry.staticScore) },
    initialDataUpdatedAt: 0,
    staleTime: 8 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const score = data?.riskScore ?? entry.staticScore;
  const level = data?.riskLevel ?? getRiskLevel(entry.staticScore);
  const signal = data?.escalationMomentum?.signal ?? "Stable";
  const isLive = dataUpdatedAt > 0;
  const color = getRiskColor(score);

  const signalColor =
    signal === "Escalating" ? "#ef4444" :
    signal === "De-escalating" ? "#22c55e" : "#f59e0b";

  const SignalIcon =
    signal === "Escalating" ? TrendingUp :
    signal === "De-escalating" ? TrendingDown : Minus;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={() => onSelect({ displayName: entry.location, lat: entry.lat, lon: entry.lon })}
      data-testid={`watchlist-card-${entry.location.split(",")[0].toLowerCase().replace(/\s/g, "-")}`}
      className="relative w-full text-left rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-200 overflow-hidden group cursor-pointer"
      style={{ boxShadow: `0 2px 20px ${color}0a` }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${color}55 50%, transparent 100%)` }} />

      <div className="p-4 flex items-center gap-4">
        <ScoreArc score={score} size={58} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base leading-none">{entry.flag}</span>
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/30">{entry.country}</span>
          </div>
          <p className="text-[13px] font-semibold text-white/80 group-hover:text-white truncate transition-colors leading-tight mb-2">
            {entry.location.split(",")[0]}
          </p>
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border"
              style={{ color, borderColor: `${color}28`, backgroundColor: `${color}0e` }}
            >
              <RiskBadgeIcon score={score} />
              {level}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: signalColor }}>
              <SignalIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{signal}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isFetching ? (
            <RefreshCw className="w-3 h-3 text-white/20 animate-spin" />
          ) : isLive ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white/10" />
          )}
          <span className="text-[9px] text-white/20 font-medium tracking-wider">{entry.region}</span>
        </div>
      </div>
    </motion.button>
  );
}

interface WatchlistPanelProps {
  onSelectLocation: (loc: { displayName: string; lat: number; lon: number }) => void;
}

export function WatchlistPanel({ onSelectLocation }: WatchlistPanelProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-500/20 bg-red-500/8">
            <Activity className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/80 tracking-wide">Live Crisis Monitor</p>
            <p className="text-[10px] text-white/25 mt-0.5">8 active hotspots · Auto-refreshes every 10 min</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/25">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          Click to analyse
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CRITICAL_HOTSPOTS.map((entry, i) => (
          <WatchlistCard
            key={entry.location}
            entry={entry}
            index={i}
            onSelect={onSelectLocation}
          />
        ))}
      </div>
    </div>
  );
}
