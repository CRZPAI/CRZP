<div align="center">

<img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/logo.png" alt="CRZP APEX Logo" width="110" />

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
[![Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Deployed-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

---

> 🏆 **<img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/google-colored.svg" height="18" alt="Google" /> AI Seekho 2026 — Phase 1 Project**
> Built as part of Google's AI Seekho initiative to democratize access to AI-powered tools for social impact.

---

[Live Demo](https://crzp-apex-578360710770.us-central1.run.app) · [Documentation](https://crzp-apex-578360710770.us-central1.run.app/docs) · [Report a Bug](https://github.com/CRZP-AI/CRZP/issues) · [Request a Feature](https://github.com/CRZP-AI/CRZP/issues)

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
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Roadmap](#roadmap)
- [About Google AI Seekho](#about-google-ai-seekho)
- [License](#license)

---

## What is CRZP?

**CRZP APEX** (Crisis Risk Zone Predictor) is a full-stack geopolitical intelligence platform that computes a real-time composite **Risk Score (0–100)** for any city, country, or region on Earth. It fuses live global event data with a trained ML ensemble to give analysts, researchers, and security teams an instant, structured picture of geopolitical risk.

Traditional risk assessment tools are expensive, opaque, or delayed by days. CRZP makes this intelligence **open, fast, and explainable** — powered by public data sources and a transparent ML pipeline.

---

## Key Features

| Feature | Description |
|---|---|
| **Universal Location Search** | Autocomplete for any city, country, or region via Nominatim geocoding |
| **Real-Time Risk Score** | Composite 0–100 RSI (Risk Severity Index) computed on every request |
| **5-Axis Risk Breakdown** | Kinetic · Political · Economic · Social · Humanitarian dimensions |
| **Live Incident Feed** | Events from GDELT and ReliefWeb, filtered and ranked by recency |
| **AI Threat Briefing** | Auto-generated natural language summary of the threat landscape |
| **Temporal Trend Charts** | 7-day RSI trajectory with drift velocity and momentum indicators |
| **Dual-Location Comparison** | Side-by-side pane comparison of any two locations |
| **Proximity Radar** | Visualizes nearby risk zones relative to a selected target |
| **Watchlist** | Persist and monitor high-priority locations |
| **Risk Leaderboard** | Global ranking of highest-risk zones |
| **Interactive 3D Globe** | Canvas-rendered globe with crisis arc connections and hotspot rings |
| **ML Ensemble Confidence** | Model confidence reported alongside every prediction |

---

## System Architecture

```
Browser (React + Vite)
        │
        │  GET /api/*  (TanStack Query)
        ▼
Node.js / Express 5  — PORT 8080 (Cloud Run) / 5000 (local)
  ├── /api/locations/*   Location autocomplete
  ├── /api/risk/*        Risk analysis + comparison
  ├── /api/model-info    ML metadata
  └── In-memory cache (5-min TTL)
        │
        │  HTTP  127.0.0.1:5001  (auto-launched)
        ▼
Python ML Server  — ml/ml_model.py
  └── VotingClassifier + rule-based tiers + TF-IDF
        │
        │  Concurrent outbound fetches
        ▼
External Sources: GDELT 2.0 · ReliefWeb · Nominatim · REST Countries
```

| Service | Host | Port |
|---|---|---|
| Node/Express API + Vite | `0.0.0.0` | `8080` (prod) / `5000` (dev) |
| Python ML Server | `127.0.0.1` | `5001` (auto-launched by Node) |

---

## Technology Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety across the full stack |
| Vite | 7.x | Dev server and production bundler |
| Tailwind CSS | 3.4 | Utility-first styling |
| Radix UI | Latest | Accessible component primitives |
| Framer Motion | 11.x | Animations and transitions |
| Recharts | 2.x | Risk trend charts |
| TanStack Query | 5.x | Server state and data fetching |
| Wouter | 3.x | Lightweight client-side routing |

### Backend

| Technology | Version | Role |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 5.x | HTTP server and API routing |
| TypeScript + `tsx` | 5.6 | Type-safe server, zero compile step in dev |

### Machine Learning & Data

| Technology | Role |
|---|---|
| Python 3.11+ | ML inference server runtime |
| scikit-learn | VotingClassifier (RandomForest + GradientBoosting) |
| TF-IDF Vectorizer | Location fuzzy matching and text similarity |
| GDELT 2.0 | Live global event stream |
| ReliefWeb | UN humanitarian incident database |
| Nominatim (OSM) | Location geocoding and autocomplete |
| REST Countries | Country profile data |

---

## ML & Data Pipeline

Every risk request runs through a **5-tier scoring pipeline**:

1. **City Profile Lookup** — hardcoded intelligence database of known crisis hotspots with high-resolution baselines
2. **Country Baseline** — Global Peace Index–calibrated baselines covering 180+ countries
3. **Regional Fallback** — broad regional risk estimates when no city/country match is found
4. **Live Signal Enrichment** — concurrent GDELT + ReliefWeb fetches; crisis keyword counts and sentiment scoring boost or dampen the base score
5. **ML Ensemble Override** — trained VotingClassifier (soft voting: RandomForest × 200 + GradientBoosting × 150) overrides the rule-based score when confidence ≥ 0.6

**Training data**: Fragile States Index 2024 · Global Peace Index 2024 · UCDP Conflict Database 2023 — 135 countries, 4 features, test accuracy 88.89%.

**Resilience**: All outbound fetches are timeout-protected. If the ML model fails, the pipeline falls back to rule-based scoring automatically. If the Python server crashes, Node restarts it after 2 seconds.

---

## API Reference

Base URL (production): `https://crzp-apex-578360710770.us-central1.run.app`
Base URL (local): `http://localhost:5000`

### `GET /api/locations/search?q=<query>`
Returns location suggestions from Nominatim.

```bash
curl "https://crzp-apex-578360710770.us-central1.run.app/api/locations/search?q=Baghdad"
```

---

### `GET /api/risk/analyze?location=<location>`
Full risk analysis for a single location. Returns `riskScore`, `riskLevel`, `confidence`, `breakdown` (5 axes), `incidents`, `trend`, `countryProfile`, and `mlPrediction`.

```bash
curl "https://crzp-apex-578360710770.us-central1.run.app/api/risk/analyze?location=Kabul"
```

```json
{
  "location": "Kabul",
  "riskScore": 91,
  "riskLevel": "CRITICAL",
  "confidence": 0.94,
  "breakdown": { "military": 88, "political": 92, "economic": 85, "social": 79, "humanitarian": 96 },
  "escalationMomentum": "accelerating",
  "mlPrediction": { "label": "CRITICAL", "confidence": 0.94, "modelUsed": true }
}
```

---

### `GET /api/risk/compare?loc1=<A>&loc2=<B>`
Side-by-side full analysis for two locations.

---

### `GET /api/model-info`
Returns ML model metadata — type, training accuracy, feature names, class distribution.

---

### `DELETE /api/risk/cache`
Clears all cached results. Add `?location=<name>` to clear a single entry.

---

## Project Structure

```
CRZP/
├── client/src/
│   ├── app/               # Intelligence dashboard (route: /)
│   │   ├── components/    # GlobeView, ThreatBriefing, TrendChart, IncidentCard, etc.
│   │   └── pages/Home.tsx
│   ├── website/           # Marketing site (routes: /landing, /docs)
│   │   ├── components/    # SiteNavbar, Globe3D, SiteFooter
│   │   └── pages/         # Landing.tsx, Docs.tsx
│   ├── components/ui/     # Radix UI / shadcn component library
│   └── hooks/             # use-risk.ts, use-locations.ts, use-debounce.ts
├── server/
│   ├── index.ts           # Express bootstrap
│   └── routes.ts          # All API routes + Python bridge + cache
├── ml/
│   ├── ml_model.py        # ML inference HTTP server
│   ├── train_model.py     # Training script
│   ├── model.pkl          # Trained model artifact
│   └── model_metadata.json
├── shared/
│   ├── schema.ts          # Zod validation schemas
│   └── routes.ts          # Typed API route constants
├── Dockerfile             # Multi-stage build for Cloud Run
├── .dockerignore
├── deploy-cloudrun.sh     # One-command Cloud Run deploy script
├── package.json
├── pyproject.toml
└── vite.config.ts
```

---

## Getting Started

**Prerequisites:** Node.js 20+, npm 10+, Python 3.11+

```bash
# 1. Clone
git clone https://github.com/CRZP-AI/CRZP.git
cd CRZP

# 2. Install Node dependencies
npm install

# 3. Install Python dependencies
pip install numpy pandas scikit-learn requests
# or: uv sync  (if you have uv)

# 4. Run
npm run dev
```

App runs at **http://localhost:5000** — fully functional once the terminal shows `[ml] Python ML server ready on port 5001`.

---

## Environment Variables

No API keys are required for core operation. All data sources are open and unauthenticated.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port for the Express server |
| `NODE_ENV` | `development` | Set to `production` for production builds |
| `RESEND_API_KEY` | *(optional)* | If set, feedback submissions are sent via Resend email |

---

## Build & Production

```bash
npm run build   # Compiles server → dist/index.cjs, frontend → dist/public/
npm run start   # Serves production build on $PORT (default 5000)
```

---

## Deployment

CRZP APEX is deployed on **Google Cloud Run** for zero-ops, auto-scaling production hosting.

**Live URL:** https://crzp-apex-578360710770.us-central1.run.app

### Deploy your own instance

```bash
# Set your GCP project
PROJECT_ID="your-gcp-project-id"

# One-command deploy (builds via Cloud Build, deploys to Cloud Run)
gcloud run deploy crzp-apex \
  --source=. \
  --region=us-central1 \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --set-env-vars="NODE_ENV=production"
```

Or use the included script:
```bash
bash deploy-cloudrun.sh your-gcp-project-id
```

---

## Troubleshooting

**Port 5000 already in use**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows PowerShell
$p = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($p) { Stop-Process -Id $p -Force }
```

**Python ML server not starting**
- Run `python3 --version` — must be 3.11+
- Run `ls ml/model.pkl` — artifact must exist
- Run `python3 -c "import sklearn, pandas, numpy"` — packages must be installed
- If the model fails to load, the app falls back to rule-based scoring automatically

**Slow responses**
GDELT/ReliefWeb fetches are timeout-protected but depend on external network conditions. Responses may take up to 18 seconds on restricted networks.

---

## Security

- All external data is sourced from open public APIs. Validate and sanitize downstream usage in production workflows.
- **Feedback data**: `/api/feedback` accepts `name`, `email`, `message`, and `rating`. When `RESEND_API_KEY` is set, this is transmitted to Resend. Otherwise it is appended to `logs/feedbacks.log` on disk. Review your data handling obligations before exposing this endpoint publicly.
- Outside of feedback, CRZP does not persist user interaction data or session state.
- Run `npm audit` regularly to catch dependency vulnerabilities.

---

## Roadmap

- [ ] Auth and API key management for multi-tenant deployment
- [ ] Persistent cache backend (PostgreSQL / Redis)
- [ ] PDF/CSV export for intelligence reports
- [ ] Webhook alerts when a watchlisted location's RSI changes significantly
- [ ] Expanded ML training coverage for underrepresented regions
- [x] CI/CD with GitHub Actions
- [x] Docker + Cloud Run deployment

---

## About <img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/google-colored.svg" height="22" alt="Google" /> AI Seekho

<div align="center">

**CRZP APEX** is a Phase 1 project submitted for **<img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/google-colored.svg" height="16" alt="Google" /> AI Seekho 2026** — Google's initiative to make artificial intelligence education and practical application accessible across South Asia and beyond.

</div>

The project demonstrates applied AI in the domain of geopolitical risk intelligence, combining a trained ML ensemble, NLP-based signal analysis, real-time multi-source data engineering, and a production-grade full-stack architecture. The goal is to make advanced situational awareness accessible beyond institutional and governmental bodies.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

<br />

<img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/logo.png" alt="CRZP APEX" width="64" />

<br /><br />

### CRZP APEX

*Know The Risk. Anywhere. Instantly.*

<br />

Built with precision by **[Anas](https://github.com/i-anasop)**

<br />

---

<br />

<img src="https://raw.githubusercontent.com/CRZP-AI/CRZP/main/client/public/google-colored.svg" height="36" alt="Google" />

### AI Seekho 2026

**Phase 1 Project**

<br />

*This project was built as part of Google's AI Seekho programme — an initiative to advance AI literacy,*
*practical application, and real-world problem solving across South Asia and beyond.*

<br />

[![Powered by Google AI Seekho](https://img.shields.io/badge/Powered%20by-Google%20AI%20Seekho-4285F4?style=for-the-badge&logo=google&logoColor=white&labelColor=0f0f0f)](https://seekho.google.com)

<br />

</div>
