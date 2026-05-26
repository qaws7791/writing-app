# API OpenAPI 문서 통합 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**목표:** `apps/api`가 OpenAPI JSON 파일을 생성하고 `apps/docs`가 이 파일을 읽어 Fumadocs API 문서를 생성한다.

**아키텍처:** 파일 기반 생성 파이프라인을 사용한다. API 앱은 네트워크 서버를 띄우지 않고 Hono 앱의 `/openapi.json` 응답을 JSON 파일로 저장하며, docs 앱은 `fumadocs-openapi`로 해당 파일에서 MDX 문서를 생성한다.

**기술 스택:** Bun 1.3.10, Hono, hono-openapi, Fumadocs, fumadocs-openapi 10.8.6, Next.js 정적 export.

---

## 파일 구조

- 수정: `apps/api/package.json`
  - `openapi:generate` 스크립트를 추가한다.
  - OpenAPI 문서 타입을 위해 `openapi-types`를 직접 의존성으로 추가한다.

- 생성: `apps/api/src/openapi/openapi-document.ts`
  - OpenAPI 문서를 생성하는 함수와 생성 전용 의존성 조립을 담당한다.

- 생성: `apps/api/src/openapi/openapi-document.test.ts`
  - 생성 함수가 현재 API 경로를 포함하는 OpenAPI 문서를 반환하는지 검증한다.

- 생성: `apps/api/src/scripts/generate-openapi.ts`
  - OpenAPI JSON 파일을 `apps/docs/openapi/writing-app-api.json`에 쓴다.

- 수정: `apps/docs/package.json`
  - `fumadocs-openapi` 의존성과 OpenAPI 문서 생성 스크립트를 추가한다.

- 생성: `apps/docs/lib/openapi.ts`
  - docs 앱이 읽을 OpenAPI 서버 인스턴스를 정의한다.

- 생성: `apps/docs/components/api-page.client.tsx`
  - `fumadocs-openapi` 클라이언트 설정을 정의한다.

- 생성: `apps/docs/components/api-page.tsx`
  - Fumadocs API 페이지 컴포넌트를 정의한다.

- 생성: `apps/docs/scripts/generate-openapi-docs.ts`
  - OpenAPI JSON 입력 파일에서 Fumadocs MDX 문서를 생성한다.

- 수정: `apps/docs/lib/source.ts`
  - `openapiPlugin()`을 loader plugin에 추가한다.

- 수정: `apps/docs/app/docs/[[...slug]]/page.tsx`
  - OpenAPI 페이지는 `APIPage`로 렌더링한다.

- 수정: `apps/docs/app/global.css`
  - `fumadocs-openapi/css/preset.css`를 추가한다.

- 생성 산출물: `apps/docs/openapi/writing-app-api.json`
  - API 앱 생성 스크립트가 쓰는 OpenAPI 입력 파일이다.

- 생성 산출물: `apps/docs/content/docs/api/**`
  - docs 앱 생성 스크립트가 쓰는 Fumadocs API 레퍼런스 MDX 문서다.

- 수정: `docs/api-openapi-docs.md`
  - 구현 완료 내용과 검증 결과를 기록한다.

---

### Task 1: docs 앱 OpenAPI 의존성 추가

**Files:**

- Modify: `apps/docs/package.json`
- Modify: `bun.lock`

- [ ] **Step 1: 현재 호환 버전을 확인한다**

Run:

```bash
npm view fumadocs-openapi@10.8.6 peerDependencies --json
```

Expected: `fumadocs-core`와 `fumadocs-ui` peer range가 현재 `16.8.7`을 포함하는 `^16.7.15`로 나온다.

- [ ] **Step 2: 의존성을 추가한다**

Run:

```bash
bun add --cwd apps/docs fumadocs-openapi@10.8.6
```

Expected: `apps/docs/package.json`에 `fumadocs-openapi`가 추가되고 `bun.lock`이 갱신된다.

- [ ] **Step 3: docs 의존성 해석을 확인한다**

Run:

```bash
bun --filter docs lint
```

Expected: 현재 코드 기준 lint가 통과한다.

---

### Task 2: API 앱 OpenAPI 문서 생성 함수 추가

**Files:**

- Create: `apps/api/src/openapi/openapi-document.ts`
- Create: `apps/api/src/openapi/openapi-document.test.ts`
- Modify: `apps/api/package.json`
- Modify: `bun.lock`

- [ ] **Step 1: OpenAPI 타입 의존성을 추가한다**

Run:

```bash
bun add --cwd apps/api openapi-types@12.1.3
```

Expected: `apps/api/package.json`에 `openapi-types`가 직접 의존성으로 추가된다.

- [ ] **Step 2: 실패하는 테스트를 작성한다**

Create `apps/api/src/openapi/openapi-document.test.ts`:

```typescript
import { describe, expect, it } from "vitest"

import { createOpenApiDocument } from "@/openapi/openapi-document"

describe("createOpenApiDocument", () => {
  it("creates the current API OpenAPI document", async () => {
    const document = await createOpenApiDocument()

    expect(document.openapi).toBe("3.1.0")
    expect(document.info.title).toBe("Writing App API")
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/openapi.json")
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).toHaveProperty("/courses/search")
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}")
    expect(document.paths).toHaveProperty("/me")
    expect(document.paths).toHaveProperty("/profile")
    expect(document.paths).toHaveProperty("/progress")
    expect(document.paths).toHaveProperty("/courses/{courseId}/progress")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/progress")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/answers")
    expect(document.paths).toHaveProperty("/lessons/{lessonId}/complete")
    expect(document.paths).toHaveProperty("/ai-feedback")
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run:

```bash
bun --filter @workspace/api test -- src/openapi/openapi-document.test.ts
```

Expected: `Cannot find module "@/openapi/openapi-document"` 이유로 실패한다.

- [ ] **Step 4: 최소 구현을 작성한다**

Create `apps/api/src/openapi/openapi-document.ts`:

```typescript
import type { OpenAPIV3_1 } from "openapi-types"

import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { ContentService } from "@workspace/core/content"
import type { LearningService } from "@workspace/core/learning"

import type { CurrentAuthSession } from "@/auth/session"
import { createApiApp, type ApiLogger } from "@/app"

export type OpenApiDocument = OpenAPIV3_1.Document

const openApiGenerationError = new Error(
  "OpenAPI generation dependency should not be called."
)

const openApiLogger: ApiLogger = {
  error() {},
  info() {},
}

const openApiContentService: ContentService = {
  async getCourseDetail() {
    throw openApiGenerationError
  },
  async getLesson() {
    throw openApiGenerationError
  },
  async listCourseCategories() {
    throw openApiGenerationError
  },
  async searchCourses() {
    throw openApiGenerationError
  },
}

const openApiLearningService: LearningService = {
  async completeLesson() {
    throw openApiGenerationError
  },
  async getCourseProgress() {
    throw openApiGenerationError
  },
  async getLessonProgress() {
    throw openApiGenerationError
  },
  async getProfile() {
    throw openApiGenerationError
  },
  async listProgress() {
    throw openApiGenerationError
  },
  async saveLessonAnswer() {
    throw openApiGenerationError
  },
  async saveLessonProgress() {
    throw openApiGenerationError
  },
}

const openApiAiFeedbackService: AiFeedbackService = {
  async createFeedback() {
    throw openApiGenerationError
  },
}

const noSessionAuth = {
  async getSession(): Promise<CurrentAuthSession | null> {
    return null
  },
  async handler() {
    throw openApiGenerationError
  },
}

export async function createOpenApiDocument(): Promise<OpenApiDocument> {
  const app = createApiApp({
    aiFeedbackService: openApiAiFeedbackService,
    auth: noSessionAuth,
    async checkDatabase() {
      throw openApiGenerationError
    },
    contentService: openApiContentService,
    learningService: openApiLearningService,
    logger: openApiLogger,
  })

  const response = await app.request("/openapi.json")
  if (!response.ok) {
    throw new Error(`OpenAPI document generation failed: ${response.status}`)
  }

  return (await response.json()) as OpenApiDocument
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run:

```bash
bun --filter @workspace/api test -- src/openapi/openapi-document.test.ts
```

Expected: 테스트가 통과한다.

---

### Task 3: API 앱 OpenAPI 파일 생성 스크립트 추가

**Files:**

- Create: `apps/api/src/scripts/generate-openapi.ts`
- Modify: `apps/api/package.json`
- Create: `apps/docs/openapi/writing-app-api.json`

- [ ] **Step 1: 생성 스크립트를 작성한다**

Create `apps/api/src/scripts/generate-openapi.ts`:

```typescript
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { createOpenApiDocument } from "@/openapi/openapi-document"

const defaultOutputPath = fileURLToPath(
  new URL("../../../docs/openapi/writing-app-api.json", import.meta.url)
)

const outputPath = process.argv[2] ?? defaultOutputPath
const document = await createOpenApiDocument()

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`)

console.log(`OpenAPI document written to ${outputPath}`)
```

- [ ] **Step 2: API 앱 스크립트를 추가한다**

Modify `apps/api/package.json` scripts:

```json
{
  "scripts": {
    "dev": "bun --watch src/main.ts",
    "start": "bun src/main.ts",
    "openapi:generate": "bun src/scripts/generate-openapi.ts",
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: 파일 생성을 실행한다**

Run:

```bash
bun --filter @workspace/api openapi:generate
```

Expected: `apps/docs/openapi/writing-app-api.json` 파일이 생성되고 `/courses`, `/lessons/{lessonId}`, `/ai-feedback` 경로가 포함된다.

- [ ] **Step 4: API 앱 검증을 실행한다**

Run:

```bash
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
```

Expected: 세 명령이 모두 통과한다.

---

### Task 4: docs 앱 OpenAPI 설정과 생성 스크립트 추가

**Files:**

- Create: `apps/docs/lib/openapi.ts`
- Create: `apps/docs/scripts/generate-openapi-docs.ts`
- Modify: `apps/docs/package.json`
- Create: `apps/docs/content/docs/api/**`

- [ ] **Step 1: OpenAPI 서버 인스턴스를 추가한다**

Create `apps/docs/lib/openapi.ts`:

```typescript
import { createOpenAPI } from "fumadocs-openapi/server"

export const openapi = createOpenAPI({
  input: ["openapi/writing-app-api.json"],
})
```

- [ ] **Step 2: 실패하는 생성 명령을 먼저 실행한다**

Run:

```bash
bun apps/docs/scripts/generate-openapi-docs.ts
```

Expected: `apps/docs/scripts/generate-openapi-docs.ts` 파일이 없어 실패한다.

- [ ] **Step 3: Fumadocs OpenAPI 문서 생성 스크립트를 작성한다**

Create `apps/docs/scripts/generate-openapi-docs.ts`:

```typescript
import { generateFiles } from "fumadocs-openapi"

import { openapi } from "@/lib/openapi"

await generateFiles({
  input: openapi,
  output: "content/docs/api",
  includeDescription: true,
  meta: {
    folderStyle: "folder",
  },
})
```

- [ ] **Step 4: docs 앱 스크립트를 추가한다**

Modify `apps/docs/package.json` scripts:

```json
{
  "scripts": {
    "build": "bun run openapi:generate && next build",
    "dev": "next dev",
    "start": "serve out",
    "openapi:generate": "bun scripts/generate-openapi-docs.ts",
    "types:check": "bun run openapi:generate && fumadocs-mdx && next typegen && tsc --noEmit",
    "postinstall": "fumadocs-mdx",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 5: 문서 생성을 실행한다**

Run:

```bash
bun --filter docs openapi:generate
```

Expected: `apps/docs/content/docs/api` 아래에 OpenAPI 기반 MDX 문서와 `meta.json`이 생성된다.

---

### Task 5: docs 앱에서 OpenAPI 페이지 렌더링 연결

**Files:**

- Create: `apps/docs/components/api-page.client.tsx`
- Create: `apps/docs/components/api-page.tsx`
- Modify: `apps/docs/lib/source.ts`
- Modify: `apps/docs/app/docs/[[...slug]]/page.tsx`
- Modify: `apps/docs/app/global.css`

- [ ] **Step 1: OpenAPI 클라이언트 설정을 추가한다**

Create `apps/docs/components/api-page.client.tsx`:

```typescript
"use client"

import { defineClientConfig } from "fumadocs-openapi/ui/client"

export default defineClientConfig()
```

- [ ] **Step 2: APIPage 컴포넌트를 추가한다**

Create `apps/docs/components/api-page.tsx`:

```typescript
import { openapi } from "@/lib/openapi"
import { createAPIPage } from "fumadocs-openapi/ui"

import client from "./api-page.client"

export const APIPage = createAPIPage(openapi, {
  client,
})
```

- [ ] **Step 3: Fumadocs source loader에 OpenAPI plugin을 추가한다**

Modify `apps/docs/lib/source.ts`:

```typescript
import { docs } from "collections/server"
import { loader } from "fumadocs-core/source"
import { openapiPlugin } from "fumadocs-openapi/server"
import { docsContentRoute, docsImageRoute, docsRoute } from "./shared"

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [openapiPlugin()],
})
```

- [ ] **Step 4: OpenAPI 페이지 렌더링 분기를 추가한다**

Modify `apps/docs/app/docs/[[...slug]]/page.tsx` inside `Page()` after `markdownUrl`:

```typescript
  if (page.data.type === "openapi") {
    return (
      <DocsPage toc={page.data.toc} full>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-0">
          {page.data.description}
        </DocsDescription>
        <DocsBody>
          <APIPage {...page.data.getAPIPageProps()} />
        </DocsBody>
      </DocsPage>
    )
  }
```

Also add the import:

```typescript
import { APIPage } from "@/components/api-page"
```

- [ ] **Step 5: OpenAPI CSS preset을 추가한다**

Modify `apps/docs/app/global.css`:

```css
@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
@import "fumadocs-openapi/css/preset.css";
```

- [ ] **Step 6: docs 타입 검사를 실행한다**

Run:

```bash
bun --filter docs types:check
```

Expected: OpenAPI 페이지 타입과 generated collection 타입이 통과한다.

---

### Task 6: 생성 파이프라인과 문서 갱신

**Files:**

- Modify: `docs/api-openapi-docs.md`

- [ ] **Step 1: 전체 생성 흐름을 실행한다**

Run:

```bash
bun --filter @workspace/api openapi:generate
bun --filter docs openapi:generate
```

Expected: OpenAPI JSON과 `content/docs/api` 문서가 최신 상태로 생성된다.

- [ ] **Step 2: `/docs` 문서를 완료 상태로 갱신한다**

Append to `docs/api-openapi-docs.md`:

```markdown
## 2026-05-26 완료

- `apps/api`에 OpenAPI JSON 파일 생성 스크립트를 추가했다.
- 생성 파일은 `apps/docs/openapi/writing-app-api.json`에 저장된다.
- `apps/docs`는 `fumadocs-openapi`로 `apps/docs/content/docs/api` 문서를 생성한다.
- docs 앱은 OpenAPI 전용 페이지를 `APIPage`로 렌더링하며 정적 export 구조를 유지한다.
- 검증 결과를 아래에 기록한다.
```

- [ ] **Step 3: 변경 문서 포맷을 확인한다**

Run:

```bash
bunx prettier --check docs/api-openapi-docs.md docs/superpowers/plans/2026-05-26-api-openapi-docs.md
```

Expected: 두 문서가 Prettier 검사를 통과한다.

---

### Task 7: 최종 검증

**Files:**

- No direct edits

- [ ] **Step 1: 앱별 검증을 실행한다**

Run:

```bash
bun --filter @workspace/api test
bun --filter @workspace/api typecheck
bun --filter @workspace/api lint
bun --filter docs types:check
bun --filter docs lint
bun --filter docs build
```

Expected: 각 명령이 통과한다. `docs build`는 API 서버 프로세스 없이 성공해야 한다.

- [ ] **Step 2: 가능한 루트 검증을 실행한다**

Run:

```bash
bun run test
bun run lint
bun run typecheck
git diff --check
bun lefthook run pre-commit
```

Expected: 가능한 범위에서 통과한다. 기존 `@workspace/ui`의 `clsx` 타입 해석 실패나 기존 포맷 불일치가 재현되면 이번 변경 파일과 무관한 기존 이슈로 명확히 기록한다.

- [ ] **Step 3: 사용한 프로세스를 종료한다**

Run:

```bash
Get-Process | Where-Object { $_.ProcessName -match "node|bun|next" }
```

Expected: 이번 작업에서 남긴 장기 실행 dev server가 없다. 장기 실행 프로세스를 시작하지 않았다면 종료할 항목이 없다.
