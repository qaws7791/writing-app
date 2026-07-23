# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM oven/bun:1.3.10@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS bun

FROM --platform=$BUILDPLATFORM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS builder

WORKDIR /workspace

ENV CI=true

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

COPY --parents package.json bun.lock apps/*/package.json packages/*/package.json packages/*/*/package.json ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --filter @workspace/web --linker isolated --frozen-lockfile --cpu='*' --os=linux

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ARG WEB_ORIGIN
ARG CSP_REPORT_ONLY=false

ENV NODE_ENV=production \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    API_BASE_URL=${API_BASE_URL} \
    WEB_ORIGIN=${WEB_ORIGIN} \
    CSP_REPORT_ONLY=${CSP_REPORT_ONLY}

RUN test -n "$NEXT_PUBLIC_API_BASE_URL" \
    && test -n "$API_BASE_URL" \
    && test -n "$WEB_ORIGIN"
RUN cd apps/web && node node_modules/next/dist/bin/next build

FROM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS runner

RUN groupadd --system --gid 10001 writing-app \
    && useradd --system --uid 10001 --gid 10001 writing-app

WORKDIR /workspace

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=10001:10001 /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=10001:10001 /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=10001:10001 /workspace/apps/web/public ./apps/web/public

USER 10001:10001

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
