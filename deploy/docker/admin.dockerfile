# syntax=docker/dockerfile:1

FROM oven/bun:1.3.10@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS builder

WORKDIR /workspace

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN bun install --filter @workspace/admin --linker isolated --frozen-lockfile

ARG NEXT_PUBLIC_ADMIN_API_BASE_URL
ARG NEXT_PUBLIC_LEARNER_WEB_ORIGIN
ARG ADMIN_API_BASE_URL
ARG ADMIN_ORIGIN
ARG CSP_REPORT_ONLY=false

ENV NODE_ENV=production \
    NEXT_PUBLIC_ADMIN_API_BASE_URL=${NEXT_PUBLIC_ADMIN_API_BASE_URL} \
    NEXT_PUBLIC_LEARNER_WEB_ORIGIN=${NEXT_PUBLIC_LEARNER_WEB_ORIGIN} \
    ADMIN_API_BASE_URL=${ADMIN_API_BASE_URL} \
    ADMIN_ORIGIN=${ADMIN_ORIGIN} \
    CSP_REPORT_ONLY=${CSP_REPORT_ONLY}

RUN test -n "$NEXT_PUBLIC_ADMIN_API_BASE_URL" \
    && test -n "$NEXT_PUBLIC_LEARNER_WEB_ORIGIN" \
    && test -n "$ADMIN_API_BASE_URL" \
    && test -n "$ADMIN_ORIGIN"
RUN bun --filter @workspace/admin build --webpack

FROM node:24-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS runner

RUN groupadd --system --gid 10001 writing-app \
    && useradd --system --uid 10001 --gid 10001 writing-app

WORKDIR /workspace

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3001

COPY --from=builder --chown=10001:10001 /workspace/apps/admin/.next/standalone ./
COPY --from=builder --chown=10001:10001 /workspace/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=10001:10001 /workspace/apps/admin/public ./apps/admin/public

USER 10001:10001

EXPOSE 3001

CMD ["node", "apps/admin/server.js"]
