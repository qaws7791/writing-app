# syntax=docker/dockerfile:1

FROM oven/bun:1.3.10@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS runner

RUN groupadd --system --gid 10001 writing-app \
    && useradd --system --uid 10001 --gid 10001 writing-app

WORKDIR /workspace

ENV CI=true \
    NODE_ENV=production

COPY . .

RUN bun install --production --filter @workspace/admin-api --linker isolated --frozen-lockfile

USER 10001:10001

WORKDIR /workspace/apps/admin-api

EXPOSE 4001

CMD ["bun", "src/main.ts"]
