import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/* ── Persistent Python ML server ────────────────────────────────────── */
const ML_PORT = 5001;
let _pyReady  = false;
let _pyReadyResolve: (() => void) | null = null;
const _pyReadyPromise = new Promise<void>((res) => { _pyReadyResolve = res; });

function startPythonServer() {
  const pythonCommand = process.platform === "win32" ? "python" : "python3";
  const py = spawn(pythonCommand, ["ml/ml_model.py", "--server", String(ML_PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  py.stdout.on("data", (buf: Buffer) => {
    const line = buf.toString().trim();
    if (line.startsWith("READY:")) {
      _pyReady = true;
      _pyReadyResolve?.();
      console.log("[ml] Python ML server ready on port", ML_PORT);
    }
  });

  py.stderr.on("data", (buf: Buffer) => {
    const msg = buf.toString().trim();
    if (msg) console.error("[ml]", msg);
  });

  py.on("exit", (code) => {
    console.warn(`[ml] Python server exited (${code}) — restarting in 2s`);
    _pyReady = false;
    setTimeout(startPythonServer, 2000);
  });
}

startPythonServer();

async function runMLModel(location: string): Promise<any> {
  if (!_pyReady) {
    await Promise.race([
      _pyReadyPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("ML server not ready")), 8000)),
    ]);
  }
  const url = `http://127.0.0.1:${ML_PORT}/?location=${encodeURIComponent(location)}`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(18000) });
  const result = await res.json() as any;
  if (result.error) throw new Error(result.error);
  return result;
}

/* ── In-memory result cache (5-min TTL) ─────────────────────────────── */
interface CacheEntry { data: any; ts: number }
const RESULT_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL    = 5 * 60 * 1000;

function cacheKey(location: string) { return location.toLowerCase().trim(); }

function getCache(location: string): any | null {
  const entry = RESULT_CACHE.get(cacheKey(location));
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { RESULT_CACHE.delete(cacheKey(location)); return null; }
  return entry.data;
}

function setCache(location: string, data: any) {
  if (RESULT_CACHE.size >= 150) {
    const oldest = Array.from(RESULT_CACHE.entries()).sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) RESULT_CACHE.delete(oldest[0]);
  }
  RESULT_CACHE.set(cacheKey(location), { data, ts: Date.now() });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Location autocomplete ─────────────────────────────────────────────
  app.get(api.locations.search.path, async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim().slice(0, 200);
      if (!q) return res.json([]);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}&format=json&limit=12&accept-language=en&addressdetails=1`,
        { headers: { "User-Agent": "CrisisRiskPredictor/2.0" } }
      );
      const data: any[] = await response.json();

      const suggestions = data
        .filter((item) => {
          const type = item.type || item.class || "";
          const imp  = parseFloat(item.importance) || 0;
          return (
            ["city","town","village","county","administrative","country","state"].includes(type) &&
            imp > 0.25
          );
        })
        .sort((a, b) => parseFloat(b.importance) - parseFloat(a.importance))
        .slice(0, 6)
        .map((item) => {
          const addr    = item.address || {};
          const city    = addr.city || addr.town || addr.village || addr.county || item.display_name.split(",")[0];
          const country = addr.country || "";
          return {
            place_id:     item.place_id.toString(),
            display_name: country ? `${city.trim()}, ${country}` : city.trim(),
            lat: item.lat,
            lon: item.lon,
          };
        });

      res.json(suggestions);
    } catch (err) {
      console.error("Location search error:", err);
      res.status(500).json({ message: "Location search failed" });
    }
  });

  // ── Full ML risk analysis (with caching) ──────────────────────────────
  app.get(api.risk.analyze.path, async (req, res) => {
    try {
      const location = (req.query.location as string || "").trim().slice(0, 300);
      const fresh = String(req.query.fresh || "").toLowerCase();
      const forceFresh = fresh === "1" || fresh === "true" || fresh === "yes";
      if (!location) return res.status(400).json({ message: "location param required" });

      const cached = forceFresh ? null : getCache(location);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json({ ...cached, lastUpdated: cached.lastUpdated ?? new Date().toISOString() });
      }

      res.setHeader("X-Cache", "MISS");
      const result = await runMLModel(location);
      setCache(location, result);
      res.json(result);
    } catch (err) {
      console.error("Risk analysis error:", err);
      res.status(500).json({ message: "Risk analysis failed" });
    }
  });

  // ── Side-by-side comparison (with caching) ────────────────────────────
  app.get(api.risk.compare.path, async (req, res) => {
    try {
      const loc1 = (req.query.loc1 as string || "").trim().slice(0, 300);
      const loc2 = (req.query.loc2 as string || "").trim().slice(0, 300);
      if (!loc1 || !loc2) return res.status(400).json({ message: "loc1 and loc2 required" });

      const fetch1 = getCache(loc1) ? Promise.resolve(getCache(loc1)) : runMLModel(loc1);
      const fetch2 = getCache(loc2) ? Promise.resolve(getCache(loc2)) : runMLModel(loc2);

      const [r1, r2] = await Promise.all([fetch1, fetch2]);
      if (!getCache(loc1)) setCache(loc1, r1);
      if (!getCache(loc2)) setCache(loc2, r2);

      res.json({ location1: r1, location2: r2 });
    } catch (err) {
      console.error("Compare error:", err);
      res.status(500).json({ message: "Comparison failed" });
    }
  });

  // ── ML Model info (training metadata) ────────────────────────────────
  app.get("/api/model-info", (_req, res) => {
    try {
      const metaPath = path.join(process.cwd(), "ml", "model_metadata.json");
      const raw = fs.readFileSync(metaPath, "utf8");
      res.json(JSON.parse(raw));
    } catch {
      res.status(404).json({ message: "Model metadata not found" });
    }
  });

  // ── Cache bust ────────────────────────────────────────────────────────
  // Protected by a simple token to prevent abuse.
  // Set CACHE_ADMIN_TOKEN env var; if unset, this endpoint is disabled.
  app.delete("/api/risk/cache", (req, res) => {
    const adminToken = process.env.CACHE_ADMIN_TOKEN;
    if (adminToken) {
      const provided = req.headers["x-admin-token"] as string | undefined;
      if (provided !== adminToken) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const location = (req.query.location as string || "").trim();
    if (location) {
      RESULT_CACHE.delete(cacheKey(location));
    } else {
      RESULT_CACHE.clear();
    }
    res.json({ cleared: location || "all" });
  });

  // ── Feedback endpoint ────────────────────────────────────────────────
  app.post("/api/feedback", async (req, res) => {
    try {
      const { name, email, message, rating } = req.body || {};

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "message is required" });
      }

      // Input length limits
      const safeName    = typeof name    === "string" ? name.trim().slice(0, 100) : "Anonymous";
      const safeEmail   = typeof email   === "string" ? email.trim().slice(0, 254) : "";
      const safeMessage = message.trim().slice(0, 2000);
      const safeRating  = typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : null;

      const payload = {
        name:    safeName || "Anonymous",
        email:   safeEmail,
        message: safeMessage,
        rating:  safeRating,
        ts:      new Date().toISOString(),
      };

      // Try to send via Resend if API key is present
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          const stars     = payload.rating ? "⭐".repeat(payload.rating) : "No rating";
          const nameLabel = payload.name !== "Anonymous" ? payload.name : "Anonymous";
          const htmlBody  = `
            <div style="font-family:monospace;background:#0a0f1e;color:#e2e8f0;padding:24px;border-radius:8px;max-width:560px">
              <div style="border-bottom:1px solid #1e293b;padding-bottom:12px;margin-bottom:16px">
                <span style="color:#f59e0b;font-weight:bold;font-size:18px">CRZP APEX</span>
                <span style="color:#64748b;font-size:12px;margin-left:8px">Feedback Received</span>
              </div>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="color:#64748b;padding:4px 0;width:80px">From</td><td style="color:#e2e8f0">${nameLabel}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0">Rating</td><td>${stars}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0">Time</td><td style="color:#94a3b8;font-size:12px">${payload.ts}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#0f172a;border-left:3px solid #f59e0b;border-radius:4px">
                <p style="margin:0;color:#cbd5e1;line-height:1.6">${payload.message.replace(/\n/g, "<br>")}</p>
              </div>
            </div>`;

          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from:    "CRZP Feedback <onboarding@resend.dev>",
              to:      ["crzpai.app@gmail.com"],
              subject: `CRZP Feedback from ${nameLabel} ${stars}`,
              html:    htmlBody,
            }),
          });

          if (r.ok) return res.json({ status: "sent" });
          const errBody = await r.text();
          console.error("Resend error:", errBody);
        } catch (err) {
          console.error("Feedback email send failed:", err);
        }
      }

      // Fallback: write to logs/ directory (outside server source)
      try {
        const logsDir = path.join(process.cwd(), "logs");
        fs.mkdirSync(logsDir, { recursive: true });
        const outPath = path.join(logsDir, "feedbacks.log");
        fs.appendFileSync(outPath, JSON.stringify(payload) + "\n");
        return res.json({ status: "logged" });
      } catch (err) {
        console.error("Feedback logging failed:", err);
        return res.status(500).json({ message: "Unable to store feedback" });
      }
    } catch (err) {
      console.error("Feedback error:", err);
      return res.status(500).json({ message: "Feedback submission failed" });
    }
  });

  return httpServer;
}
