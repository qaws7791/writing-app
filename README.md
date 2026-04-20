# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
bunx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Scripts

`bun dev --filter=web` to run the web app.
`bun dev --filter=web...` to run the web app and all its dependencies.

## use bun

use `@types/bun` instead of `@types/node`

## 스토리지 로컬 실행 방법

### 1. RustFS 시작

저장소 루트에서 다음 명령을 실행합니다:

```bash
cp .env.docker.example .env.docker
docker compose up -d
```

RustFS가 시작되면 다음 주소로 접근할 수 있습니다:

- **S3 API**: `http://localhost:9000`
- **웹 콘솔**: `http://localhost:9001`
- **자격증명**: `.env.docker`에 설정한 값

### 2. 어드민 개발 서버

```bash
bun dev
```

### 3. 이미지 업로드 테스트

`http://localhost:3020/prompts/new` 에서 이미지 업로드를 테스트할 수 있습니다.

자세한 설정은 [로컬 개발 가이드](docs/04-engineering/local-development.md)를 참고하세요.

## packs repository for agent

```
npx repomix@latest -i ".agent, .agents, .claude, .tmp, .vscode, docs, apps/web/src/data/journey-sessions.json,  apps/api/src/openapi.json, **/*.d.ts, **/*.test.ts, packages/database/drizzle/meta/, apps/storybook, **/*.spec.ts"
```
