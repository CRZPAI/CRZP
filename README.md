# CRZP (Crisis Risk Zone Predictor)

CRZP is a full-stack geopolitical risk intelligence platform that combines a React dashboard, an Express API layer, and a Python ML risk engine.

Given a city, region, or country, CRZP computes a real-time composite risk score (0-100) and returns:
- risk tier + confidence metadata,
- multi-factor breakdown (military, political, economic, social, humanitarian),
- incidents and live signal context,
- trend and momentum indicators,
- country profile and briefing information.

## Table of Contents
- Overview
- Architecture
- Repository Layout
- Technology Stack
- Data Flow
- API Reference
- Local Development Setup
- Build and Production
- Configuration
- Troubleshooting
- Security Notes
- Roadmap

## Overview

CRZP is designed for analysts, researchers, and teams that need rapid risk context for global locations.

Core capabilities:
- global location search/autocomplete,
- real-time risk analysis via Python backend integration,
- interactive globe + risk visualization components,
- side-by-side comparison between two locations,
- API-first architecture with shared TypeScript contracts.

## Architecture

The app runs as a Node process hosting both API routes and the frontend (in dev via Vite middleware):

1. User enters a location in the client.
2. Client calls `GET /api/risk/analyze?location=...`.
3. Express route proxies the request to a persistent Python ML server on `127.0.0.1:5001`.
4. Python model fuses baseline data + live-source signals and returns normalized JSON.
5. Node returns the result to the React UI.

Runtime services:
- Node/Express app: `0.0.0.0:5000`
- Python ML service: `127.0.0.1:5001` (auto-launched by Node)

## Repository Layout

```
client/
  src/
    components/         Reusable UI and dashboard components
    hooks/              Data hooks (querying, debounce, mobile helpers)
    lib/                Shared frontend utilities and query client
    pages/              Top-level route pages

server/
  index.ts              Express bootstrap + middleware + error handler
  routes.ts             API endpoints + Python bridge + cache
  ml_model.py           Python ML inference server
  model.pkl             Trained model artifact
  model_metadata.json   Training/meta information
  vite.ts               Dev-time Vite integration
  static.ts             Production static file serving

shared/
  schema.ts             Shared Zod schemas
  routes.ts             Shared route contracts

script/
  build.ts              Build orchestration script
```

## Technology Stack

Frontend:
- React 18 + TypeScript
- Vite
- Tailwind CSS + Radix UI primitives
- Framer Motion
- Recharts + custom globe rendering

Backend:
- Node.js + Express 5
- TypeScript (`tsx` runtime in development)

ML / Data Engine:
- Python 3.11+
- scikit-learn, pandas, numpy
- requests + concurrent futures
- Local model artifact (`server/model.pkl`) with graceful fallback behavior

External Signal/Data Sources:
- GDELT 2.0
- ReliefWeb
- Nominatim (OpenStreetMap)
- REST Countries
- Wikipedia REST

## Data Flow

Risk analysis combines multi-tier baselines and live inputs:

1. Tier 1: city/zone profile map (high-resolution known hotspots).
2. Tier 2: country baseline calibration.
3. Tier 3: regional baseline fallback.
4. Live signal enrichment from recent event/news patterns.
5. Composite scoring and dimensional breakdown generation.

Server-side behavior:
- in-memory result cache with TTL,
- timeout-protected outbound data fetches,
- error-tolerant fallbacks so partial-source failures do not crash responses.

## API Reference

Base URL (local): `http://localhost:5000`

### 1) Search locations
`GET /api/locations/search?q=<query>`

Returns location suggestions from Nominatim.

### 2) Analyze risk
`GET /api/risk/analyze?location=<location>`

Returns full analysis payload for one location.

Response highlights:
- `riskScore`, `riskLevel`
- `breakdown` (military/political/economic/social/humanitarian)
- `incidents`, `news`, `trend`
- `countryProfile`
- `mlPrediction`
- `escalationMomentum`

### 3) Compare locations
`GET /api/risk/compare?loc1=<locationA>&loc2=<locationB>`

Returns side-by-side analysis objects.

### 4) Model metadata
`GET /api/model-info`

Returns model/training metadata when available.

### 5) Cache control
`DELETE /api/risk/cache`
`DELETE /api/risk/cache?location=<location>`

Clears all cache entries or a specific location key.

## Local Development Setup

### Prerequisites
- Node.js 20+ (24.x tested)
- npm 10+
- Python 3.11+
- Internet access for live external signal providers

### 1) Install dependencies

```bash
npm install
```

### 2) Python dependencies

Python dependencies are declared in `pyproject.toml`.

If you use `uv`:

```bash
uv sync
```

If you use `pip`:

```bash
python -m pip install numpy pandas python-docx requests scikit-learn
```

### 3) Run in development

```bash
npm run dev
```

The app serves at:
- UI + API: `http://localhost:5000`

The Python model server is auto-started by Node.

### 4) Type-check

```bash
npm run check
```

## Build and Production

```bash
npm run build
npm run start
```

Production runtime serves static assets from `dist/public` and API from the same server process.

## Configuration

Environment variables:
- `NODE_ENV`: `development` or `production`
- `PORT`: HTTP port for Node server (defaults to `5000`)

No additional required secret keys are needed for core local operation in the current setup.

## Troubleshooting

### Port 5000 already in use

Windows PowerShell:

```powershell
$p=(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if($p){ Stop-Process -Id $p -Force }
```

Then restart:

```bash
npm run dev
```

### `'NODE_ENV' is not recognized`

This repository uses `cross-env` in scripts to support Windows shells. Run `npm install` to ensure dependencies are present.

### Python model not starting

Verify:
- `python --version` works,
- `server/model.pkl` exists,
- required Python packages are installed.

### Dev overlay blocks screen with extension errors

Vite overlay is disabled in this project configuration to reduce browser-extension injection noise during local development.

## Security Notes

- CRZP fetches external open-source data; validate and sanitize downstream use in production workflows.
- Dependency vulnerabilities can evolve over time. Recommended routine:

```bash
npm audit
npm audit fix
```

- Some advisory fixes may require semver-major dependency upgrades; validate behavior after such updates.

## Roadmap

- Harden API auth/rate limiting for multi-tenant deployment.
- Add persistent cache/storage backend.
- Improve model explainability and calibration reporting.
- Expand CI/CD quality gates (lint, tests, audit policies).

---

If you want, I can also add:
- request/response JSON examples for each endpoint,
- a deployment section for Docker + reverse proxy,
- a contributor guide (`CONTRIBUTING.md`) and changelog template.
