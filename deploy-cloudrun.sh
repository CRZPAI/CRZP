#!/bin/bash
# ── CRZP APEX — Google Cloud Run Deploy Script ──────────────────────────────
# Usage: bash deploy-cloudrun.sh <PROJECT_ID> [REGION]
# Requires: GCP_SA_KEY env var (service account JSON)
set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SERVICE_NAME="crzp-apex"
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/crzp/${SERVICE_NAME}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: bash deploy-cloudrun.sh <GCP_PROJECT_ID> [REGION]"
  exit 1
fi

if [[ -z "${GCP_SA_KEY:-}" ]]; then
  echo "ERROR: GCP_SA_KEY env var not set (paste your service account JSON)"
  exit 1
fi

GCLOUD="/tmp/gcloud-sdk/google-cloud-sdk/bin/gcloud"

echo "── Authenticating with service account ──"
echo "$GCP_SA_KEY" > /tmp/sa-key.json
"$GCLOUD" auth activate-service-account --key-file=/tmp/sa-key.json
"$GCLOUD" config set project "$PROJECT_ID"

echo "── Enabling required APIs ──"
"$GCLOUD" services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="$PROJECT_ID"

echo "── Creating Artifact Registry repo (if needed) ──"
"$GCLOUD" artifacts repositories create crzp \
  --repository-format=docker \
  --location=us-central1 \
  --description="CRZP APEX container images" \
  --project="$PROJECT_ID" 2>/dev/null || true

echo "── Building & deploying to Cloud Run (source deploy) ──"
"$GCLOUD" run deploy "$SERVICE_NAME" \
  --source=. \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=60 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production" \
  --image="$IMAGE"

echo ""
echo "── Deployment complete ──"
"$GCLOUD" run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)"
rm -f /tmp/sa-key.json
