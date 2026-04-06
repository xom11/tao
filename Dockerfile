# ============================================
# Stage 1: Build Next.js frontend
# ============================================
FROM node:20-slim AS web-builder

WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./

# Build-time env — override via Dokku config
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ============================================
# Stage 2: Python runtime + built frontend
# ============================================
FROM python:3.14-slim

# Install Node.js (needed to run Next.js in production)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml uv.lock* .python-version ./
COPY src/ src/
RUN touch README.md && uv sync --frozen --no-dev

# Copy remaining source code
COPY api/ api/
COPY scripts/ scripts/

# Copy built frontend
COPY --from=web-builder /app/web /app/web

# Entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["api"]
