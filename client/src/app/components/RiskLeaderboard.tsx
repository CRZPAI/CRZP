import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Flame, AlertTriangle, Info, ShieldCheck, ChevronRight } from "lucide-react";
import { getRiskColor, cn } from "@/lib/utils";

export interface LeaderboardEntry {
  name: string;
  country: string;
  region: string;
  score: number;
  military: number;
  political: number;
  economic: number;
  flag: string;
  lat: number;
  lon: number;
}

const ALL_LOCATIONS: LeaderboardEntry[] = [
  { name: "Gaza",          country: "Palestine",       region: "Middle East",    score: 91, military: 96, political: 88, economic: 90, flag: "🇵🇸", lat: 31.35,  lon: 34.31 },
  { name: "Rafah",         country: "Palestine",       region: "Middle East",    score: 90, military: 94, political: 85, economic: 90, flag: "🇵🇸", lat: 31.30,  lon: 34.24 },
  { name: "Khan Younis",   country: "Palestine",       region: "Middle East",    score: 88, military: 92, political: 84, economic: 88, flag: "🇵🇸", lat: 31.34,  lon: 34.30 },
  { name: "Khartoum",      country: "Sudan",           region: "Africa",         score: 84, military: 90, political: 86, economic: 82, flag: "🇸🇩", lat: 15.56,  lon: 32.53 },
  { name: "Sanaa",         country: "Yemen",           region: "Middle East",    score: 84, military: 88, political: 80, economic: 86, flag: "🇾🇪", lat: 15.37,  lon: 44.19 },
  { name: "Darfur",        country: "Sudan",           region: "Africa",         score: 83, military: 88, political: 82, economic: 84, flag: "🇸🇩", lat: 13.47,  lon: 24.48 },
  { name: "Donetsk",       country: "Ukraine",         region: "Eastern Europe", score: 83, military: 94, political: 72, economic: 76, flag: "🇺🇦", lat: 47.99,  lon: 37.80 },
  { name: "Mogadishu",     country: "Somalia",         region: "Africa",         score: 83, military: 86, political: 82, economic: 78, flag: "🇸🇴", lat:  2.05,  lon: 45.34 },
  { name: "Bakhmut",       country: "Ukraine",         region: "Eastern Europe", score: 82, military: 96, political: 70, economic: 80, flag: "🇺🇦", lat: 48.60,  lon: 38.00 },
  { name: "Mariupol",      country: "Ukraine",         region: "Eastern Europe", score: 82, military: 90, political: 68, economic: 80, flag: "🇺🇦", lat: 47.09,  lon: 37.54 },
  { name: "Omdurman",      country: "Sudan",           region: "Africa",         score: 82, military: 88, political: 82, economic: 80, flag: "🇸🇩", lat: 15.64,  lon: 32.48 },
  { name: "Baidoa",        country: "Somalia",         region: "Africa",         score: 80, military: 82, political: 74, economic: 72, flag: "🇸🇴", lat:  3.12,  lon: 43.65 },
  { name: "Damascus",      country: "Syria",           region: "Middle East",    score: 80, military: 88, political: 78, economic: 72, flag: "🇸🇾", lat: 33.51,  lon: 36.29 },
  { name: "Hodeidah",      country: "Yemen",           region: "Middle East",    score: 80, military: 85, political: 72, economic: 83, flag: "🇾🇪", lat: 14.80,  lon: 42.95 },
  { name: "Luhansk",       country: "Ukraine",         region: "Eastern Europe", score: 80, military: 90, political: 70, economic: 74, flag: "🇺🇦", lat: 48.57,  lon: 39.31 },
  { name: "Kherson",       country: "Ukraine",         region: "Eastern Europe", score: 79, military: 88, political: 68, economic: 72, flag: "🇺🇦", lat: 46.64,  lon: 32.62 },
  { name: "Kandahar",      country: "Afghanistan",     region: "Asia",           score: 79, military: 83, political: 76, economic: 72, flag: "🇦🇫", lat: 31.61,  lon: 65.71 },
  { name: "Taiz",          country: "Yemen",           region: "Middle East",    score: 78, military: 82, political: 70, economic: 80, flag: "🇾🇪", lat: 13.58,  lon: 44.02 },
  { name: "Kabul",         country: "Afghanistan",     region: "Asia",           score: 77, military: 80, political: 78, economic: 76, flag: "🇦🇫", lat: 34.53,  lon: 69.17 },
  { name: "Aleppo",        country: "Syria",           region: "Middle East",    score: 77, military: 85, political: 74, economic: 68, flag: "🇸🇾", lat: 36.20,  lon: 37.16 },
  { name: "Zaporizhzhia",  country: "Ukraine",         region: "Eastern Europe", score: 77, military: 85, political: 66, economic: 70, flag: "🇺🇦", lat: 47.85,  lon: 35.11 },
  { name: "Kharkiv",       country: "Ukraine",         region: "Eastern Europe", score: 77, military: 84, political: 65, economic: 68, flag: "🇺🇦", lat: 49.99,  lon: 36.23 },
  { name: "Kismayo",       country: "Somalia",         region: "Africa",         score: 74, military: 80, political: 76, economic: 74, flag: "🇸🇴", lat: -0.36,  lon: 42.54 },
  { name: "Idlib",         country: "Syria",           region: "Middle East",    score: 74, military: 80, political: 74, economic: 65, flag: "🇸🇾", lat: 35.93,  lon: 36.63 },
  { name: "Homs",          country: "Syria",           region: "Middle East",    score: 74, military: 82, political: 70, economic: 65, flag: "🇸🇾", lat: 34.73,  lon: 36.72 },
  { name: "Aden",          country: "Yemen",           region: "Middle East",    score: 73, military: 80, political: 72, economic: 78, flag: "🇾🇪", lat: 12.78,  lon: 45.03 },
  { name: "Jalalabad",     country: "Afghanistan",     region: "Asia",           score: 73, military: 78, political: 74, economic: 70, flag: "🇦🇫", lat: 34.43,  lon: 70.45 },
  { name: "Raqqa",         country: "Syria",           region: "Middle East",    score: 73, military: 78, political: 72, economic: 68, flag: "🇸🇾", lat: 35.95,  lon: 38.99 },
  { name: "Kyiv",          country: "Ukraine",         region: "Eastern Europe", score: 71, military: 78, political: 64, economic: 60, flag: "🇺🇦", lat: 50.45,  lon: 30.52 },
  { name: "West Bank",     country: "Palestine",       region: "Middle East",    score: 72, military: 72, political: 82, economic: 65, flag: "🇵🇸", lat: 31.90,  lon: 35.20 },
  { name: "Benghazi",      country: "Libya",           region: "Middle East",    score: 70, military: 76, political: 74, economic: 55, flag: "🇱🇾", lat: 32.12,  lon: 20.07 },
  { name: "Port Sudan",    country: "Sudan",           region: "Africa",         score: 70, military: 72, political: 74, economic: 70, flag: "🇸🇩", lat: 19.62,  lon: 37.22 },
  { name: "Beirut",        country: "Lebanon",         region: "Middle East",    score: 68, military: 64, political: 76, economic: 72, flag: "🇱🇧", lat: 33.89,  lon: 35.50 },
  { name: "Herat",         country: "Afghanistan",     region: "Asia",           score: 68, military: 72, political: 70, economic: 68, flag: "🇦🇫", lat: 34.35,  lon: 62.20 },
  { name: "Ramallah",      country: "Palestine",       region: "Middle East",    score: 68, military: 68, political: 80, economic: 62, flag: "🇵🇸", lat: 31.90,  lon: 35.21 },
  { name: "Mosul",         country: "Iraq",            region: "Middle East",    score: 65, military: 68, political: 68, economic: 64, flag: "🇮🇶", lat: 36.34,  lon: 43.13 },
  { name: "Tripoli",       country: "Libya",           region: "Middle East",    score: 65, military: 72, political: 80, economic: 58, flag: "🇱🇾", lat: 32.89,  lon: 13.18 },
  { name: "Fallujah",      country: "Iraq",            region: "Middle East",    score: 63, military: 66, political: 64, economic: 62, flag: "🇮🇶", lat: 33.35,  lon: 43.78 },
  { name: "Kirkuk",        country: "Iraq",            region: "Middle East",    score: 61, military: 62, political: 72, economic: 58, flag: "🇮🇶", lat: 35.47,  lon: 44.39 },
  { name: "Baghdad",       country: "Iraq",            region: "Middle East",    score: 61, military: 60, political: 72, economic: 56, flag: "🇮🇶", lat: 33.34,  lon: 44.40 },
  { name: "Tehran",        country: "Iran",            region: "Middle East",    score: 57, military: 52, political: 68, economic: 74, flag: "🇮🇷", lat: 35.69,  lon: 51.39 },
  { name: "Basra",         country: "Iraq",            region: "Middle East",    score: 55, military: 52, political: 65, economic: 58, flag: "🇮🇶", lat: 30.51,  lon: 47.78 },
  { name: "Somalia",       country: "Somalia",         region: "Africa",         score: 82, military: 86, political: 82, economic: 78, flag: "🇸🇴", lat:  2.05,  lon: 45.34 },
  { name: "Yemen",         country: "Yemen",           region: "Middle East",    score: 82, military: 88, political: 80, economic: 86, flag: "🇾🇪", lat: 15.56,  lon: 48.52 },
  { name: "Syria",         country: "Syria",           region: "Middle East",    score: 77, military: 85, political: 76, economic: 68, flag: "🇸🇾", lat: 34.80,  lon: 38.99 },
  { name: "Sudan",         country: "Sudan",           region: "Africa",         score: 74, military: 80, political: 74, economic: 72, flag: "🇸🇩", lat: 15.56,  lon: 32.53 },
  { name: "Afghanistan",   country: "Afghanistan",     region: "Asia",           score: 74, military: 80, political: 78, economic: 76, flag: "🇦🇫", lat: 33.94,  lon: 67.71 },
  { name: "Haiti",         country: "Haiti",           region: "Americas",       score: 72, military: 68, political: 76, economic: 78, flag: "🇭🇹", lat: 18.54,  lon: -72.34 },
  { name: "South Sudan",   country: "South Sudan",     region: "Africa",         score: 72, military: 74, political: 76, economic: 72, flag: "🇸🇸", lat:  4.86,  lon: 31.57 },
  { name: "DRC",           country: "DR Congo",        region: "Africa",         score: 68, military: 72, political: 70, economic: 68, flag: "🇨🇩", lat: -4.32,  lon: 15.32 },
  { name: "CAR",           country: "C. African Rep.", region: "Africa",         score: 68, military: 70, political: 68, economic: 65, flag: "🇨🇫", lat:  4.36,  lon: 18.55 },
  { name: "Chad",          country: "Chad",            region: "Africa",         score: 65, military: 66, political: 68, economic: 62, flag: "🇹🇩", lat: 12.11,  lon: 15.05 },
  { name: "Mali",          country: "Mali",            region: "Africa",         score: 65, military: 68, political: 64, economic: 60, flag: "🇲🇱", lat: 12.65,  lon: -8.00 },
  { name: "Burkina Faso",  country: "Burkina Faso",    region: "Africa",         score: 62, military: 64, political: 62, economic: 58, flag: "🇧🇫", lat: 12.36,  lon: -1.53 },
  { name: "Niger",         country: "Niger",           region: "Africa",         score: 62, military: 62, political: 60, economic: 58, flag: "🇳🇪", lat: 13.51,  lon:  2.11 },
  { name: "Myanmar",       country: "Myanmar",         region: "Asia",           score: 65, military: 68, political: 66, economic: 60, flag: "🇲🇲", lat: 19.75,  lon: 96.08 },
  { name: "North Korea",   country: "North Korea",     region: "Asia",           score: 60, military: 70, political: 72, economic: 62, flag: "🇰🇵", lat: 40.34,  lon: 127.51 },
  { name: "Nigeria",       country: "Nigeria",         region: "Africa",         score: 56, military: 60, political: 62, economic: 55, flag: "🇳🇬", lat:  9.08,  lon:  8.67 },
  { name: "Ethiopia",      country: "Ethiopia",        region: "Africa",         score: 56, military: 60, political: 60, economic: 55, flag: "🇪🇹", lat:  9.14,  lon: 40.49 },
  { name: "Russia",        country: "Russia",          region: "Eastern Europe", score: 55, military: 60, political: 65, economic: 58, flag: "🇷🇺", lat: 55.75,  lon: 37.62 },
  { name: "Iran",          country: "Iran",            region: "Middle East",    score: 55, military: 52, political: 68, economic: 74, flag: "🇮🇷", lat: 32.43,  lon: 53.69 },
  { name: "Pakistan",      country: "Pakistan",        region: "Asia",           score: 54, military: 56, political: 60, economic: 58, flag: "🇵🇰", lat: 30.37,  lon: 69.34 },
  { name: "Venezuela",     country: "Venezuela",       region: "Americas",       score: 52, military: 50, political: 65, economic: 68, flag: "🇻🇪", lat:  6.42,  lon: -66.58 },
  { name: "Lebanon",       country: "Lebanon",         region: "Middle East",    score: 52, military: 50, political: 62, economic: 68, flag: "🇱🇧", lat: 33.89,  lon: 35.50 },
  { name: "Ukraine",       country: "Ukraine",         region: "Eastern Europe", score: 52, military: 65, political: 58, economic: 55, flag: "🇺🇦", lat: 48.38,  lon: 31.17 },
  { name: "Libya",         country: "Libya",           region: "Middle East",    score: 55, military: 58, political: 65, economic: 50, flag: "🇱🇾", lat: 26.33,  lon: 17.23 },
  { name: "Iraq",          country: "Iraq",            region: "Middle East",    score: 52, military: 55, political: 60, economic: 52, flag: "🇮🇶", lat: 33.22,  lon: 43.68 },
  { name: "Mexico",        country: "Mexico",          region: "Americas",       score: 50, military: 48, political: 55, economic: 52, flag: "🇲🇽", lat: 23.63,  lon: -102.55 },
  { name: "Colombia",      country: "Colombia",        region: "Americas",       score: 49, military: 52, political: 54, economic: 48, flag: "🇨🇴", lat:  4.57,  lon: -74.29 },
  { name: "Honduras",      country: "Honduras",        region: "Americas",       score: 48, military: 44, political: 52, economic: 56, flag: "🇭🇳", lat: 15.20,  lon: -86.24 },
  { name: "Egypt",         country: "Egypt",           region: "Middle East",    score: 47, military: 50, political: 55, economic: 52, flag: "🇪🇬", lat: 26.82,  lon: 30.80 },
  { name: "Turkey",        country: "Turkey",          region: "Middle East",    score: 46, military: 48, political: 52, economic: 50, flag: "🇹🇷", lat: 38.96,  lon: 35.24 },
  { name: "India",         country: "India",           region: "Asia",           score: 44, military: 46, political: 50, economic: 44, flag: "🇮🇳", lat: 20.59,  lon: 78.96 },
  { name: "Brazil",        country: "Brazil",          region: "Americas",       score: 42, military: 42, political: 46, economic: 46, flag: "🇧🇷", lat: -14.23,  lon: -51.93 },
  { name: "South Africa",  country: "South Africa",    region: "Africa",         score: 48, military: 44, political: 52, economic: 56, flag: "🇿🇦", lat: -30.56,  lon: 22.94 },
  { name: "Philippines",   country: "Philippines",     region: "Asia",           score: 42, military: 44, political: 48, economic: 42, flag: "🇵🇭", lat: 12.88,  lon: 121.77 },
  { name: "Indonesia",     country: "Indonesia",       region: "Asia",           score: 40, military: 42, political: 44, economic: 40, flag: "🇮🇩", lat: -0.79,  lon: 113.92 },
  { name: "USA",           country: "USA",             region: "Americas",       score: 30, military: 28, political: 35, economic: 30, flag: "🇺🇸", lat: 37.09,  lon: -95.71 },
  { name: "UK",            country: "United Kingdom",  region: "Europe",         score: 25, military: 22, political: 28, economic: 24, flag: "🇬🇧", lat: 55.37,  lon: -3.43 },
  { name: "France",        country: "France",          region: "Europe",         score: 24, military: 22, political: 30, economic: 22, flag: "🇫🇷", lat: 46.23,  lon:  2.21 },
  { name: "Germany",       country: "Germany",         region: "Europe",         score: 18, military: 16, political: 20, economic: 18, flag: "🇩🇪", lat: 51.17,  lon: 10.45 },
  { name: "Japan",         country: "Japan",           region: "Asia",           score: 18, military: 16, political: 18, economic: 18, flag: "🇯🇵", lat: 36.20,  lon: 138.25 },
  { name: "Canada",        country: "Canada",          region: "Americas",       score: 18, military: 16, political: 18, economic: 18, flag: "🇨🇦", lat: 56.13,  lon: -106.35 },
  { name: "Australia",     country: "Australia",       region: "Asia",           score: 14, military: 12, political: 14, economic: 14, flag: "🇦🇺", lat: -25.27,  lon: 133.78 },
  { name: "Finland",       country: "Finland",         region: "Europe",         score: 10, military: 10, political: 10, economic: 10, flag: "🇫🇮", lat: 61.92,  lon: 25.75 },
  { name: "Norway",        country: "Norway",          region: "Europe",         score: 10, military: 10, political: 10, economic: 10, flag: "🇳🇴", lat: 60.47,  lon:  8.47 },
];

const REGIONS = ["All", "Middle East", "Africa", "Eastern Europe", "Asia", "Americas", "Europe"];
type SortKey = "score" | "military" | "political" | "economic";

function getRiskLevel(score: number) {
  if (score >= 75) return "Extreme";
  if (score >= 50) return "High";
  if (score >= 25) return "Moderate";
  return "Safe";
}

function RiskBadge({ score }: { score: number }) {
  const color = getRiskColor(score);
  const level = getRiskLevel(score);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
      style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
      {level}
    </span>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground/50 w-5 text-right">{value}</span>
    </div>
  );
}

function SortHeader({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn("flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
        active ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground")}
      data-testid={`sort-${sortKey}`}
    >
      {label}
      {active ? (dir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

interface RiskLeaderboardProps {
  onSelectLocation: (loc: { displayName: string; lat: number; lon: number }) => void;
}

export function RiskLeaderboard({ onSelectLocation }: RiskLeaderboardProps) {
  const [region, setRegion] = useState("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = ALL_LOCATIONS;
    if (region !== "All") list = list.filter(e => e.region === region);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.country.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
  }, [region, query, sortKey, sortDir]);

  const sorted = filtered.map((e, i) => ({ ...e, rank: i + 1, level: getRiskLevel(e.score) }));

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            {sorted.length} locations · sorted by {sortKey}
          </span>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search location…"
            data-testid="leaderboard-search"
            className="w-full h-8 pl-9 pr-3 text-xs bg-card border border-border rounded-lg focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)}
            data-testid={`filter-${r.toLowerCase().replace(/\s/g, "-")}`}
            className={cn("px-3 py-1 rounded-full text-[10px] font-semibold border transition-all",
              region === r
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-card border-border text-muted-foreground/50 hover:text-muted-foreground hover:border-border/80")}>
            {r}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="grid grid-cols-[2rem_1fr_5rem_4.5rem_4.5rem_4.5rem] gap-0 px-5 py-2.5 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">#</span>
          <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Location</span>
          <SortHeader label="Score" sortKey="score" current={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Mil." sortKey="military" current={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Pol." sortKey="political" current={sortKey} dir={sortDir} onSort={handleSort} />
          <SortHeader label="Eco." sortKey="economic" current={sortKey} dir={sortDir} onSort={handleSort} />
        </div>

        <div className="overflow-y-auto max-h-[480px] divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {sorted.map((entry, idx) => {
              const color = getRiskColor(entry.score);
              return (
                <motion.button
                  key={`${entry.name}-${entry.country}`}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2, delay: idx < 20 ? idx * 0.015 : 0 }}
                  onClick={() => onSelectLocation({
                    displayName: `${entry.name}, ${entry.country}`,
                    lat: entry.lat,
                    lon: entry.lon,
                  })}
                  data-testid={`leaderboard-row-${entry.name.toLowerCase().replace(/\s/g, "-")}`}
                  className="w-full grid grid-cols-[2rem_1fr_5rem_4.5rem_4.5rem_4.5rem] gap-0 px-5 py-3 hover:bg-white/3 transition-colors text-left group"
                >
                  <span className="text-xs tabular-nums text-muted-foreground/30 font-medium self-center">{entry.rank}</span>

                  <div className="flex items-center gap-2.5 min-w-0 self-center">
                    <span className="text-base leading-none flex-shrink-0">{entry.flag}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground/85 group-hover:text-foreground transition-colors truncate">{entry.name}</p>
                      <p className="text-[10px] text-muted-foreground/40 truncate">{entry.country}</p>
                    </div>
                    <RiskBadge score={entry.score} />
                  </div>

                  <div className="flex items-center gap-2 self-center">
                    <span className="text-base font-bold tabular-nums" style={{ color }}>{entry.score}</span>
                  </div>

                  <div className="self-center hidden sm:block"><MiniBar value={entry.military} color="#ef4444" /></div>
                  <div className="self-center hidden sm:block"><MiniBar value={entry.political} color="#f59e0b" /></div>
                  <div className="self-center hidden sm:block"><MiniBar value={entry.economic} color="#3b82f6" /></div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {sorted.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground/40">No locations match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
