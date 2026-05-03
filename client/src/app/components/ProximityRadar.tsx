import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Crosshair, TrendingUp, AlertTriangle } from "lucide-react";
import { getRiskColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Hotspot {
  name: string;
  country: string;
  lat: number;
  lon: number;
  score: number;
  flag: string;
}

const HOTSPOTS: Hotspot[] = [
  { name: "Gaza",        country: "Palestine",   lat: 31.35,  lon: 34.31,  score: 91, flag: "🇵🇸" },
  { name: "Rafah",       country: "Palestine",   lat: 31.30,  lon: 34.24,  score: 90, flag: "🇵🇸" },
  { name: "Khan Younis", country: "Palestine",   lat: 31.34,  lon: 34.30,  score: 88, flag: "🇵🇸" },
  { name: "Khartoum",   country: "Sudan",        lat: 15.56,  lon: 32.53,  score: 84, flag: "🇸🇩" },
  { name: "Sanaa",       country: "Yemen",        lat: 15.37,  lon: 44.19,  score: 84, flag: "🇾🇪" },
  { name: "Darfur",      country: "Sudan",        lat: 13.47,  lon: 24.48,  score: 83, flag: "🇸🇩" },
  { name: "Donetsk",    country: "Ukraine",       lat: 47.99,  lon: 37.80,  score: 83, flag: "🇺🇦" },
  { name: "Mogadishu",  country: "Somalia",       lat:  2.05,  lon: 45.34,  score: 83, flag: "🇸🇴" },
  { name: "Bakhmut",    country: "Ukraine",       lat: 48.60,  lon: 38.00,  score: 82, flag: "🇺🇦" },
  { name: "Mariupol",   country: "Ukraine",       lat: 47.09,  lon: 37.54,  score: 82, flag: "🇺🇦" },
  { name: "Omdurman",   country: "Sudan",         lat: 15.64,  lon: 32.48,  score: 82, flag: "🇸🇩" },
  { name: "Baidoa",     country: "Somalia",       lat:  3.12,  lon: 43.65,  score: 80, flag: "🇸🇴" },
  { name: "Damascus",   country: "Syria",         lat: 33.51,  lon: 36.29,  score: 80, flag: "🇸🇾" },
  { name: "Hodeidah",   country: "Yemen",         lat: 14.80,  lon: 42.95,  score: 80, flag: "🇾🇪" },
  { name: "Luhansk",    country: "Ukraine",       lat: 48.57,  lon: 39.31,  score: 80, flag: "🇺🇦" },
  { name: "Kherson",    country: "Ukraine",       lat: 46.64,  lon: 32.62,  score: 79, flag: "🇺🇦" },
  { name: "Kandahar",   country: "Afghanistan",   lat: 31.61,  lon: 65.71,  score: 79, flag: "🇦🇫" },
  { name: "Taiz",       country: "Yemen",         lat: 13.58,  lon: 44.02,  score: 78, flag: "🇾🇪" },
  { name: "Kabul",      country: "Afghanistan",   lat: 34.53,  lon: 69.17,  score: 77, flag: "🇦🇫" },
  { name: "Aleppo",     country: "Syria",         lat: 36.20,  lon: 37.16,  score: 77, flag: "🇸🇾" },
  { name: "Zaporizhzhia",country:"Ukraine",       lat: 47.85,  lon: 35.11,  score: 77, flag: "🇺🇦" },
  { name: "Kharkiv",   country: "Ukraine",        lat: 49.99,  lon: 36.23,  score: 77, flag: "🇺🇦" },
  { name: "Kyiv",       country: "Ukraine",       lat: 50.45,  lon: 30.52,  score: 71, flag: "🇺🇦" },
  { name: "Kismayo",   country: "Somalia",        lat: -0.36,  lon: 42.54,  score: 74, flag: "🇸🇴" },
  { name: "Idlib",      country: "Syria",         lat: 35.93,  lon: 36.63,  score: 74, flag: "🇸🇾" },
  { name: "Homs",       country: "Syria",         lat: 34.73,  lon: 36.72,  score: 74, flag: "🇸🇾" },
  { name: "Aden",       country: "Yemen",         lat: 12.78,  lon: 45.03,  score: 73, flag: "🇾🇪" },
  { name: "Raqqa",      country: "Syria",         lat: 35.95,  lon: 38.99,  score: 73, flag: "🇸🇾" },
  { name: "West Bank",  country: "Palestine",     lat: 31.90,  lon: 35.20,  score: 72, flag: "🇵🇸" },
  { name: "Beirut",     country: "Lebanon",       lat: 33.89,  lon: 35.50,  score: 68, flag: "🇱🇧" },
  { name: "Benghazi",   country: "Libya",         lat: 32.12,  lon: 20.07,  score: 70, flag: "🇱🇾" },
  { name: "Port Sudan", country: "Sudan",         lat: 19.62,  lon: 37.22,  score: 70, flag: "🇸🇩" },
  { name: "Mosul",      country: "Iraq",          lat: 36.34,  lon: 43.13,  score: 65, flag: "🇮🇶" },
  { name: "Tripoli",    country: "Libya",         lat: 32.89,  lon: 13.18,  score: 65, flag: "🇱🇾" },
  { name: "Baghdad",    country: "Iraq",          lat: 33.34,  lon: 44.40,  score: 61, flag: "🇮🇶" },
  { name: "Tehran",     country: "Iran",          lat: 35.69,  lon: 51.39,  score: 57, flag: "🇮🇷" },
  { name: "Jalalabad",  country: "Afghanistan",   lat: 34.43,  lon: 70.45,  score: 73, flag: "🇦🇫" },
  { name: "Port-au-Prince", country: "Haiti",     lat: 18.54,  lon: -72.34, score: 70, flag: "🇭🇹" },
  { name: "Niamey",     country: "Niger",         lat: 13.51,  lon:  2.11,  score: 60, flag: "🇳🇪" },
  { name: "Bamako",     country: "Mali",          lat: 12.65,  lon: -8.00,  score: 60, flag: "🇲🇱" },
  { name: "Bangui",     country: "CAR",           lat:  4.36,  lon: 18.55,  score: 65, flag: "🇨🇫" },
  { name: "Juba",       country: "South Sudan",   lat:  4.86,  lon: 31.57,  score: 68, flag: "🇸🇸" },
  { name: "Kinshasa",   country: "DRC",           lat: -4.32,  lon: 15.32,  score: 60, flag: "🇨🇩" },
  { name: "Pyongyang",  country: "North Korea",   lat: 39.02,  lon: 125.75, score: 60, flag: "🇰🇵" },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const MAX_RANGE_KM = 3000;
const RINGS = [750, 1500, 2250, 3000];

interface RadarDot {
  hotspot: Hotspot;
  km: number;
  bearing: number;
  svgX: number;
  svgY: number;
}

interface ProximityRadarProps {
  lat: number;
  lon: number;
  locationName: string;
  onSelectLocation: (loc: { displayName: string; lat: number; lon: number }) => void;
}

export function ProximityRadar({ lat, lon, locationName, onSelectLocation }: ProximityRadarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const SVG = 320;
  const cx = SVG / 2;
  const cy = SVG / 2;
  const outerR = (SVG / 2) - 24;

  const dots = useMemo<RadarDot[]>(() => {
    return HOTSPOTS
      .map(h => {
        const km = haversineKm(lat, lon, h.lat, h.lon);
        const bearing = bearingDeg(lat, lon, h.lat, h.lon);
        const normDist = Math.min(km, MAX_RANGE_KM) / MAX_RANGE_KM;
        const r = normDist * outerR;
        const angle = (bearing - 90) * (Math.PI / 180);
        return {
          hotspot: h,
          km,
          bearing,
          svgX: cx + r * Math.cos(angle),
          svgY: cy + r * Math.sin(angle),
        };
      })
      .filter(d => d.km > 1 && d.km <= MAX_RANGE_KM)
      .sort((a, b) => a.km - b.km);
  }, [lat, lon]);

  const nearest = dots.slice(0, 8);
  const listItems = dots.slice(0, 7);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Conflict Proximity Radar</span>
        <span className="text-xs text-muted-foreground/40">· {dots.length} hotspots within {MAX_RANGE_KM.toLocaleString()} km</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Radar SVG ── */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width={SVG} height={SVG} className="overflow-visible">
              {/* Background glow */}
              <defs>
                <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#020c1c" stopOpacity="0.1" />
                </radialGradient>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Radar disc */}
              <circle cx={cx} cy={cy} r={outerR} fill="url(#radarBg)" stroke="rgba(59,130,246,0.15)" strokeWidth={1} />

              {/* Sweep animation */}
              <motion.path
                d={`M${cx},${cy} L${cx},${cy - outerR} A${outerR},${outerR} 0 0,1 ${cx + outerR * Math.sin(Math.PI / 6)},${cy - outerR * Math.cos(Math.PI / 6)} Z`}
                fill="url(#centerGlow)"
                style={{ transformOrigin: `${cx}px ${cy}px` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              />

              {/* Distance rings */}
              {RINGS.map((km, i) => {
                const r = (km / MAX_RANGE_KM) * outerR;
                return (
                  <g key={km}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={0.5} strokeDasharray="3 4" />
                    <text x={cx + r + 3} y={cy - 3} fill="rgba(148,163,184,0.35)" fontSize={8} fontFamily="monospace">
                      {km >= 1000 ? `${km / 1000}k` : km}km
                    </text>
                  </g>
                );
              })}

              {/* Cross-hairs */}
              {[0, 45, 90, 135].map(deg => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <line key={deg}
                    x1={cx - outerR * Math.cos(rad)} y1={cy - outerR * Math.sin(rad)}
                    x2={cx + outerR * Math.cos(rad)} y2={cy + outerR * Math.sin(rad)}
                    stroke="rgba(59,130,246,0.08)" strokeWidth={0.5} />
                );
              })}

              {/* Hotspot dots */}
              {nearest.map(d => {
                const color = getRiskColor(d.hotspot.score);
                const isHov = hovered === d.hotspot.name;
                return (
                  <g key={d.hotspot.name}>
                    {isHov && (
                      <motion.circle
                        cx={d.svgX} cy={d.svgY}
                        r={14} fill={color} fillOpacity={0.15}
                        initial={{ r: 6 }} animate={{ r: 18, opacity: 0 }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                    <motion.circle
                      cx={d.svgX} cy={d.svgY} r={isHov ? 6 : 5}
                      fill={color} fillOpacity={isHov ? 1 : 0.85}
                      stroke={color} strokeWidth={isHov ? 2 : 1} strokeOpacity={0.5}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: Math.random() * 0.3 }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHovered(d.hotspot.name)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onSelectLocation({
                        displayName: `${d.hotspot.name}, ${d.hotspot.country}`,
                        lat: d.hotspot.lat,
                        lon: d.hotspot.lon,
                      })}
                    />
                    {isHov && (
                      <foreignObject x={d.svgX + 8} y={d.svgY - 28} width={120} height={50}>
                        <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-[10px] shadow-xl">
                          <p className="font-semibold text-foreground">{d.hotspot.flag} {d.hotspot.name}</p>
                          <p className="text-muted-foreground">{Math.round(d.km).toLocaleString()} km · score {d.hotspot.score}</p>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}

              {/* Center — selected location */}
              <circle cx={cx} cy={cy} r={7} fill="#3b82f6" fillOpacity={0.9} stroke="#60a5fa" strokeWidth={2} />
              <motion.circle cx={cx} cy={cy} r={12} fill="none" stroke="#3b82f6" strokeWidth={1}
                animate={{ r: [10, 20], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />

              {/* North indicator */}
              <text x={cx} y={10} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize={9} fontFamily="monospace" fontWeight="bold">N</text>

              {/* Center label */}
              <text x={cx} y={cy + 20} textAnchor="middle" fill="rgba(96,165,250,0.7)" fontSize={9} fontFamily="monospace">
                {locationName.length > 14 ? locationName.slice(0, 14) + "…" : locationName}
              </text>
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-3 justify-center mt-2">
              {[
                { color: "#ef4444", label: "Extreme (75+)" },
                { color: "#f97316", label: "High (50–74)" },
                { color: "#f59e0b", label: "Moderate" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[9px] text-muted-foreground/40">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Nearest hotspots list ── */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">
            Nearest High-Risk Zones
          </p>
          {listItems.length === 0 ? (
            <div className="text-sm text-muted-foreground/40 py-8 text-center border border-border rounded-xl">
              No high-risk hotspots within {MAX_RANGE_KM.toLocaleString()} km
            </div>
          ) : (
            listItems.map((d, i) => {
              const color = getRiskColor(d.hotspot.score);
              const isHov = hovered === d.hotspot.name;
              return (
                <motion.button
                  key={d.hotspot.name}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onMouseEnter={() => setHovered(d.hotspot.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectLocation({
                    displayName: `${d.hotspot.name}, ${d.hotspot.country}`,
                    lat: d.hotspot.lat,
                    lon: d.hotspot.lon,
                  })}
                  data-testid={`radar-hotspot-${d.hotspot.name.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    isHov
                      ? "border-white/20 bg-white/5"
                      : "border-border bg-card hover:border-white/12 hover:bg-white/3"
                  )}
                >
                  <span className="text-base flex-shrink-0">{d.hotspot.flag}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground/90 truncate">{d.hotspot.name}</p>
                      <span className="text-[9px] text-muted-foreground/40 truncate">{d.hotspot.country}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-muted-foreground/30 flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground/50">
                        {Math.round(d.km).toLocaleString()} km away
                      </span>
                      {d.hotspot.score >= 75 && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400/80 ml-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> EXTREME
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-base font-bold tabular-nums" style={{ color }}>{d.hotspot.score}</span>
                    <div className="w-12 h-1 bg-white/6 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.hotspot.score}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
