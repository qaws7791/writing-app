# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM oven/bun:1.3.10@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS builder

WORKDIR /workspace

ENV CI=true \
    NODE_ENV=production

COPY --parents package.json bun.lock apps/*/package.json packages/*/*/package.json ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production --filter @workspace/api --linker isolated --frozen-lockfile

COPY . .

RUN mkdir -p /workspace/image-bin \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/main.ts --outfile /workspace/image-bin/api \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/migrate-database.ts --outfile /workspace/image-bin/database-migrate \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/backup-database.ts --outfile /workspace/image-bin/database-backup \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/inspect-database.ts --outfile /workspace/image-bin/database-check \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/check-database-integrity.ts --outfile /workspace/image-bin/database-integrity-check \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/maintenance-daily.ts --outfile /workspace/image-bin/maintenance-daily \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/reapply-deletion-markers.ts --outfile /workspace/image-bin/deletion-marker-restore \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/seed-admin.ts --outfile /workspace/image-bin/owner-seed \
    && bun build --target=bun --external=prismjs --external='prismjs/*' apps/api/src/scripts/seed-database.ts --outfile /workspace/image-bin/database-seed

FROM oven/bun:1.3.10@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS runner

RUN groupadd --system --gid 10001 writing-app \
    && useradd --system --uid 10001 --gid 10001 writing-app

WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=builder --chown=10001:10001 /workspace/image-bin/ ./bin/
COPY --from=builder --chown=10001:10001 /workspace/node_modules/.bun/prismjs@1.30.0/node_modules/prismjs/ ./node_modules/prismjs/

USER 10001:10001

EXPOSE 4000

CMD ["bun", "/workspace/bin/api"]
