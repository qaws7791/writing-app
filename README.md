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

### 1. SeaweedFS 실행 (data/seaweedfs-config/s3.json 이미 생성됨)

  `docker compose up -d`

### 2. 어드민 개발 서버

  `bun dev`

### 3. `http://localhost:3020/prompts/new` 에서 이미지 업로드 테스트
