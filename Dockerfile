## ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Install build deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build


## ── Stage 2: Production ───────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Install Python 3 + pip for the ML server
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies
COPY pyproject.toml ./
RUN pip3 install --no-cache-dir --break-system-packages \
      "numpy>=2.4.2" \
      "pandas>=3.0.1" \
      "requests>=2.32.5" \
      "scikit-learn>=1.8.0"

# Install Node production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy ML model files
COPY ml/ ./ml/

# Cloud Run injects PORT; Express and Python both respect it
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
