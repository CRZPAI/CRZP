import React, { useRef } from "react";
import { useAnimationFrame } from "framer-motion";

/* ── City data ─────────────────────────────────────────────────────────── */
const CITIES = [
  { lat: 40.7,  lon: -74.0,  label: "NYC", risk: "high"   },
  { lat: 51.5,  lon: -0.1,   label: "LON", risk: "low"    },
  { lat: 48.8,  lon: 2.35,   label: "PAR", risk: "low"    },
  { lat: 35.7,  lon: 139.7,  label: "TKY", risk: "low"    },
  { lat: -33.9, lon: 18.4,   label: "CPT", risk: "med"    },
  { lat: 25.2,  lon: 55.3,   label: "DXB", risk: "med"    },
  { lat: 19.4,  lon: -99.1,  label: "MEX", risk: "med"    },
  { lat: 55.7,  lon: 37.6,   label: "MOS", risk: "high"   },
  { lat: 31.2,  lon: 121.5,  label: "SHA", risk: "low"    },
  { lat: 28.6,  lon: 77.2,   label: "DEL", risk: "med"    },
  { lat: 33.9,  lon: 35.5,   label: "BEY", risk: "high"   },
  { lat: 30.0,  lon: 31.2,   label: "CAI", risk: "med"    },
];

const ARC_PAIRS = [[0,1],[1,7],[2,5],[3,8],[4,1],[6,0],[9,5],[11,1]];

/* ── Helpers ──────────────────────────────────────────────────────────── */
function ll2xyz(lat: number, lon: number) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function rotY(x: number, z: number, a: number) {
  return { rx: x * Math.cos(a) + z * Math.sin(a), rz: -x * Math.sin(a) + z * Math.cos(a) };
}

function project(lat: number, lon: number, rot: number, cx: number, cy: number, r: number) {
  const { x, y, z } = ll2xyz(lat, lon);
  const { rx, rz } = rotY(x, z, rot);
  return { sx: cx + rx * r, sy: cy - y * r, visible: rz > -0.05, depth: rz };
}

/* ── Main component ────────────────────────────────────────────────────── */
export function Globe3D({ size = 360 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef    = useRef(0);

  useAnimationFrame((t, delta) => {
    rotRef.current += delta * 0.000048;
    draw(canvasRef.current, rotRef.current, t);
  });

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size }}
        className="rounded-full"
      />
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, rot: number, t: number) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W  = canvas.width;
  const H  = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r  = W * 0.42;

  ctx.clearRect(0, 0, W, H);

  /* ── 1. Far-field atmosphere bloom ──────────────────────────────────── */
  const bloom = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.5);
  bloom.addColorStop(0,   "rgba(245,158,11,0.00)");
  bloom.addColorStop(0.55,"rgba(245,158,11,0.04)");
  bloom.addColorStop(0.8, "rgba(59,130,246,0.06)");
  bloom.addColorStop(1,   "transparent");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  /* ── 2. Sphere body ──────────────────────────────────────────────────── */
  const sphere = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.04, cx, cy, r);
  sphere.addColorStop(0,    "rgba(40, 70, 160, 0.55)");
  sphere.addColorStop(0.35, "rgba(10, 22, 65, 0.80)");
  sphere.addColorStop(0.75, "rgba(4,  10, 30, 0.92)");
  sphere.addColorStop(1,    "rgba(2,  6,  18, 0.98)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sphere;
  ctx.fill();

  /* ── 3. Clip grid lines inside sphere ───────────────────────────────── */
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  /* ── 4. Latitude parallels (static, depth-shaded) ───────────────────── */
  const LATS = [-75,-60,-45,-30,-15, 0, 15,30,45,60,75];
  for (const lat of LATS) {
    const phi = (90 - lat) * Math.PI / 180;
    const ly  = cy - r * Math.cos(phi);
    const lrx = r * Math.sin(phi);
    const lry = lrx * 0.16; // perspective foreshortening

    if (lrx < 1) continue;
    ctx.beginPath();
    ctx.ellipse(cx, ly, lrx, lry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = lat === 0
      ? "rgba(245,158,11,0.22)"
      : "rgba(100,160,255,0.055)";
    ctx.lineWidth = lat === 0 ? 0.9 : 0.45;
    ctx.stroke();
  }

  /* ── 5. Longitude meridians (rotate with globe) ─────────────────────── */
  const LON_STEPS = 12;
  for (let i = 0; i < LON_STEPS; i++) {
    const angle  = (i / LON_STEPS) * Math.PI * 2 + rot;
    const cosA   = Math.cos(angle);
    const ellipX = Math.abs(cosA) * r;

    if (ellipX < 2) continue;

    const alpha = Math.abs(cosA) * 0.06;
    ctx.beginPath();
    ctx.ellipse(cx, cy, ellipX, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,160,255,${alpha})`;
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }

  ctx.restore();

  /* ── 6. Atmosphere rim glow ──────────────────────────────────────────── */
  const rim = ctx.createRadialGradient(cx, cy, r * 0.84, cx, cy, r * 1.06);
  rim.addColorStop(0,   "transparent");
  rim.addColorStop(0.6, "rgba(59,130,246,0.09)");
  rim.addColorStop(1,   "rgba(100,160,255,0.18)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = rim;
  ctx.stroke();

  /* ── 7. Gloss highlight ──────────────────────────────────────────────── */
  const gloss = ctx.createRadialGradient(cx - r*0.33, cy - r*0.33, 0, cx - r*0.15, cy - r*0.15, r*0.65);
  gloss.addColorStop(0, "rgba(255,255,255,0.09)");
  gloss.addColorStop(1, "transparent");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  /* ── 8. Arc connections between cities ──────────────────────────────── */
  for (const [ai, bi] of ARC_PAIRS) {
    const ca = CITIES[ai];
    const cb = CITIES[bi];
    const pa = project(ca.lat, ca.lon, rot, cx, cy, r * 0.97);
    const pb = project(cb.lat, cb.lon, rot, cx, cy, r * 0.97);
    if (!pa.visible || !pb.visible) continue;

    const minDepth = Math.min(pa.depth, pb.depth);
    if (minDepth < 0.1) continue;

    const mx   = (pa.sx + pb.sx) / 2;
    const my   = (pa.sy + pb.sy) / 2;
    const dist = Math.hypot(pb.sx - pa.sx, pb.sy - pa.sy);
    const cpY  = my - dist * 0.38;

    const arcAlpha = minDepth * 0.22;
    const grad = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
    grad.addColorStop(0,   `rgba(245,158,11,${arcAlpha})`);
    grad.addColorStop(0.5, `rgba(245,158,11,${arcAlpha * 1.5})`);
    grad.addColorStop(1,   `rgba(245,158,11,${arcAlpha})`);

    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.quadraticCurveTo(mx, cpY, pb.sx, pb.sy);
    ctx.strokeStyle = grad;
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ── 9. City dots + pulse rings + labels ─────────────────────────────── */
  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i];
    const p = project(city.lat, city.lon, rot, cx, cy, r * 0.97);
    if (!p.visible) continue;

    const alpha = 0.25 + p.depth * 0.75;
    const ds    = 2.5 + p.depth * 2.5;

    const riskColor =
      city.risk === "high" ? `rgba(239,68,68,${alpha})`    :
      city.risk === "med"  ? `rgba(245,158,11,${alpha})`   :
                             `rgba(52,211,153,${alpha})`;

    const riskGlow  =
      city.risk === "high" ? `rgba(239,68,68,`    :
      city.risk === "med"  ? `rgba(245,158,11,`   :
                             `rgba(52,211,153,`;

    // Pulse ring
    const pulse = ((Math.sin(t * 0.0018 + i * 1.1) + 1) / 2);
    const pr    = ds + pulse * 10;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, pr, 0, Math.PI * 2);
    ctx.fillStyle = `${riskGlow}${alpha * 0.06 * (1 - pulse)})`;
    ctx.fill();

    // Outer halo
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, ds + 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = `${riskGlow}${alpha * 0.4})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Core dot
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, ds, 0, Math.PI * 2);
    ctx.fillStyle = riskColor;
    ctx.fill();

    // Inner bright core
    const coreGrad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, ds);
    coreGrad.addColorStop(0, `rgba(255,255,255,${alpha * 0.5})`);
    coreGrad.addColorStop(1, "transparent");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, ds, 0, Math.PI * 2);
    ctx.fill();

    // Label (only when clearly visible)
    if (p.depth > 0.35) {
      ctx.font = `bold ${11 + p.depth * 4}px monospace`;
      ctx.fillStyle = `${riskGlow}${alpha * 0.65})`;
      ctx.fillText(city.label, p.sx + ds + 4, p.sy - 2);
    }
  }

  /* ── 10. Border ring ────────────────────────────────────────────────── */
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245,158,11,0.25)";
  ctx.lineWidth = 0.9;
  ctx.stroke();

  /* ── 11. Rotating scan line over the sphere ──────────────────────────── */
  const scanPhase = (t * 0.00025) % 1;
  if (scanPhase < 0.6) {
    const scanY = cy - r + (scanPhase / 0.6) * r * 2;
    const halfW = Math.sqrt(Math.max(0, r * r - (scanY - cy) ** 2));
    const alpha = Math.sin(scanPhase * Math.PI / 0.6) * 0.18;

    const scanGrad = ctx.createLinearGradient(cx - halfW, scanY, cx + halfW, scanY);
    scanGrad.addColorStop(0, "transparent");
    scanGrad.addColorStop(0.35, `rgba(245,158,11,${alpha})`);
    scanGrad.addColorStop(0.65, `rgba(245,158,11,${alpha})`);
    scanGrad.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.moveTo(cx - halfW, scanY);
    ctx.lineTo(cx + halfW, scanY);
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
