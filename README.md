<div align="center">

<img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/logo.png" alt="CRZP APEX Logo" width="110" />

<br />

<img src="https://img.shields.io/badge/CRZP-APEX-f59e0b?style=for-the-badge&labelColor=020617&color=f59e0b" alt="CRZP APEX" />

# CRZP APEX
### Crisis Risk Zone Predictor — Geopolitical Intelligence Platform

**Real-time AI-powered risk scoring for any city, country, or region on Earth.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML%20Engine-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

---

> 🏆 **<img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/google-colored.svg" height="18" alt="Google" /> AI Seekho 2026 — Phase 1 Project**
> Built as part of Google's AI Seekho initiative to democratize access to AI-powered tools for social impact.

---

[Live Demo](https://crzp.replit.app) · [Documentation](https://crzp.replit.app/docs) · [Report a Bug](https://github.com/i-anasop/CRZP/issues) · [Request a Feature](https://github.com/i-anasop/CRZP/issues)

</div>

---

## Table of Contents

- [What is CRZP?](#what-is-crzp)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [ML & Data Pipeline](#ml--data-pipeline)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Build & Production](#build--production)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Roadmap](#roadmap)
- [About Google AI Seekho](#about-google-ai-seekho)
- [License](#license)

---

## What is CRZP?

**CRZP APEX** (Crisis Risk Zone Predictor) is a full-stack geopolitical intelligence platform that computes a real-time composite **Risk Score (0–100)** for any city, country, or region on Earth. It fuses live global event data with a trained ML ensemble to give analysts, researchers, and security teams an instant, structured picture of geopolitical risk.

Think of it as a radar system for global instability — pulling signals from humanitarian incident databases, news event streams, and trained geopolitical baselines, then delivering a clean intelligence brief in seconds.

### Why it exists

Traditional risk assessment tools are expensive, opaque, or delayed by days. CRZP makes real-time geopolitical risk intelligence **open, fast, and explainable** — powered by public data sources and a transparent ML pipeline.

---

## Key Features

| Feature | Description |
|---|---|
| **Universal Location Search** | Autocomplete for any city, country, or region worldwide via Nominatim geocoding |
| **Real-Time Risk Score** | Composite 0–100 RSI (Risk Severity Index) computed on every request |
| **5-Axis Risk Breakdown** | Kinetic · Political · Economic · Social · Humanitarian dimensions |
| **Live Incident Feed** | Streaming events from GDELT and ReliefWeb, filtered and ranked by recency |
| **AI Threat Briefing** | Auto-generated natural language summary of the threat landscape |
| **Temporal Trend Charts** | 7-day RSI trajectory with drift velocity and acceleration indicators |
| **Dual-Location Comparison** | Side-by-side pane comparison of any two locations |
| **Proximity Radar** | Visualizes nearby risk zones relative to a selected target |
| **Watchlist** | Persist high-priority locations across sessions |
| **Risk Leaderboard** | Global ranking of highest-risk zones updated in real time |
| **Interactive 3D Globe** | Canvas-rendered globe with crisis arc connections and hotspot rings |
| **ML Ensemble Confidence** | Reports model confidence alongside every prediction |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser Client                         │
│   React 18 · TypeScript · Vite · Tailwind · Framer Motion    │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Dashboard  │  │ Landing Page │  │   Docs / Website   │  │
│  │  (/)        │  │  (/landing)  │  │   (/docs)          │  │
│  └──────┬──────┘  └──────────────┘  └────────────────────┘  │
│         │  TanStack Query (REST)                              │
└─────────┼────────────────────────────────────────────────────┘
          │ HTTP  GET /api/*
          ▼
┌─────────────────────────────┐
│     Node.js / Express 5     │  PORT 5000
│                             │
│  ┌──────────────────────┐   │
│  │   Route Handlers     │   │
│  │  • /api/locations/*  │   │
│  │  • /api/risk/*       │   │
│  │  • /api/model-info   │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │  In-Memory Cache     │   │
│  │  (5-min TTL)         │   │
│  └──────────┬───────────┘   │
│             │ HTTP  localhost:5001
│             ▼               │
│  ┌──────────────────────┐   │
│  │  Python ML Server    │   │  PORT 5001 (auto-launched)
│  │  ml/ml_model.py      │   │
│  │                      │   │
│  │  VotingClassifier    │   │
│  │  + TF-IDF + rules    │   │
│  └──────────┬───────────┘   │
└─────────────┼───────────────┘
              │ Concurrent outbound fetches
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Data Sources                      │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │  GDELT   │  │ ReliefWeb │  │Nominatim │  │REST      │  │
│  │  2.0     │  │  UN API   │  │  (OSM)   │  │Countries │  │
│  │ Live RSS │  │ Incidents │  │ Geocoder │  │ Profiles │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Runtime Services

| Service | Host | Port | Purpose |
|---|---|---|---|
| Node/Express API + Vite | `0.0.0.0` | `5000` | Serves UI and all API routes |
| Python ML Server | `127.0.0.1` | `5001` | Risk inference, auto-launched by Node |

---

## Technology Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety across the full stack |
| Vite | 7.x | Dev server and production bundler |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | Latest | Accessible, unstyled component primitives |
| Framer Motion | 11.x | Animations and transitions |
| Recharts | 2.x | Risk trend charts and data visualizations |
| TanStack Query | 5.x | Server state, caching, and request management |
| Wouter | 3.x | Lightweight client-side routing |
| Lucide React | 0.453 | Icon system |

### Backend

| Technology | Version | Role |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 5.x | HTTP server and API routing |
| TypeScript + `tsx` | 5.6 | Type-safe server with zero compile step in dev |

### Machine Learning & Data

| Technology | Role |
|---|---|
| Python 3.11+ | ML inference server runtime |
| scikit-learn | VotingClassifier ensemble (RandomForest + GradientBoosting + SVM) |
| pandas + numpy | Feature engineering and data wrangling |
| TF-IDF Vectorizer | Text similarity for location fuzzy matching |
| pickle | Trained model artifact serialization (`ml/model.pkl`) |
| GDELT 2.0 | Live global event stream (RSS + API) |
| ReliefWeb | UN humanitarian incident database |
| Nominatim (OSM) | Location geocoding and autocomplete |
| REST Countries | Country profile data (population, capital, region) |
| Wikipedia REST | Supplementary country context |

---

## ML & Data Pipeline

Every risk analysis request goes through a **5-tier scoring pipeline**:

```
Request: location="Beirut"
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ TIER 1 — City / Zone Profile Lookup                     │
│ Hardcoded intelligence DB of known crisis hotspots.     │
│ High-resolution baseline for cities in active conflict. │
└───────────────────────────┬─────────────────────────────┘
                            │ if no city match
                            ▼
┌─────────────────────────────────────────────────────────┐
│ TIER 2 — Country Baseline (GPI-Calibrated)              │
│ Global Peace Index–calibrated country risk baselines.   │
│ Covers 180+ countries with composite starting scores.   │
└───────────────────────────┬─────────────────────────────┘
                            │ if no country match
                            ▼
┌─────────────────────────────────────────────────────────┐
│ TIER 3 — Regional Baseline Fallback                     │
│ Broad regional risk estimates (Middle East, Sub-Saharan  │
│ Africa, South Asia, etc.) as a last resort baseline.    │
└───────────────────────────┬─────────────────────────────┘
                            │ always applied on top
                            ▼
┌─────────────────────────────────────────────────────────┐
│ TIER 4 — Live Signal Enrichment                         │
│ Concurrent fetches from GDELT and ReliefWeb.            │
│ • GDELT: counts crisis keywords in recent event titles   │
│ • ReliefWeb: counts active humanitarian incidents        │
│ • Sentiment scoring on article text                     │
│ → keyword_boost + sentiment_boost applied to base score │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ TIER 5 — ML Ensemble Override                           │
│ Trained VotingClassifier (soft voting):                  │
│   • RandomForestClassifier                              │
│   • GradientBoostingClassifier                          │
│   • SVC (probability=True)                              │
│ Features: [base_score, keyword_count, sentiment,        │
│            incident_count, country_gpi_rank]            │
│ → Overrides rule-based score when confidence ≥ 0.6      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │  Final Response  │
                 │  riskScore: 0–100│
                 │  riskLevel: str  │
                 │  breakdown: {}   │
                 │  confidence: f   │
                 │  incidents: []   │
                 │  trend: {}       │
                 └──────────────────┘
```

### Resilience Design

- All outbound fetches run with **timeouts** — a slow data source never blocks the response
- **Graceful degradation**: if the ML model is unavailable, falls back to the rule-based tier pipeline
- **Auto-restart**: if the Python server crashes, Node relaunches it automatically after 2 seconds
- **In-memory cache** (5-min TTL) prevents redundant ML calls for repeated locations

---

## API Reference

Base URL (local): `http://localhost:5000`

---

### `GET /api/locations/search`

Search for location suggestions (autocomplete).

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query (city, country, or region) |

**Example Request**
```bash
curl "http://localhost:5000/api/locations/search?q=Baghdad"
```

**Example Response**
```json
[
  {
    "name": "Baghdad",
    "country": "Iraq",
    "lat": 33.3128,
    "lon": 44.3615,
    "type": "city"
  }
]
```

---

### `GET /api/risk/analyze`

Compute a full risk analysis for a single location.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `location` | string | Yes | City, country, or region name |

**Example Request**
```bash
curl "http://localhost:5000/api/risk/analyze?location=Kabul"
```

**Example Response**
```json
{
  "location": "Kabul",
  "country": "Afghanistan",
  "riskScore": 91,
  "riskLevel": "CRITICAL",
  "confidence": 0.94,
  "breakdown": {
    "military":      88,
    "political":     92,
    "economic":      85,
    "social":        79,
    "humanitarian":  96
  },
  "escalationMomentum": "accelerating",
  "trend": {
    "direction": "up",
    "velocity": 3.2,
    "sevenDayDelta": 8
  },
  "incidents": [
    {
      "title": "IED blast reported in Kabul district",
      "date": "2026-05-01",
      "source": "ReliefWeb",
      "severity": "high",
      "is_realtime": true
    }
  ],
  "newsStats": {
    "total": 42,
    "negative": 38,
    "sentimentScore": -0.81
  },
  "countryProfile": {
    "capital": "Kabul",
    "population": 40754388,
    "region": "Southern Asia",
    "flag": "🇦🇫"
  },
  "mlPrediction": {
    "label": "CRITICAL",
    "confidence": 0.94,
    "modelUsed": true
  }
}
```

---

### `GET /api/risk/compare`

Compare two locations side by side.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `loc1` | string | Yes | First location |
| `loc2` | string | Yes | Second location |

**Example Request**
```bash
curl "http://localhost:5000/api/risk/compare?loc1=Tehran&loc2=Riyadh"
```

**Example Response**
```json
{
  "location1": { /* full analysis object for Tehran */ },
  "location2": { /* full analysis object for Riyadh */ }
}
```

---

### `GET /api/model-info`

Returns metadata about the trained ML model.

**Example Response**
```json
{
  "model_type": "VotingClassifier",
  "trained_at": "2025-11-14T10:32:00Z",
  "accuracy": 0.942,
  "features": ["base_score", "keyword_count", "sentiment", "incident_count", "gpi_rank"],
  "classes": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
}
```

---

### `DELETE /api/risk/cache`

Clears the in-memory result cache.

| Variant | Effect |
|---|---|
| `DELETE /api/risk/cache` | Clears all cached results |
| `DELETE /api/risk/cache?location=Kabul` | Clears only the specified location |

---

## Project Structure

```
CRZP/
├── client/                        # React frontend
│   ├── index.html
│   ├── public/
│   │   ├── favicon.png
│   │   └── founder.png
│   └── src/
│       ├── App.tsx                # Root router (Wouter)
│       ├── main.tsx               # React entry point
│       ├── index.css              # Global styles + Tailwind
│       │
│       ├── app/                   # Intelligence dashboard (route: /)
│       │   ├── components/        # Dashboard-specific components
│       │   │   ├── GlobeView.tsx      # Interactive 3D globe
│       │   │   ├── ThreatBriefing.tsx # AI-generated threat brief
│       │   │   ├── ProximityRadar.tsx # Nearby risk radar
│       │   │   ├── TrendChart.tsx     # RSI trend visualization
│       │   │   ├── IncidentCard.tsx   # Live incident display
│       │   │   ├── LiveNewsFeed.tsx   # Real-time news feed
│       │   │   ├── RiskLeaderboard.tsx
│       │   │   ├── WatchlistPanel.tsx
│       │   │   ├── CountryProfile.tsx
│       │   │   ├── RiskBreakdownChart.tsx
│       │   │   └── SearchBox.tsx
│       │   └── pages/
│       │       └── Home.tsx           # Main dashboard page
│       │
│       ├── website/               # Marketing website
│       │   ├── components/
│       │   │   ├── Globe3D.tsx        # Canvas-based animated globe
│       │   │   ├── SiteNavbar.tsx     # Top navigation bar
│       │   │   ├── SiteFooter.tsx
│       │   │   └── TiltCard.tsx
│       │   └── pages/
│       │       ├── Landing.tsx        # Hero / marketing page (/landing)
│       │       └── Docs.tsx           # API documentation (/docs)
│       │
│       ├── shared/                # Shared UI components
│       │   └── components/
│       │       ├── ParticleCanvas.tsx
│       │       └── RippleReveal.tsx
│       │
│       ├── components/ui/         # Radix UI / shadcn component library
│       ├── hooks/                 # Custom React hooks
│       │   ├── use-risk.ts            # Risk analysis + comparison queries
│       │   ├── use-locations.ts       # Location search query
│       │   ├── use-debounce.ts
│       │   └── use-mobile.tsx
│       └── lib/
│           ├── utils.ts               # cn(), getRiskColor(), helpers
│           └── queryClient.ts         # TanStack Query configuration
│
├── server/                        # Node.js / Express backend
│   ├── index.ts                   # App bootstrap, middleware, error handler
│   ├── routes.ts                  # All API routes + Python ML bridge + cache
│   ├── vite.ts                    # Dev-time Vite integration
│   └── static.ts                  # Production static file serving
│
├── ml/                            # Python ML engine
│   ├── ml_model.py                # Full ML inference server (Flask-free HTTP)
│   ├── train_model.py             # Model training script
│   ├── model.pkl                  # Trained VotingClassifier artifact
│   └── model_metadata.json        # Training metrics and configuration
│
├── shared/                        # Shared TypeScript contracts
│   ├── schema.ts                  # Zod validation schemas
│   └── routes.ts                  # Typed API route constants
│
├── script/
│   └── build.ts                   # Production build orchestration
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── postcss.config.js
├── pyproject.toml                 # Python dependency declaration
└── uv.lock
```

---

## Getting Started

### Prerequisites

Ensure the following are installed on your machine:

| Requirement | Minimum Version | Check |
|---|---|---|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Python | 3.11+ | `python3 --version` |

### 1. Clone the repository

```bash
git clone https://github.com/i-anasop/CRZP.git
cd CRZP
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install Python dependencies

**Using `uv` (recommended — fast):**
```bash
pip install uv        # if uv is not already installed
uv sync
```

**Using `pip` (standard):**
```bash
pip install numpy pandas scikit-learn requests
```

### 4. Run in development mode

```bash
npm run dev
```

This single command:
- Starts the Express API server on **port 5000**
- Launches the Vite dev server with HMR
- Auto-starts the Python ML server on port 5001 in the background

Open your browser at: **[http://localhost:5000](http://localhost:5000)**

> The app will be fully functional once the terminal shows:
> ```
> [ml] Python ML server ready on port 5001
> ```

### 5. Verify the setup

```bash
# Health check — should return risk data for London
curl "http://localhost:5000/api/risk/analyze?location=London"

# Location autocomplete
curl "http://localhost:5000/api/locations/search?q=Kabul"

# Model info
curl "http://localhost:5000/api/model-info"
```

### 6. Type-check the project

```bash
npm run check
```

---

## Environment Variables

No secret API keys are required for core local operation. All external data sources used (GDELT, ReliefWeb, Nominatim, REST Countries) are open and unauthenticated.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port for the Node/Express server |
| `NODE_ENV` | `development` | Set to `production` for production builds |

For production deployments, create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=production
```

---

## Build & Production

### Build

```bash
npm run build
```

This compiles:
- TypeScript server code → `dist/index.cjs`
- React frontend → `dist/public/`

### Start Production Server

```bash
npm run start
```

The production server:
- Serves the compiled React app as static files from `dist/public/`
- Runs all API routes from the same process
- Auto-starts the Python ML server on port 5001

---

## Troubleshooting

### Port 5000 is already in use

**macOS / Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Windows (PowerShell):**
```powershell
$p = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($p) { Stop-Process -Id $p -Force }
```

Then restart with `npm run dev`.

---

### `'NODE_ENV' is not recognized` (Windows)

The project uses `cross-env` to handle this cross-platform. Run:

```bash
npm install
npm run dev
```

---

### Python ML server not starting

1. Confirm Python is accessible: `python3 --version`
2. Confirm the model artifact exists: `ls ml/model.pkl`
3. Confirm Python packages are installed: `python3 -c "import sklearn, pandas, numpy"`
4. Check terminal output for `[ml]` prefixed error lines

If the model fails to load, the server **automatically falls back** to the rule-based scoring pipeline — the app will still function, but without ML ensemble predictions.

---

### Slow risk analysis response

Live signal fetches (GDELT, ReliefWeb) are timeout-protected but depend on external network conditions. If you are in a restricted network environment, responses may take up to 18 seconds before the timeout fallback kicks in.

---

### Vite overlay blocking the screen

The Vite error overlay is intentionally disabled in this project to reduce noise from browser extension injections during development.

---

## Security

- All external data is sourced from open, public APIs. Validate and sanitize any downstream usage in production workflows.
- **Feedback data**: The `/api/feedback` endpoint accepts `name`, `email`, `message`, and `rating`. When a `RESEND_API_KEY` environment variable is set, this data is transmitted to the Resend email API. As a fallback, submissions are appended in plaintext to `logs/feedbacks.log` on disk. Do not expose this endpoint publicly without reviewing your data handling obligations.
- Outside of the feedback endpoint, CRZP does not persist user interaction data or session state.
- Regularly audit dependencies:

```bash
npm audit
npm audit fix
```

Some advisory fixes may require major version bumps — validate application behavior after significant upgrades.

---

## Roadmap

- [ ] **Auth & multi-tenant support** — Rate limiting, API key management, and user accounts
- [ ] **Persistent database backend** — Replace in-memory cache with PostgreSQL/Redis for cross-session persistence
- [ ] **Expanded ML training data** — Improve model coverage for underrepresented regions
- [ ] **Export & reporting** — PDF/CSV intelligence reports for individual locations
- [ ] **Webhook alerts** — Push notifications when a watchlisted location's RSI changes significantly
- [ ] **Mobile app** — React Native companion app for on-the-go risk monitoring
- [ ] **CI/CD pipeline** — GitHub Actions for lint, type-check, and audit on every push
- [ ] **Docker support** — Containerized deployment with Docker Compose

---

## About <img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/google-colored.svg" height="22" alt="Google" /> AI Seekho

<div align="center">

**CRZP APEX** is a Phase 1 project submitted for **<img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/google-colored.svg" height="16" alt="Google" /> AI Seekho 2026** — Google's initiative to make artificial intelligence education and practical application accessible across South Asia and beyond.

</div>

The project demonstrates applied AI in the domain of **geopolitical risk intelligence**, combining:

- **Machine Learning** — A trained VotingClassifier ensemble for risk classification
- **Natural Language Processing** — TF-IDF–based location matching and sentiment analysis on live news
- **Real-Time Data Engineering** — Multi-source concurrent data fetching with graceful degradation
- **Full-Stack Development** — End-to-end TypeScript + Python application with a production-ready architecture

The goal is to show that AI can be used as a tool for **situational awareness and informed decision-making** in complex global environments — making advanced geopolitical intelligence accessible beyond institutional and governmental bodies.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

<br />

<img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/logo.png" alt="CRZP APEX" width="64" />

<br /><br />

### CRZP APEX

*Know The Risk. Anywhere. Instantly.*

<br />

Built with precision by **[i-anasop](https://github.com/i-anasop)**

<br />

---

<br />

<img src="https://raw.githubusercontent.com/i-anasop/CRZP/main/client/public/google-colored.svg" height="36" alt="Google" />

<br />

### AI Seekho 2026

**Phase 1 Project**

<br />

*This project was built as part of* ***Google's AI Seekho programme*** *— an initiative to advance AI*
*literacy, practical application, and real-world problem solving across South Asia and beyond.*

<br />

[![Powered by Google AI Seekho](https://img.shields.io/badge/Powered%20by-Google%20AI%20Seekho-4285F4?style=for-the-badge&logo=google&logoColor=white&labelColor=0f0f0f)](https://seekho.google.com)

<br />

</div>
