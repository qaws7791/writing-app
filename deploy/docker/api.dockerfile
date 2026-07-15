# syntax=docker/dockerfile:1

FROM oven/bun:1.3.10 AS runner

RUN groupadd --system --gid 10001 writing-app \
    && useradd --system --uid 10001 --gid 10001 writing-app

WORKDIR /workspace

ENV CI=true \
    NODE_ENV=production

COPY . .

RUN bun install --production --filter @workspace/api --linker isolated --frozen-lockfile

USER 10001:10001

WORKDIR /workspace/apps/api

EXPOSE 4000

CMD ["bun", "src/main.ts"]
