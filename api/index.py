"""
CRZP APEX — Vercel serverless API.
Mirrors server/routes.ts so the whole backend runs as one Python function.
All /api/* requests are rewritten here by vercel.json (original path in ?path=).
"""
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "ml"))

from ml_model import compute_risk  # noqa: E402

# ── In-memory result cache (5-min TTL, per warm instance) ────────────────────
CACHE_TTL = 5 * 60
RESULT_CACHE: dict = {}


def _key(location: str) -> str:
    return location.lower().strip()


def get_cache(location: str):
    entry = RESULT_CACHE.get(_key(location))
    if not entry:
        return None
    if time.time() - entry["ts"] > CACHE_TTL:
        RESULT_CACHE.pop(_key(location), None)
        return None
    return entry["data"]


def set_cache(location: str, data) -> None:
    if len(RESULT_CACHE) >= 150:
        oldest = min(RESULT_CACHE, key=lambda k: RESULT_CACHE[k]["ts"])
        RESULT_CACHE.pop(oldest, None)
    RESULT_CACHE[_key(location)] = {"data": data, "ts": time.time()}


def run_model(location: str):
    cached = get_cache(location)
    if cached is not None:
        return cached
    result = compute_risk(location)
    if result.get("error"):
        raise RuntimeError(result["error"])
    set_cache(location, result)
    return result


PRIMARY_PLACE_TYPES = ("city", "town", "village", "country")
CITY_SUFFIX_RE = re.compile(r"\s+(Division|District|Metropolitan Municipality|Municipality)$")


# ── Route handlers — each returns (status, body_dict, extra_headers) ─────────
def search_locations(qs):
    q = (qs.get("q") or [""])[0].strip()[:200]
    if not q:
        return 200, [], {}
    r = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": q, "format": "json", "limit": 12, "accept-language": "en", "addressdetails": 1},
        headers={"User-Agent": "CrisisRiskPredictor/2.0"},
        timeout=8,
    )
    out = []
    items = [
        i for i in r.json()
        if (i.get("type") or i.get("class") or "") in
        ("city", "town", "village", "county", "administrative", "country", "state")
        and float(i.get("importance") or 0) > 0.25
    ]
    # Real cities/countries first, then admin areas ("Karachi" before "Karachi Division")
    items.sort(key=lambda i: (
        (i.get("type") or i.get("class") or "") not in PRIMARY_PLACE_TYPES,
        -float(i.get("importance") or 0),
    ))
    seen = set()
    for item in items:
        addr = item.get("address") or {}
        city = (addr.get("city") or addr.get("town") or addr.get("village")
                or addr.get("county") or item["display_name"].split(",")[0]).strip()
        if item.get("addresstype") in ("city", "town"):
            # OSM sometimes names a city by its admin boundary ("Karachi Division")
            city = CITY_SUFFIX_RE.sub("", city) or city
        country = addr.get("country") or ""
        display_name = f"{city}, {country}" if country and country != city else city
        if display_name in seen:
            continue
        seen.add(display_name)
        out.append({
            "place_id": str(item["place_id"]),
            "display_name": display_name,
            "lat": item["lat"],
            "lon": item["lon"],
        })
        if len(out) == 6:
            break
    return 200, out, {}


def analyze(qs):
    location = (qs.get("location") or [""])[0].strip()[:300]
    fresh = (qs.get("fresh") or [""])[0].lower() in ("1", "true", "yes")
    if not location:
        return 400, {"message": "location param required"}, {}
    cached = None if fresh else get_cache(location)
    if cached is not None:
        return 200, {**cached, "lastUpdated": cached.get("lastUpdated") or _now()}, {"X-Cache": "HIT"}
    if fresh:
        RESULT_CACHE.pop(_key(location), None)
    return 200, run_model(location), {"X-Cache": "MISS"}


def compare(qs):
    loc1 = (qs.get("loc1") or [""])[0].strip()[:300]
    loc2 = (qs.get("loc2") or [""])[0].strip()[:300]
    if not loc1 or not loc2:
        return 400, {"message": "loc1 and loc2 required"}, {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        r1, r2 = pool.map(run_model, [loc1, loc2])
    return 200, {"location1": r1, "location2": r2}, {}


def model_info(_qs):
    with open(os.path.join(ROOT, "ml", "model_metadata.json"), encoding="utf8") as f:
        return 200, json.load(f), {}


def clear_cache(qs, headers):
    token = os.environ.get("CACHE_ADMIN_TOKEN")
    if token and headers.get("x-admin-token") != token:
        return 403, {"message": "Forbidden"}, {}
    location = (qs.get("location") or [""])[0].strip()
    if location:
        RESULT_CACHE.pop(_key(location), None)
    else:
        RESULT_CACHE.clear()
    return 200, {"cleared": location or "all"}, {}


def feedback(body):
    message = body.get("message")
    if not isinstance(message, str) or not message.strip():
        return 400, {"message": "message is required"}, {}
    name = body.get("name")
    email = body.get("email")
    rating = body.get("rating")
    payload = {
        "name": (name.strip()[:100] if isinstance(name, str) else "") or "Anonymous",
        "email": email.strip()[:254] if isinstance(email, str) else "",
        "message": message.strip()[:2000],
        "rating": rating if isinstance(rating, int) and 1 <= rating <= 5 else None,
        "ts": _now(),
    }

    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        stars = "⭐" * payload["rating"] if payload["rating"] else "No rating"
        html = f"""
            <div style="font-family:monospace;background:#0a0f1e;color:#e2e8f0;padding:24px;border-radius:8px;max-width:560px">
              <div style="border-bottom:1px solid #1e293b;padding-bottom:12px;margin-bottom:16px">
                <span style="color:#f59e0b;font-weight:bold;font-size:18px">CRZP APEX</span>
                <span style="color:#64748b;font-size:12px;margin-left:8px">Feedback Received</span>
              </div>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="color:#64748b;padding:4px 0;width:80px">From</td><td style="color:#e2e8f0">{payload["name"]}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0">Rating</td><td>{stars}</td></tr>
                <tr><td style="color:#64748b;padding:4px 0">Time</td><td style="color:#94a3b8;font-size:12px">{payload["ts"]}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#0f172a;border-left:3px solid #f59e0b;border-radius:4px">
                <p style="margin:0;color:#cbd5e1;line-height:1.6">{payload["message"].replace(chr(10), "<br>")}</p>
              </div>
            </div>"""
        try:
            r = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_key}"},
                json={
                    "from": "CRZP Feedback <onboarding@resend.dev>",
                    "to": ["crzpai.app@gmail.com"],
                    "subject": f"CRZP Feedback from {payload['name']} {stars}",
                    "html": html,
                },
                timeout=8,
            )
            if r.ok:
                return 200, {"status": "sent"}, {}
            print("Resend error:", r.text, file=sys.stderr)
        except Exception as e:
            print("Feedback email send failed:", e, file=sys.stderr)

    # Serverless filesystem is read-only — fall back to function logs.
    print("[feedback]", json.dumps(payload), file=sys.stderr)
    return 200, {"status": "logged"}, {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


GET_ROUTES = {
    "/api/locations/search": search_locations,
    "/api/risk/analyze": analyze,
    "/api/risk/compare": compare,
    "/api/model-info": model_info,
}


class handler(BaseHTTPRequestHandler):
    def _route(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        path = "/api/" + qs.pop("path")[0] if "path" in qs else parsed.path
        return path.rstrip("/"), qs

    def _run(self, fn, error_message):
        try:
            status, body, headers = fn()
        except Exception as e:
            print(f"{error_message}: {e}", file=sys.stderr)
            status, body, headers = 500, {"message": error_message}, {}
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path, qs = self._route()
        fn = GET_ROUTES.get(path)
        if not fn:
            return self._run(lambda: (404, {"message": "Not found"}, {}), "Not found")
        self._run(lambda: fn(qs), "Request failed")

    def do_DELETE(self):
        path, qs = self._route()
        if path != "/api/risk/cache":
            return self._run(lambda: (404, {"message": "Not found"}, {}), "Not found")
        self._run(lambda: clear_cache(qs, self.headers), "Request failed")

    def do_POST(self):
        path, _qs = self._route()
        if path != "/api/feedback":
            return self._run(lambda: (404, {"message": "Not found"}, {}), "Not found")

        def go():
            length = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except json.JSONDecodeError:
                body = {}
            return feedback(body if isinstance(body, dict) else {})

        self._run(go, "Feedback submission failed")
