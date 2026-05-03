import { useEffect, useRef, useCallback, useState } from "react";
import * as d3geo from "d3-geo";
import * as topojson from "topojson-client";
import { Layers3, Plus, Minus } from "lucide-react";
import { getRiskColor } from "@/lib/utils";

/** Resolved hex colors safe for use in Canvas (no CSS variables) */
function canvasRiskColor(score: number): string {
  if (score <= 25) return "#10b981";
  if (score <= 50) return "#f59e0b";
  if (score <= 75) return "#f97316";
  return "#e11d48";
}

/** Convert a #rrggbb hex to rgba(r,g,b,a) for Canvas gradient stops */
function hexRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Props ───────────────────────────────────────────────────────────── */
interface Props {
  lat?: number;
  lon?: number;
  riskScore?: number;
  locationName?: string;
  height?: number;
  onCountryClick?: (name: string, lat: number, lon: number) => void;
}

/* ══════════════════════════════════════════════════════════════════════
   Accurate risk scores — Fragile States Index 2024 + Global Peace Index
   2024 + ACLED active-conflict data. Scores are 0–100 (higher = riskier).
   ══════════════════════════════════════════════════════════════════════ */
const RISK: Record<string, number> = {
  /* ── Active-war / extreme fragility (80-100) ───────────────────────── */
  "Syria":                        97,
  "Yemen":                        96,
  "Somalia":                      95,
  "South Sudan":                  94,
  "Dem. Rep. Congo":              93,
  "Central African Republic":     92,
  "Sudan":                        91,
  "Afghanistan":                  90,
  "Ukraine":                      86, // active war
  "Myanmar":                      85,
  "Haiti":                        87,
  "Mali":                         84,
  "Burkina Faso":                 83,
  "North Korea":                  82,
  "Ethiopia":                     81,
  "Niger":                        80,

  /* ── High-risk / significant fragility (60-79) ─────────────────────── */
  "Libya":                        78,
  "Nigeria":                      76,
  "Chad":                         75,
  "Iraq":                         74,
  "Palestine":                    85,
  "Israel":                       63,
  "Lebanon":                      72,
  "Guinea":                       71,
  "Zimbabwe":                     70,
  "Pakistan":                     69,
  "Cameroon":                     68,
  "Eritrea":                      67,
  "Burundi":                      66,
  "Venezuela":                    65,
  "Russia":                       73, // war aggressor + repression
  "Iran":                         72,
  "Congo":                        62,
  "Mozambique":                   62,
  "Uganda":                       61,
  "Tanzania":                     60,

  /* ── Elevated risk (45-59) ──────────────────────────────────────────── */
  "Kenya":                        58,
  "Liberia":                      56,
  "Sierra Leone":                 55,
  "Colombia":                     54,
  "Honduras":                     53,
  "Egypt":                        55,
  "Mexico":                       52,
  "Guatemala":                    50,
  "Kyrgyzstan":                   50,
  "Tajikistan":                   52,
  "Belarus":                      60,
  "Cuba":                         55,
  "Saudi Arabia":                 50,
  "Turkey":                       48,
  "Bangladesh":                   46,
  "Philippines":                  46,
  "Ecuador":                      47,
  "Peru":                         45,
  "Bolivia":                      44,
  "Papua New Guinea":             48,
  "Zambia":                       45,
  "Angola":                       48,
  "Madagascar":                   47,
  "Rwanda":                       52,
  "Guinea-Bissau":                57,
  "Comoros":                      50,

  /* ── Moderate risk (25-44) ──────────────────────────────────────────── */
  "India":                        42,
  "China":                        40,
  "Brazil":                       38,
  "South Africa":                 44,
  "Indonesia":                    36,
  "Algeria":                      44,
  "Morocco":                      42,
  "Tunisia":                      42,
  "Jordan":                       44,
  "Serbia":                       28,
  "Bosnia and Herz.":             30,
  "Albania":                      26,
  "North Macedonia":              25,
  "Georgia":                      38,
  "Armenia":                      40,
  "Azerbaijan":                   42,
  "Kazakhstan":                   36,
  "Uzbekistan":                   38,
  "Turkmenistan":                 44,
  "Nicaragua":                    48,
  "El Salvador":                  44,
  "Paraguay":                     30,
  "Thailand":                     36,
  "Sri Lanka":                    42,
  "Nepal":                        38,
  "Cambodia":                     36,
  "Laos":                         38,
  "Vietnam":                      32,
  "Malaysia":                     25,
  "Oman":                         26,
  "Bahrain":                      38,
  "Kuwait":                       28,
  "Qatar":                        22,
  "UAE":                          22,
  "Ghana":                        36,
  "Senegal":                      38,
  "Ivory Coast":                  40,
  "Benin":                        38,
  "Togo":                         42,
  "Gabon":                        38,
  "Equatorial Guinea":            44,
  "Namibia":                      28,
  "Botswana":                     22,
  "Eswatini":                     42,
  "Lesotho":                      38,

  /* ── Low risk (0-24) ────────────────────────────────────────────────── */
  "Argentina":                    28,
  "Chile":                        18,
  "Uruguay":                      14,
  "Costa Rica":                   14,
  "Panama":                       26,
  "Dominican Republic":           32,
  "Jamaica":                      38,
  "United States of America":     18,
  "Canada":                        8,
  "United Kingdom":               17,
  "Ireland":                      10,
  "Germany":                      11,
  "France":                       20,
  "Netherlands":                   9,
  "Belgium":                      14,
  "Luxembourg":                    5,
  "Switzerland":                   4,
  "Austria":                       8,
  "Sweden":                        8,
  "Norway":                        4,
  "Denmark":                       5,
  "Finland":                       8,
  "Iceland":                       2,
  "Portugal":                      8,
  "Spain":                        12,
  "Italy":                        16,
  "Greece":                       18,
  "Poland":                       19,
  "Czech Republic":                9,
  "Slovakia":                     12,
  "Hungary":                      18,
  "Romania":                      18,
  "Bulgaria":                     22,
  "Croatia":                      16,
  "Slovenia":                      8,
  "Estonia":                      12,
  "Latvia":                       14,
  "Lithuania":                    15,
  "Moldova":                      35,
  "Japan":                         8,
  "South Korea":                  15,
  "Taiwan":                       24,
  "Mongolia":                     22,
  "Singapore":                     5,
  "Australia":                     6,
  "New Zealand":                   4,

  /* ── Additional countries (no duplicates) ───────────────────────────── */
  "United Arab Emirates":         22,
  "Bhutan":                       20,
  "Cyprus":                       20,
  "Djibouti":                     42,
  "Fiji":                         18,
  "Guyana":                       38,
  "Malawi":                       40,
  "Malta":                         8,
  "Montenegro":                   20,
  "Timor-Leste":                  38,
  "Suriname":                     35,
  
  "Trinidad and Tobago":          30,
  "Brunei":                       15,
  "Maldives":                     18,
  "Mauritius":                    14,
  "Cabo Verde":                   20,
  "Seychelles":                   14,
  "São Tomé and Príncipe":        28,
  "Belize":                       35,
  "Bahamas":                      28,
  "Barbados":                     14,
  "Solomon Islands":              30,
  "Vanuatu":                      22,
  "Samoa":                        14,
  "Mauritania":                   52,
  "Gambia":                       38,
  "Swaziland":                    42,
  "Kosovo":                       25,
  "Bosnia and Herzegovina":       30,
  "W. Sahara":                    55,
  "Falkland Is.":                  8,
  "Greenland":                     5,
};

/* ── Country centroids (lon, lat) for click-to-search ────────────────── */
const CENTROIDS: Record<string, [number, number]> = {
  "Syria": [38.5, 35.0], "Yemen": [48.5, 15.5], "Somalia": [46.2, 5.8],
  "South Sudan": [31.3, 7.0], "Dem. Rep. Congo": [23.6, -2.9],
  "Central African Republic": [20.9, 6.6], "Sudan": [30.2, 15.6],
  "Afghanistan": [67.7, 33.9], "Ukraine": [31.2, 49.0], "Myanmar": [96.6, 19.2],
  "Haiti": [-72.3, 18.9], "Mali": [-2.0, 17.6], "Burkina Faso": [-1.6, 12.4],
  "North Korea": [127.5, 40.3], "Ethiopia": [40.5, 9.1], "Niger": [8.1, 17.6],
  "Libya": [17.2, 26.3], "Nigeria": [8.7, 9.1], "Chad": [18.7, 15.5],
  "Iraq": [43.7, 33.2], "Palestine": [35.2, 31.9], "Israel": [34.9, 31.5],
  "Lebanon": [35.9, 33.9], "Guinea": [-11.8, 11.0], "Zimbabwe": [29.9, -19.0],
  "Pakistan": [69.3, 30.4], "Cameroon": [12.4, 5.7], "Venezuela": [-66.6, 6.4],
  "Russia": [60.0, 60.0], "Iran": [53.7, 32.4], "Congo": [15.8, -0.2],
  "Mozambique": [34.9, -18.7], "Uganda": [32.3, 1.4], "Tanzania": [35.0, -6.4],
  "Kenya": [37.9, 0.0], "Colombia": [-74.3, 4.6], "Mexico": [-102.6, 23.6],
  "Egypt": [30.8, 26.8], "Turkey": [35.2, 39.1], "India": [78.7, 20.6],
  "China": [104.2, 35.9], "Brazil": [-51.9, -10.8], "South Africa": [24.7, -29.0],
  "Indonesia": [117.8, -2.5], "United States of America": [-100.4, 38.6],
  "Canada": [-96.8, 56.1], "United Kingdom": [-2.9, 54.1], "Germany": [10.4, 51.2],
  "France": [2.2, 46.2], "Australia": [133.8, -25.7], "Japan": [138.3, 36.2],
  "Saudi Arabia": [45.1, 24.1], "Algeria": [3.0, 28.0], "Morocco": [-5.8, 31.8],
  "Argentina": [-65.2, -34.6], "Chile": [-71.5, -35.7],
  "Poland": [19.1, 51.9],
};

/* ── Permanent crisis hotspots ───────────────────────────────────────── */
const HOTSPOTS = [
  { lon: 69.18,  lat: 34.53, risk: 90, name: "Kabul"     },
  { lon: 36.29,  lat: 33.51, risk: 97, name: "Damascus"  },
  { lon: 30.52,  lat: 50.45, risk: 86, name: "Kyiv"      },
  { lon: 45.34,  lat:  2.05, risk: 95, name: "Mogadishu" },
  { lon: 44.21,  lat: 15.35, risk: 96, name: "Sanaa"     },
  { lon: 32.53,  lat: 15.55, risk: 91, name: "Khartoum"  },
  { lon: -8.0,   lat: 12.65, risk: 84, name: "Bamako"    },
  { lon: 18.56,  lat:  4.36, risk: 92, name: "Bangui"    },
  { lon: 13.18,  lat: 32.90, risk: 78, name: "Tripoli"   },
  { lon: 44.44,  lat: 33.34, risk: 74, name: "Baghdad"   },
  { lon: 34.75,  lat: 31.50, risk: 85, name: "Gaza"      },
  { lon: 37.61,  lat: 55.76, risk: 73, name: "Moscow"    },
];

/* ── Colour helpers ──────────────────────────────────────────────────── */
function countryFill(name: string, alpha = 1): string {
  const s = RISK[name] ?? 15;
  const a = alpha;
  if (s >= 80) return `rgba(239,68,68,${0.82 * a})`;
  if (s >= 60) return `rgba(249,115,22,${0.74 * a})`;
  if (s >= 40) return `rgba(245,158,11,${0.66 * a})`;
  if (s >= 20) return `rgba(34,197,94,${0.58 * a})`;
  return `rgba(80,145,230,${0.54 * a})`;
}
function countryStroke(name: string): string {
  const s = RISK[name] ?? 15;
  if (s >= 80) return "rgba(239,68,68,0.55)";
  if (s >= 60) return "rgba(249,115,22,0.45)";
  if (s >= 40) return "rgba(245,158,11,0.35)";
  return "rgba(255,255,255,0.20)";
}

type ViewMode = "heatmap" | "political" | "infra";
const MODE_TRANSITION_MS = 650;

function countryFillByMode(name: string, mode: ViewMode, alpha = 1): string {
  if (mode === "heatmap") return countryFill(name, alpha);

  if (mode === "infra") {
    const risk = RISK[name] ?? 15;
    const infra = Math.max(0, Math.min(100, 100 - risk));
    if (infra >= 75) return `rgba(100,180,255,${0.54 * alpha})`;
    if (infra >= 50) return `rgba(70,140,220,${0.50 * alpha})`;
    if (infra >= 25) return `rgba(40,100,180,${0.48 * alpha})`;
    return `rgba(15,50,120,${0.46 * alpha})`;
  }

  const palette = [
    "rgba(30,64,175,",
    "rgba(55,48,163,",
    "rgba(12,74,110,",
    "rgba(17,94,89,",
    "rgba(88,28,135,",
    "rgba(127,29,29,",
    "rgba(107,33,168,",
  ];
  const idx = Math.abs(name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % palette.length;
  return `${palette[idx]}${0.44 * alpha})`;
}

function countryStrokeByMode(name: string, mode: ViewMode): string {
  if (mode === "heatmap") return countryStroke(name);
  if (mode === "infra") return "rgba(255,255,255,0.16)";
  return "rgba(255,255,255,0.22)";
}

/* ── ISO numeric → country name (world-atlas 110m) ──────────────────── */
const ISO_NAMES: Record<string, string> = {
  "4":"Afghanistan","8":"Albania","12":"Algeria","24":"Angola",
  "32":"Argentina","36":"Australia","40":"Austria","50":"Bangladesh",
  "56":"Belgium","64":"Bhutan","68":"Bolivia","76":"Brazil",
  "100":"Bulgaria","104":"Myanmar","108":"Burundi","112":"Belarus",
  "116":"Cambodia","120":"Cameroon",
  "124":"Canada","140":"Central African Republic","144":"Sri Lanka",
  "148":"Chad","152":"Chile","156":"China","170":"Colombia","178":"Congo",
  "180":"Dem. Rep. Congo","188":"Costa Rica","191":"Croatia","192":"Cuba",
  "196":"Cyprus","203":"Czech Republic","204":"Benin","208":"Denmark",
  "214":"Dominican Republic","218":"Ecuador","818":"Egypt",
  "222":"El Salvador","231":"Ethiopia","232":"Eritrea","233":"Estonia",
  "242":"Fiji","246":"Finland","250":"France","262":"Djibouti",
  "266":"Gabon","276":"Germany","288":"Ghana",
  "300":"Greece","316":"Guam","320":"Guatemala","324":"Guinea",
  "328":"Guyana","332":"Haiti",
  "340":"Honduras","348":"Hungary","352":"Iceland","356":"India",
  "360":"Indonesia","364":"Iran","368":"Iraq","372":"Ireland","376":"Israel",
  "380":"Italy","384":"Ivory Coast","388":"Jamaica","392":"Japan",
  "398":"Kazakhstan","400":"Jordan","404":"Kenya","408":"North Korea",
  "410":"South Korea","414":"Kuwait","417":"Kyrgyzstan","418":"Laos",
  "422":"Lebanon","426":"Lesotho","428":"Latvia","430":"Liberia",
  "434":"Libya","440":"Lithuania","450":"Madagascar","454":"Malawi",
  "458":"Malaysia","462":"Maldives","466":"Mali","470":"Malta",
  "484":"Mexico","496":"Mongolia","498":"Moldova","499":"Montenegro",
  "504":"Morocco","508":"Mozambique","516":"Namibia",
  "524":"Nepal","528":"Netherlands","554":"New Zealand",
  "558":"Nicaragua","562":"Niger","566":"Nigeria","578":"Norway",
  "586":"Pakistan","591":"Panama","598":"Papua New Guinea","604":"Peru",
  "608":"Philippines","616":"Poland","620":"Portugal","624":"Guinea-Bissau",
  "626":"Timor-Leste","630":"Puerto Rico","634":"Qatar",
  "642":"Romania","643":"Russia","646":"Rwanda",
  "682":"Saudi Arabia","686":"Senegal","688":"Serbia","694":"Sierra Leone",
  "702":"Singapore","703":"Slovakia","704":"Vietnam","705":"Slovenia",
  "706":"Somalia","710":"South Africa","716":"Zimbabwe","724":"Spain",
  "728":"South Sudan","729":"Sudan","740":"Suriname","748":"Eswatini",
  "752":"Sweden","756":"Switzerland","760":"Syria","762":"Tajikistan",
  "764":"Thailand","768":"Togo","780":"Trinidad and Tobago",
  "784":"United Arab Emirates","788":"Tunisia",
  "792":"Turkey","795":"Turkmenistan","800":"Uganda","804":"Ukraine",
  "807":"North Macedonia","826":"United Kingdom",
  "834":"Tanzania","840":"United States of America",
  "858":"Uruguay","860":"Uzbekistan","862":"Venezuela",
  "887":"Yemen","894":"Zambia","31":"Azerbaijan","51":"Armenia",
  "72":"Botswana","96":"Brunei","275":"Palestine",
};

function enrichTopology(topo: any) {
  const geos = topo?.objects?.countries?.geometries;
  if (!geos) return;
  for (const g of geos) {
    if (!g.properties) g.properties = {};
    // Prefer any existing name present in the topojson, otherwise fall back
    // to our ISO -> name mapping. Some topojson files include a `name`
    // property already; don't overwrite that with an empty string.
    const mapped = ISO_NAMES[String(g.id)];
    g.properties.name = (g.properties.name && String(g.properties.name).trim()) || mapped || "";
  }
}

/* ══════════════════════════════════════════════════════════════════════ */
export function GlobeView({
  lat, lon, riskScore = 50, locationName, height = 420, onCountryClick,
}: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const topoRef    = useRef<any>(null);
  const featRef    = useRef<GeoJSON.Feature[]>([]);

  /* Current rotation */
  const rotRef = useRef({ lon: -20, lat: -22 });
  /* Destination when location selected */
  const destRef   = useRef<{ lon: number; lat: number } | null>(null);
  const autoRef   = useRef(true);
  const phaseRef  = useRef(0);

  /* Canvas dimensions (logical pixels, before DPR) */
  const dimRef = useRef({ w: 500, h: 500 });
  const visibleRef = useRef({ w: 500, h: 500 });

  /* Drag state */
  const dragRef = useRef({ active: false, x: 0, y: 0, moved: 0 });

  /* Zoom */
  // Default zoom: two "unzoom" steps from 2.0 (each step ≈0.18), i.e. 2 - 0.36 = 1.64
  const zoomRef       = useRef(1.64);   // current (eased)
  const targetZoomRef = useRef(1.64);   // destination

  /* Hover / pinned state */
  const [hovered, setHovered] = useState<{ name: string; risk: number; x: number; y: number } | null>(null);
  const [pinned,  setPinned]  = useState<{ name: string; risk: number; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const prevModeRef = useRef<ViewMode>("heatmap");
  const modeTransitionStartRef = useRef<number>(0);

  /* Auto-spin resume timer */
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Throttle hover detection */
  const lastHoverTs = useRef(0);

  /* ── Location effect ────────────────────────────────────────────────── */
  useEffect(() => {
    if (lat && lon) {
      destRef.current = { lon: -lon, lat: Math.max(-65, Math.min(30, -lat * 0.55)) };
      autoRef.current = false;
    } else {
      destRef.current = null;
      autoRef.current = true;
    }
  }, [lat, lon]);

  /* ── Projection factory ─────────────────────────────────────────────── */
  // Scale multipliers: smaller when viewing a specific location (detail mode).
  const BASE_SCALE = 0.34;
  const DETAIL_SCALE = 0.22;
  const makeProjection = useCallback((w: number, h: number) => {
    const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
    const scale = Math.min(w, h) * scaleMult;
    return d3geo
      .geoOrthographic()
      .scale(scale)
      .translate([w / 2, h / 2])
      .rotate([rotRef.current.lon, rotRef.current.lat, 0])
      .clipAngle(90);
  }, []);

  /* ── Main draw ──────────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = dimRef.current.w;
    const H = dimRef.current.h;
    const cx = W / 2, cy = H / 2;

    /* Smooth zoom easing */
    zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.10;
    const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
    const scale = Math.min(W, H) * scaleMult * zoomRef.current;

    /* Update rotation */
    if (!dragRef.current.active) {
      if (autoRef.current) {
        rotRef.current.lon -= 0.18;
      } else if (destRef.current) {
        rotRef.current.lon += (destRef.current.lon - rotRef.current.lon) * 0.07;
        rotRef.current.lat += (destRef.current.lat - rotRef.current.lat) * 0.07;
      }
    }
    phaseRef.current += 0.035;

    const projection = d3geo
      .geoOrthographic()
      .scale(scale)
      .translate([cx, cy])
      .rotate([rotRef.current.lon, rotRef.current.lat, 0])
      .clipAngle(90);

    const pathGen = d3geo.geoPath(projection, ctx);
    const now = performance.now();
    const isModeTransitioning =
      modeTransitionStartRef.current > 0 &&
      now - modeTransitionStartRef.current < MODE_TRANSITION_MS;
    const modeBlend = isModeTransitioning
      ? (now - modeTransitionStartRef.current) / MODE_TRANSITION_MS
      : 1;

    if (!isModeTransitioning) {
      prevModeRef.current = viewMode;
      modeTransitionStartRef.current = 0;
    }

    ctx.clearRect(0, 0, W, H);

    /* ── Star field (outside globe) ─────────────────────────────────────── */
    ctx.save();
    for (let i = 0; i < 180; i++) {
      const sx = (i * 1237 + 17) % W;
      const sy = (i * 1789 + 31) % H;
      if ((sx - cx) ** 2 + (sy - cy) ** 2 < (scale * 1.18) ** 2) continue;
      const bright = 0.08 + (i % 7) / 7 * 0.38;
      const sz = 0.25 + (i % 3) * 0.35;
      ctx.beginPath();
      ctx.arc(sx, sy, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${bright})`;
      ctx.fill();
    }
    ctx.restore();

    /* ── Multi-layer atmosphere bloom ───────────────────────────────────── */
    // Inner blue halo
    const glow = ctx.createRadialGradient(cx, cy, scale * 0.87, cx, cy, scale * 1.30);
    glow.addColorStop(0,    "rgba(59,130,246,0.32)");
    glow.addColorStop(0.35, "rgba(59,130,246,0.14)");
    glow.addColorStop(0.7,  "rgba(30,80,180,0.05)");
    glow.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 1.30, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    // Outer amber bloom
    const bloom = ctx.createRadialGradient(cx, cy, scale * 1.08, cx, cy, scale * 1.75);
    bloom.addColorStop(0,   "rgba(245,158,11,0.10)");
    bloom.addColorStop(0.5, "rgba(245,158,11,0.04)");
    bloom.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 1.75, 0, Math.PI * 2);
    ctx.fillStyle = bloom;
    ctx.fill();

    /* ── Ocean ──────────────────────────────────────────────────────────── */
    const ocean = ctx.createRadialGradient(
      cx - scale * 0.28, cy - scale * 0.26, 0, cx, cy, scale,
    );
    ocean.addColorStop(0,    "#112248");
    ocean.addColorStop(0.35, "#071a38");
    ocean.addColorStop(0.7,  "#040f24");
    ocean.addColorStop(1,    "#020818");
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.fillStyle = ocean;
    ctx.fill();

    /* ── Graticule ──────────────────────────────────────────────────────── */
    const grat = d3geo.geoGraticule().step([20, 20])();
    ctx.beginPath();
    pathGen(grat);
    ctx.strokeStyle = "rgba(100,165,255,0.09)";
    ctx.lineWidth = 0.45;
    ctx.stroke();
    // Equator highlight
    const equator = d3geo.geoGraticule().step([360, 180])();
    ctx.beginPath();
    pathGen(equator);
    ctx.strokeStyle = "rgba(245,158,11,0.12)";
    ctx.lineWidth = 0.65;
    ctx.stroke();

    /* Countries */
    const hovName = hovered?.name ?? null;
    if (featRef.current.length) {
      for (const feature of featRef.current) {
        const name: string = (feature.properties as any)?.name ?? "";
        const isHov = name === hovName && name !== "";

        if (isModeTransitioning) {
          ctx.beginPath();
          pathGen(feature);
          ctx.fillStyle = countryFillByMode(name, prevModeRef.current, Math.max(0.12, 1 - modeBlend));
          ctx.fill();

          ctx.beginPath();
          pathGen(feature);
          const activeAlpha = isHov ? 0.85 + modeBlend * 0.9 : 0.16 + modeBlend * 0.95;
          ctx.fillStyle = countryFillByMode(name, viewMode, activeAlpha);
          ctx.fill();
        } else {
          ctx.beginPath();
          pathGen(feature);
          ctx.fillStyle = isHov ? countryFillByMode(name, viewMode, 1.55) : countryFillByMode(name, viewMode);
          ctx.fill();
        }

        if (isHov) {
          ctx.strokeStyle = "rgba(255,255,255,0.60)";
          ctx.lineWidth = 1.1;
        } else {
          ctx.strokeStyle = countryStrokeByMode(name, viewMode);
          ctx.lineWidth = 0.55;
        }
        ctx.stroke();
      }
    }

    /* ── Directional lighting — simulated sun from upper-left ─────────────── */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2); ctx.clip();
    // Light source highlight (upper-left)
    const light = ctx.createRadialGradient(
      cx - scale * 0.52, cy - scale * 0.44, 0,
      cx + scale * 0.1,  cy + scale * 0.1,  scale * 1.15,
    );
    light.addColorStop(0,    "rgba(255,245,200,0.11)");
    light.addColorStop(0.35, "rgba(255,235,180,0.04)");
    light.addColorStop(0.7,  "rgba(0,0,0,0)");
    light.addColorStop(1,    "rgba(0,0,10,0.22)");
    ctx.fillStyle = light; ctx.fillRect(cx - scale, cy - scale, scale * 2, scale * 2);
    ctx.restore();

    /* ── Arc connections between nearby crisis zones ─────────────────────── */
    if (scale > 10) {
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2); ctx.clip();
      const visibleHots: Array<{ px: number; py: number; risk: number }> = [];
      for (const h of HOTSPOTS) {
        const pt = projection([h.lon, h.lat]);
        if (!pt) continue;
        const rLon = ((h.lon + rotRef.current.lon) * Math.PI) / 180;
        const rLat = ((h.lat + rotRef.current.lat) * Math.PI) / 180;
        if (Math.cos(rLat) * Math.cos(rLon) < 0.15) continue;
        visibleHots.push({ px: pt[0], py: pt[1], risk: h.risk });
      }
      for (let i = 0; i < visibleHots.length; i++) {
        for (let j = i + 1; j < visibleHots.length; j++) {
          const a = visibleHots[i], b = visibleHots[j];
          const dist = Math.hypot(b.px - a.px, b.py - a.py);
          if (dist > scale * 1.1 || dist < 1) continue;
          const mx = (a.px + b.px) / 2;
          const my = (a.py + b.py) / 2;
          const pull = dist * 0.32;
          const cpx = mx - (b.py - a.py) * 0.18;
          const cpy = my - pull;
          const arcAlpha = parseFloat(Math.max(0.02, Math.min(0.22, 0.20 - dist / (scale * 5))).toFixed(3));
          if (!isFinite(arcAlpha)) continue;
          const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
          grad.addColorStop(0,   `rgba(239,68,68,${arcAlpha})`);
          grad.addColorStop(0.5, `rgba(249,115,22,${Math.min(0.35, arcAlpha * 1.5)})`);
          grad.addColorStop(1,   `rgba(239,68,68,${arcAlpha})`);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.quadraticCurveTo(cpx, cpy, b.px, b.py);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (isModeTransitioning) {
      ctx.save();

      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.clip();

      const ringGlow = ctx.createRadialGradient(cx, cy, scale * 0.34, cx, cy, scale * 1.08);
      ringGlow.addColorStop(0, `rgba(245,158,11,${0.10 * (1 - modeBlend)})`);
      ringGlow.addColorStop(0.65, `rgba(56,189,248,${0.16 * modeBlend})`);
      ringGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = ringGlow;
      ctx.fill();

      const sweepX = cx - scale + modeBlend * scale * 2;
      const sweep = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
      sweep.addColorStop(0, "rgba(0,0,0,0)");
      sweep.addColorStop(0.5, `rgba(255,255,255,${0.13 * (1 - Math.abs(modeBlend - 0.5) * 2)})`);
      sweep.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sweep;
      ctx.fillRect(cx - scale, cy - scale, scale * 2, scale * 2);

      ctx.restore();
    }

    /* ── Hotspot crisis markers ──────────────────────────────────────────── */
    for (const h of HOTSPOTS) {
      const pt = projection([h.lon, h.lat]);
      if (!pt) continue;
      const rLon = ((h.lon + rotRef.current.lon) * Math.PI) / 180;
      const rLat = ((h.lat + rotRef.current.lat) * Math.PI) / 180;
      if (Math.cos(rLat) * Math.cos(rLon) < 0.06) continue;
      const [px, py] = pt;
      const col = canvasRiskColor(h.risk);
      // Two independent pulse rings at different frequencies
      const p1 = 0.5 + 0.5 * Math.sin(phaseRef.current * 0.9 + h.risk * 0.07);
      const p2 = 0.5 + 0.5 * Math.sin(phaseRef.current * 1.5 + h.risk * 0.13 + 1.8);
      // Glow fill
      const fg = ctx.createRadialGradient(px, py, 0, px, py, 16);
      fg.addColorStop(0, hexRgba(col, 0.28)); fg.addColorStop(1, hexRgba(col, 0));
      ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fillStyle = fg; ctx.fill();
      // Outer slow ring
      ctx.beginPath(); ctx.arc(px, py, 5 + p1 * 9, 0, Math.PI * 2);
      ctx.strokeStyle = hexRgba(col, 0.55 - p1 * 0.50); ctx.lineWidth = 0.85; ctx.stroke();
      // Inner fast ring
      ctx.beginPath(); ctx.arc(px, py, 3 + p2 * 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = hexRgba(col, 0.65 - p2 * 0.58); ctx.lineWidth = 0.65; ctx.stroke();
      // Core dot
      ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      // Bright white inner core
      ctx.beginPath(); ctx.arc(px, py, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill();
    }

    /* Selected location marker */
    if (lat && lon) {
      const pt = projection([lon, lat]);
      if (pt) {
        const rLon = ((lon  + rotRef.current.lon) * Math.PI) / 180;
        const rLat = ((lat  + rotRef.current.lat) * Math.PI) / 180;
        if (Math.cos(rLat) * Math.cos(rLon) > 0.02) {
          const [px, py] = pt;
          const col = canvasRiskColor(riskScore);
          const locPulse = 0.5 + 0.5 * Math.sin(phaseRef.current);
          const mg = ctx.createRadialGradient(px, py, 0, px, py, 20);
          mg.addColorStop(0, hexRgba(col, 0.28));
          mg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2);
          ctx.fillStyle = mg; ctx.fill();
          for (let r = 0; r < 2; r++) {
            const rr = 6 + r * 6 + locPulse * 4.5;
            ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2);
            ctx.strokeStyle = hexRgba(col, 0.7 - r * 0.28);
            ctx.lineWidth = r === 0 ? 1.6 : 0.8; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill();
          if (locationName) {
            const label = locationName.substring(0, 18);
            ctx.font = "bold 9px Inter, sans-serif";
            ctx.textAlign = "center";
            const tw = ctx.measureText(label).width + 12;
            ctx.fillStyle = "rgba(0,0,0,0.80)";
            ctx.beginPath();
            (ctx as any).roundRect?.(px - tw / 2, py - 25, tw, 14, 3);
            ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.fillText(label, px, py - 14);
          }
        }
      }
    }

    /* ── Globe rim ───────────────────────────────────────────────────────── */
    // Thick outer glow ring
    ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(80,140,255,0.45)"; ctx.lineWidth = 2.2; ctx.stroke();
    // Inner subtle rim (guard against negative radius on tiny canvases)
    const innerRim = Math.max(0.5, scale - 1);
    ctx.beginPath(); ctx.arc(cx, cy, innerRim, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(130,180,255,0.18)"; ctx.lineWidth = 1.2; ctx.stroke();

    /* ── Terminator — limb brightening at the edge ───────────────────────── */
    const limb = ctx.createRadialGradient(cx, cy, scale * 0.80, cx, cy, scale * 1.01);
    limb.addColorStop(0,   "rgba(0,0,0,0)");
    limb.addColorStop(0.6, "rgba(50,110,230,0.05)");
    limb.addColorStop(1,   "rgba(80,150,255,0.18)");
    ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.fillStyle = limb; ctx.fill();

    /* ── Specular shine highlight ─────────────────────────────────────────── */
    const shine = ctx.createRadialGradient(
      cx - scale * 0.30, cy - scale * 0.32, 0,
      cx - scale * 0.08, cy - scale * 0.08, scale * 0.72,
    );
    shine.addColorStop(0,    "rgba(200,225,255,0.14)");
    shine.addColorStop(0.3,  "rgba(140,185,255,0.06)");
    shine.addColorStop(0.65, "rgba(80,140,255,0.02)");
    shine.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.fillStyle = shine; ctx.fill();

    rafRef.current = requestAnimationFrame(draw);
  }, [lat, lon, riskScore, locationName, hovered, viewMode]);

  /* ── Hover country detection ─────────────────────────────────────────── */
  const detectHover = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || dragRef.current.active) return;
    const now = performance.now();
    if (now - lastHoverTs.current < 60) return; // ~16fps is enough
    lastHoverTs.current = now;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const W = dimRef.current.w;
    const H = dimRef.current.h;
    const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
    const scale = Math.min(W, H) * scaleMult * zoomRef.current;
    const cx = W / 2, cy = H / 2;

    /* Check if inside globe circle */
    if ((x - cx) ** 2 + (y - cy) ** 2 > scale ** 2) {
      setHovered(null);
      return;
    }

    const proj = d3geo
      .geoOrthographic()
      .scale(scale)
      .translate([cx, cy])
      .rotate([rotRef.current.lon, rotRef.current.lat, 0])
      .clipAngle(90);

    const inv = proj.invert?.([x, y]);
    if (!inv) { setHovered(null); return; }
    const [iLon, iLat] = inv;
    if (!isFinite(iLon) || !isFinite(iLat)) { setHovered(null); return; }

    let found: GeoJSON.Feature | null = null;
    for (const f of featRef.current) {
      if (d3geo.geoContains(f, [iLon, iLat])) { found = f; break; }
    }

    if (found) {
      const name: string = (found.properties as any)?.name ?? "";
      const risk = RISK[name] ?? 8;
      setHovered({ name, risk, x, y });
    } else {
      setHovered(null);
    }
  }, []);

  /* Schedule auto-spin resume after user drags then idles */
  const scheduleResumeAutoSpin = useCallback((delayMs = 2000) => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    /* Don't resume if a location is locked in */
    if (lat || lon) return;
    spinTimerRef.current = setTimeout(() => {
      autoRef.current = true;
    }, delayMs);
  }, [lat, lon]);

  /* Synchronous country detection at canvas (x, y) — returns name + coords or null */
  const pickCountryAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const W = dimRef.current.w;
    const H = dimRef.current.h;
    const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
    const scale = Math.min(W, H) * scaleMult * zoomRef.current;
    const cx = W / 2, cy = H / 2;
    /* Must be inside globe circle */
    if ((x - cx) ** 2 + (y - cy) ** 2 > scale ** 2) return null;
    const proj = d3geo
      .geoOrthographic()
      .scale(scale)
      .translate([cx, cy])
      .rotate([rotRef.current.lon, rotRef.current.lat, 0])
      .clipAngle(90);
    const inv = proj.invert?.([x, y]);
    if (!inv || !isFinite(inv[0]) || !isFinite(inv[1])) return null;
    const [iLon, iLat] = inv;
    for (const f of featRef.current) {
      if (d3geo.geoContains(f, [iLon, iLat])) {
        const name: string = (f.properties as any)?.name ?? "";
        if (!name) continue;
        const centroid = CENTROIDS[name];
        return { name, lon: centroid?.[0] ?? iLon, lat: centroid?.[1] ?? iLat };
      }
    }
    return null;
  }, []);

  /* ── Mouse / touch event handlers ───────────────────────────────────── */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { active: true, x: e.clientX, y: e.clientY, moved: 0 };
    autoRef.current = false;
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
      const W = dimRef.current.w;
      const H = dimRef.current.h;
      const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
      const scale = Math.min(W, H) * scaleMult * zoomRef.current;
      rotRef.current.lon += (dx / scale) * 60;
      rotRef.current.lat  = Math.max(-80, Math.min(80,
        rotRef.current.lat  - (dy / scale) * 60,
      ));
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
    } else {
      detectHover(e.clientX, e.clientY);
    }
  }, [detectHover]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDrag = dragRef.current.moved > 5;
    dragRef.current.active = false;
    dragRef.current.moved  = 0;

    if (wasDrag) {
      /* After dragging, resume spin after idle */
      scheduleResumeAutoSpin(2000);
      return;
    }

    /* Click: detect country synchronously at exact click position */
    const hit = pickCountryAt(e.clientX, e.clientY);

    if (hit && onCountryClick) {
      onCountryClick(hit.name, hit.lat, hit.lon);
      setHovered({ name: hit.name, risk: RISK[hit.name] ?? 8, x: e.clientX, y: e.clientY });
      /* Don't reschedule spin — page is about to transition */
    } else {
      /* Ocean / miss click — resume spin immediately */
      setPinned(null);
      setHovered(null);
      if (!lat && !lon) autoRef.current = true;
    }
  }, [onCountryClick, pickCountryAt, lat, lon, scheduleResumeAutoSpin]);

  const onMouseLeave = useCallback(() => {
    dragRef.current.active = false;
    setHovered(null);
    scheduleResumeAutoSpin(1500);
  }, [scheduleResumeAutoSpin]);

  /* ── Touch event handlers (mobile) ──────────────────────────────────── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragRef.current = { active: true, x: t.clientX, y: t.clientY, moved: 0 };
    autoRef.current = false;
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !dragRef.current.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.x;
    const dy = t.clientY - dragRef.current.y;
    dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
    const W = dimRef.current.w;
    const H = dimRef.current.h;
    const scaleMult = (lat || lon) ? DETAIL_SCALE : BASE_SCALE;
    const scale = Math.min(W, H) * scaleMult * zoomRef.current;
    rotRef.current.lon += (dx / scale) * 60;
    rotRef.current.lat  = Math.max(-80, Math.min(80,
      rotRef.current.lat - (dy / scale) * 60,
    ));
    dragRef.current.x = t.clientX;
    dragRef.current.y = t.clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const wasDrag = dragRef.current.moved > 8;
    dragRef.current.active = false;
    dragRef.current.moved  = 0;

    if (wasDrag) {
      scheduleResumeAutoSpin(2000);
      return;
    }

    /* Tap: use last known touch position */
    const t = e.changedTouches[0];
    if (!t) { if (!lat && !lon) autoRef.current = true; return; }

    const hit = pickCountryAt(t.clientX, t.clientY);
    if (hit && onCountryClick) {
      onCountryClick(hit.name, hit.lat, hit.lon);
    } else {
      setHovered(null);
      if (!lat && !lon) autoRef.current = true;
    }
  }, [onCountryClick, pickCountryAt, lat, lon, scheduleResumeAutoSpin]);

  /* Scroll-wheel zoom */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // Disable scroll zoom when in detail mode (lat/lon focus)
    if (lat || lon) return;
    const step = e.deltaY > 0 ? -0.14 : 0.14;
    const maxZoom = 4.0;
    targetZoomRef.current = Math.max(0.45, Math.min(maxZoom, targetZoomRef.current + step));
    autoRef.current = false;
    scheduleResumeAutoSpin();
  }, [scheduleResumeAutoSpin]);

  const zoomBy = useCallback((step: number) => {
    // No programmatic zoom while in detail mode
    if (lat || lon) return;
    const maxZoom = 4.0;
    targetZoomRef.current = Math.max(0.45, Math.min(maxZoom, targetZoomRef.current + step));
    autoRef.current = false;
    scheduleResumeAutoSpin(2500);
  }, [scheduleResumeAutoSpin]);

  const resetView = useCallback(() => {
    targetZoomRef.current = 1;
    if (lat && lon) {
      destRef.current = { lon: -lon, lat: Math.max(-65, Math.min(30, -lat * 0.55)) };
      autoRef.current = false;
      return;
    }
    rotRef.current = { lon: -20, lat: -22 };
    autoRef.current = true;
  }, [lat, lon]);

  /* ── Topology load + RAF start ──────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        enrichTopology(topo);
        topoRef.current = topo;
        featRef.current = (
          topojson.feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection
        ).features;
      })
      .catch(() => {});

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, [draw]);

  /* ── Resize handling ────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const r = canvas.parentElement?.getBoundingClientRect();
      if (!r) return;
      const dpr = window.devicePixelRatio || 1;
      // Pre-allocate large canvas for zoom room. Use smaller canvas when in detail mode.
      const canvasScale = (lat || lon) ? 1.1 : 2;
      const canvasWidth = r.width * canvasScale;
      const canvasHeight = r.height * canvasScale;
      
      // Store FULL canvas dimensions so drawing uses the full space
      dimRef.current = { w: canvasWidth, h: canvasHeight };
      visibleRef.current = { w: r.width, h: r.height };
      
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      // When a location is selected, bias the canvas left so the globe sits
      // to the left and doesn't cover right-side detail panels. Use a stronger bias in detail mode.
      if (lat || lon) {
        canvas.style.left = `${-(canvasWidth - r.width) * 0.75}px`;
      } else {
        canvas.style.left = `${-(canvasWidth - r.width) / 2}px`;
      }
      canvas.style.top = `${-(canvasHeight - r.height) / 2}px`;
      
      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  /* ── Cursor style ─────────────────────────────────────────────────────── */
  const cursor = dragRef.current.active
    ? "grabbing"
    : hovered
    ? "pointer"
    : "grab";

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className="w-full relative select-none z-40 hide-scrollbars"
      style={{ height, cursor, overflow: "visible" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "none" }}
      />

      {/* ── Layer & zoom controls ─────────────────────────────────────────── */}
      <div className={`absolute bottom-10 right-16 z-30 flex items-end gap-2 ${lat || lon ? "hidden" : ""}`}>
        {isLayerMenuOpen && (
          <div className="w-36 rounded-lg border border-white/[0.10] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
            style={{ background: "rgba(4,7,18,0.92)", backdropFilter: "blur(16px)", pointerEvents: "auto" }}>
            {([
              { id: "heatmap",   label: "HEATMAP"   },
              { id: "political", label: "POLITICAL"  },
              { id: "infra",     label: "INFRA"      },
            ] as const).map((item, idx) => {
              const active = viewMode === item.id;
              return (
                <button key={item.id} type="button"
                  onClick={() => {
                    if (viewMode !== item.id) {
                      prevModeRef.current = viewMode;
                      modeTransitionStartRef.current = performance.now();
                    }
                    setViewMode(item.id);
                  }}
                  className="w-full h-9 px-3.5 text-left text-[10px] font-black tracking-[0.15em] transition-colors cursor-pointer"
                  style={{
                    background: active ? "rgba(245,158,11,0.15)" : "transparent",
                    color: active ? "#f59e0b" : "rgba(255,255,255,0.55)",
                    borderBottom: idx < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    pointerEvents: "auto",
                  }}
                >{item.label}</button>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="w-9 h-9 rounded-lg border border-white/[0.09] text-white/60 inline-flex items-center justify-center hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/[0.07] transition-all cursor-pointer"
            style={{ background: "rgba(4,7,18,0.85)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}
            title="Toggle layer menu" aria-label="Toggle layer menu">
            <Layers3 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => zoomBy(0.18)}
            className="w-9 h-9 rounded-lg border border-white/[0.09] text-white/60 inline-flex items-center justify-center hover:border-white/20 hover:text-white/90 hover:bg-white/[0.05] transition-all cursor-pointer"
            style={{ background: "rgba(4,7,18,0.85)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}
            title="Zoom in" aria-label="Zoom in">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => zoomBy(-0.18)}
            className="w-9 h-9 rounded-lg border border-white/[0.09] text-white/60 inline-flex items-center justify-center hover:border-white/20 hover:text-white/90 hover:bg-white/[0.05] transition-all cursor-pointer"
            style={{ background: "rgba(4,7,18,0.85)", backdropFilter: "blur(12px)", pointerEvents: "auto" }}
            title="Zoom out" aria-label="Zoom out">
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Hover tooltip */}
      {hovered && hovered.name && (
        <div
          className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg border text-xs backdrop-blur-md"
          style={{
            left: Math.min(hovered.x - visibleRef.current.w / 2 + 14, visibleRef.current.w - 170),
            top:  Math.max(hovered.y - visibleRef.current.h / 2 - 48, 4),
            background: "rgba(5,10,22,0.92)",
            borderColor: getRiskColor(hovered.risk) + "55",
            boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getRiskColor(hovered.risk) }} />
            <span className="font-semibold text-white/95 leading-tight">{hovered.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-sm" style={{ color: getRiskColor(hovered.risk) }}>
              {hovered.risk}
            </span>
            <span className="text-white/45">
              {hovered.risk >= 80 ? "Extreme" : hovered.risk >= 60 ? "High" : hovered.risk >= 40 ? "Moderate" : "Low"} risk
            </span>
          </div>
          {onCountryClick && (
            <div className="text-white/35 text-[9px] border-t border-white/8 pt-1.5">
              Click to analyse →
            </div>
          )}
        </div>
      )}

      {/* Location badge */}
      {locationName && (
        <div className="absolute top-3 right-3 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm flex items-center gap-1.5 z-10">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: getRiskColor(riskScore) }}
          />
          {locationName.split(",")[0]}
          <span className="font-bold ml-1" style={{ color: getRiskColor(riskScore) }}>
            {riskScore}
          </span>
        </div>
      )}
    </div>
  );
}
