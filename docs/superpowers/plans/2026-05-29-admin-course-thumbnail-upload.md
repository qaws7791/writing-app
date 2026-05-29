# Admin Course Thumbnail Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 코스 상세 페이지에서 signed URL로 RustFS에 썸네일을 즉시 업로드하고, 업로드된 공개 경로를 기존 코스 편집 저장 흐름으로 반영한다.

**Architecture:** Admin API가 업로드 요청 DTO를 검증하고 RustFS S3-compatible PUT signed URL을 발급한다. Admin Web은 파일 선택 즉시 signed URL로 직접 업로드한 뒤 `course.thumbnailPath`만 working copy에 반영해 dirty 상태를 만들고, 기존 editor save API가 DB 저장을 담당한다.

**Tech Stack:** Bun monorepo, Hono, Zod, AWS SDK v3 S3 presigner, Next.js 16, React 19, Vitest, Testing Library, RustFS S3-compatible API.

---

## File Structure

- `packages/core/src/admin/admin.dto.ts`: 썸네일 업로드 요청/응답 DTO 스키마와 타입을 추가한다.
- `packages/core/src/admin/admin.errors.ts`: `storage-unavailable` 오류 DTO를 추가한다.
- `packages/core/src/admin/admin.dto.test.ts`: DTO 검증 회귀 테스트를 추가한다.
- `apps/admin-api/package.json`: S3 signed URL 생성을 위한 AWS SDK v3 의존성을 추가한다.
- `apps/admin-api/src/env.ts`: RustFS/S3 환경 변수를 파싱해 `assetStorage` 설정을 노출한다.
- `apps/admin-api/src/env.test.ts`: 새 환경 변수 파싱을 검증한다.
- `apps/admin-api/src/storage/course-thumbnail-upload.ts`: object key 생성, 공개 경로 생성, signed PUT URL 생성 책임을 둔다.
- `apps/admin-api/src/storage/course-thumbnail-upload.test.ts`: storage helper의 결정적 동작을 검증한다.
- `apps/admin-api/src/routes/course-thumbnails.route.ts`: authenticated signed URL 발급 route를 추가한다.
- `apps/admin-api/src/app.ts`: 업로드 서비스를 앱 의존성으로 받고 route를 등록한다.
- `apps/admin-api/src/main.ts`: env 기반 업로드 서비스를 조립한다.
- `apps/admin-api/src/app.test.ts`: route 성공/검증 실패/스토리지 실패/비로그인 테스트를 추가한다.
- `apps/admin/src/lib/api/admin-api.ts`: Admin API 클라이언트 인터페이스에 signed URL 발급 method를 추가한다.
- `apps/admin/src/lib/api/http-admin-api.ts`: `POST /course-thumbnails/uploads` HTTP 호출을 추가한다.
- `apps/admin/src/lib/api/http-admin-api.test.ts`: HTTP client 요청 body와 경로를 검증한다.
- `apps/admin/src/features/courses/course-editor/course-summary-panel.tsx`: 숨겨진 file input, 업로드 상태, 업로드 오류 표시를 추가한다.
- `apps/admin/src/features/courses/course-editor/course-summary-panel.test.tsx`: 파일 input과 read-only 비활성화를 검증한다.
- `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`: 썸네일 파일 선택 props를 summary panel까지 전달한다.
- `apps/admin/src/features/courses/course-editor/editor-state.ts`: `thumbnailPath` 업데이트가 저장 payload에 유지되는지 테스트 보강 범위에 맞춰 타입을 유지한다.
- `apps/admin/src/features/courses/admin-course-detail-page.tsx`: 파일 선택 즉시 signed URL 발급과 PUT 업로드를 실행하고 working copy를 갱신한다.
- `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`: 성공/실패 UI 흐름과 저장 payload를 검증한다.
- `apps/admin-api/.env.example`, `.env.docker.example`, `BACKEND.md`, `docs/operations-environment.md`, `docs/admin-site.md`: RustFS 업로드 환경과 작업 완료 내역을 문서화한다.

---

### Task 1: Core DTO And Error Contract

**Files:**

- Modify: `packages/core/src/admin/admin.dto.ts`
- Modify: `packages/core/src/admin/admin.errors.ts`
- Create: `packages/core/src/admin/admin.dto.test.ts`

- [ ] **Step 1: Write failing DTO tests**

Add `packages/core/src/admin/admin.dto.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  adminCreateCourseThumbnailUploadDtoSchema,
  adminCreateCourseThumbnailUploadRequestDtoSchema,
} from "@/admin/admin.dto"
import { adminStorageUnavailableErrorDtoSchema } from "@/admin/admin.errors"

describe("adminCreateCourseThumbnailUploadRequestDtoSchema", () => {
  it("accepts supported image metadata", () => {
    expect(
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.webp",
        contentType: "image/webp",
        contentLength: 1024,
      })
    ).toEqual({
      fileName: "thumbnail.webp",
      contentType: "image/webp",
      contentLength: 1024,
    })
  })

  it("rejects unsupported image metadata", () => {
    expect(() =>
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.gif",
        contentType: "image/gif",
        contentLength: 1024,
      })
    ).toThrow()

    expect(() =>
      adminCreateCourseThumbnailUploadRequestDtoSchema.parse({
        fileName: "thumbnail.png",
        contentType: "image/png",
        contentLength: 5 * 1024 * 1024 + 1,
      })
    ).toThrow()
  })
})

describe("adminCreateCourseThumbnailUploadDtoSchema", () => {
  it("accepts a signed PUT upload contract", () => {
    expect(
      adminCreateCourseThumbnailUploadDtoSchema.parse({
        uploadUrl:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset.png?X-Amz-Signature=abc",
        method: "PUT",
        headers: {
          "content-type": "image/png",
        },
        thumbnailPath:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset.png",
      })
    ).toMatchObject({
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
    })
  })
})

describe("adminStorageUnavailableErrorDtoSchema", () => {
  it("uses a storage-specific unavailable error", () => {
    expect(
      adminStorageUnavailableErrorDtoSchema.parse({
        code: "storage-unavailable",
        message: "스토리지를 사용할 수 없습니다.",
      })
    ).toEqual({
      code: "storage-unavailable",
      message: "스토리지를 사용할 수 없습니다.",
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
bun --filter @workspace/core test -- admin.dto.test.ts
```

Expected: FAIL because `adminCreateCourseThumbnailUploadDtoSchema`, `adminCreateCourseThumbnailUploadRequestDtoSchema`, and `adminStorageUnavailableErrorDtoSchema` do not exist.

- [ ] **Step 3: Add DTO and error schemas**

In `packages/core/src/admin/admin.errors.ts`, add:

```ts
export const adminStorageUnavailableErrorDtoSchema = z.object({
  code: z.literal("storage-unavailable"),
  message: z.literal("스토리지를 사용할 수 없습니다."),
})
```

Then extend types:

```ts
export type AdminStorageUnavailableErrorDto = z.infer<
  typeof adminStorageUnavailableErrorDtoSchema
>

export type AdminErrorDto =
  | AdminDatabaseUnavailableErrorDto
  | AdminInvalidRequestErrorDto
  | AdminNotFoundErrorDto
  | AdminConflictErrorDto
  | AdminStorageUnavailableErrorDto
```

In `packages/core/src/admin/admin.dto.ts`, add:

```ts
export const adminCourseThumbnailContentTypeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/webp",
])

export const adminCreateCourseThumbnailUploadRequestDtoSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: adminCourseThumbnailContentTypeSchema,
  contentLength: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024),
})

export const adminCreateCourseThumbnailUploadDtoSchema = z.object({
  uploadUrl: z.string().url(),
  method: z.literal("PUT"),
  headers: z.object({
    "content-type": adminCourseThumbnailContentTypeSchema,
  }),
  thumbnailPath: z.string().url(),
})
```

Then add exported types near the other DTO type exports:

```ts
export type AdminCourseThumbnailContentType = z.infer<
  typeof adminCourseThumbnailContentTypeSchema
>
export type AdminCreateCourseThumbnailUploadRequestDto = z.infer<
  typeof adminCreateCourseThumbnailUploadRequestDtoSchema
>
export type AdminCreateCourseThumbnailUploadDto = z.infer<
  typeof adminCreateCourseThumbnailUploadDtoSchema
>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
bun --filter @workspace/core test -- admin.dto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -- packages/core/src/admin/admin.dto.ts packages/core/src/admin/admin.errors.ts packages/core/src/admin/admin.dto.test.ts
git commit -m "어드민 썸네일 업로드 DTO 추가"
```

---

### Task 2: Admin API Environment And Storage Helper

**Files:**

- Modify: `apps/admin-api/package.json`
- Modify: `bun.lock`
- Modify: `apps/admin-api/src/env.ts`
- Modify: `apps/admin-api/src/env.test.ts`
- Create: `apps/admin-api/src/storage/course-thumbnail-upload.ts`
- Create: `apps/admin-api/src/storage/course-thumbnail-upload.test.ts`

- [ ] **Step 1: Add S3 SDK dependencies**

Run:

```powershell
bun add --filter @workspace/admin-api @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Expected: `apps/admin-api/package.json` includes the two dependencies and `bun.lock` changes.

- [ ] **Step 2: Write failing env test**

In `apps/admin-api/src/env.test.ts`, update the first test input and expected value:

```ts
expect(
  parseAdminApiEnv({
    ADMIN_BETTER_AUTH_SECRET: "admin-secret",
    ADMIN_BETTER_AUTH_URL: "http://localhost:4001",
    ADMIN_CORS_ORIGIN: "http://localhost:3001",
    DATABASE_URL: "file:../../data/api.sqlite",
    ADMIN_ASSET_S3_ENDPOINT: "http://localhost:9000",
    ADMIN_ASSET_S3_REGION: "us-east-1",
    ADMIN_ASSET_S3_BUCKET: "writing-app-public-assets",
    ADMIN_ASSET_PUBLIC_BASE_URL:
      "http://localhost:9000/writing-app-public-assets",
    ADMIN_ASSET_S3_ACCESS_KEY: "local-access-key",
    ADMIN_ASSET_S3_SECRET_KEY: "local-secret-key",
  })
).toEqual({
  betterAuthSecret: "admin-secret",
  betterAuthUrl: "http://localhost:4001",
  corsOrigins: ["http://localhost:3001"],
  databasePath: "../../data/api.sqlite",
  environment: "development",
  logLevel: "info",
  port: 4001,
  assetStorage: {
    accessKey: "local-access-key",
    bucket: "writing-app-public-assets",
    endpoint: "http://localhost:9000",
    publicBaseUrl: "http://localhost:9000/writing-app-public-assets",
    region: "us-east-1",
    secretKey: "local-secret-key",
  },
})
```

- [ ] **Step 3: Run env test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin-api test -- env.test.ts
```

Expected: FAIL because `assetStorage` is not parsed.

- [ ] **Step 4: Implement env parsing**

In `apps/admin-api/src/env.ts`, extend `adminApiEnvSchema`:

```ts
  ADMIN_ASSET_S3_ACCESS_KEY: z.string().min(1),
  ADMIN_ASSET_S3_BUCKET: z.string().min(1),
  ADMIN_ASSET_S3_ENDPOINT: z.string().url(),
  ADMIN_ASSET_PUBLIC_BASE_URL: z.string().url(),
  ADMIN_ASSET_S3_REGION: z.string().min(1).default("us-east-1"),
```

Return the parsed config:

```ts
    assetStorage: {
      accessKey: env.ADMIN_ASSET_S3_ACCESS_KEY,
      bucket: env.ADMIN_ASSET_S3_BUCKET,
      endpoint: env.ADMIN_ASSET_S3_ENDPOINT,
      publicBaseUrl: env.ADMIN_ASSET_PUBLIC_BASE_URL,
      region: env.ADMIN_ASSET_S3_REGION,
      secretKey: env.ADMIN_ASSET_S3_SECRET_KEY,
    },
```

- [ ] **Step 5: Write failing storage helper test**

Create `apps/admin-api/src/storage/course-thumbnail-upload.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

import {
  createCourseThumbnailUpload,
  getCourseThumbnailObjectKey,
} from "@/storage/course-thumbnail-upload"

describe("getCourseThumbnailObjectKey", () => {
  it("creates a server-owned thumbnail key from content type", () => {
    expect(
      getCourseThumbnailObjectKey({
        contentType: "image/webp",
        id: "asset-1",
      })
    ).toBe("course-thumbnails/asset-1.webp")
  })
})

describe("createCourseThumbnailUpload", () => {
  it("returns a signed PUT contract and public thumbnail path", async () => {
    const createUploadUrl = vi.fn(async () => "http://signed-upload.local")

    await expect(
      createCourseThumbnailUpload(
        {
          fileName: "사용자 파일.png",
          contentType: "image/png",
          contentLength: 128,
        },
        {
          bucket: "writing-app-public-assets",
          createId: () => "asset-1",
          createUploadUrl,
          publicBaseUrl: "http://localhost:9000/writing-app-public-assets/",
        }
      )
    ).resolves.toEqual({
      uploadUrl: "http://signed-upload.local",
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
      thumbnailPath:
        "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
    })

    expect(createUploadUrl).toHaveBeenCalledWith({
      bucket: "writing-app-public-assets",
      key: "course-thumbnails/asset-1.png",
      contentType: "image/png",
    })
  })
})
```

- [ ] **Step 6: Run storage test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin-api test -- course-thumbnail-upload.test.ts
```

Expected: FAIL because `course-thumbnail-upload.ts` does not exist.

- [ ] **Step 7: Implement storage helper**

Create `apps/admin-api/src/storage/course-thumbnail-upload.ts`:

```ts
import { randomUUID } from "node:crypto"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import type {
  AdminCourseThumbnailContentType,
  AdminCreateCourseThumbnailUploadDto,
  AdminCreateCourseThumbnailUploadRequestDto,
} from "@workspace/core/admin"

type CreateUploadUrlInput = {
  bucket: string
  key: string
  contentType: AdminCourseThumbnailContentType
}

type CreateCourseThumbnailUploadDependencies = {
  bucket: string
  createId?: () => string
  createUploadUrl: (input: CreateUploadUrlInput) => Promise<string>
  publicBaseUrl: string
}

export type CourseThumbnailStorageConfig = {
  accessKey: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  region: string
  secretKey: string
}

const extensionByContentType: Record<AdminCourseThumbnailContentType, string> =
  {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }

export function getCourseThumbnailObjectKey(input: {
  contentType: AdminCourseThumbnailContentType
  id: string
}) {
  return `course-thumbnails/${input.id}.${extensionByContentType[input.contentType]}`
}

export async function createCourseThumbnailUpload(
  input: AdminCreateCourseThumbnailUploadRequestDto,
  dependencies: CreateCourseThumbnailUploadDependencies
): Promise<AdminCreateCourseThumbnailUploadDto> {
  const key = getCourseThumbnailObjectKey({
    contentType: input.contentType,
    id: dependencies.createId?.() ?? randomUUID(),
  })
  const uploadUrl = await dependencies.createUploadUrl({
    bucket: dependencies.bucket,
    key,
    contentType: input.contentType,
  })

  return {
    uploadUrl,
    method: "PUT",
    headers: {
      "content-type": input.contentType,
    },
    thumbnailPath: `${dependencies.publicBaseUrl.replace(/\/+$/, "")}/${key}`,
  }
}

export function createS3CourseThumbnailUploadUrlFactory(
  config: CourseThumbnailStorageConfig
) {
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
  })

  return async (input: CreateUploadUrlInput) =>
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
      {
        expiresIn: 300,
      }
    )
}
```

- [ ] **Step 8: Run env and storage tests to verify they pass**

Run:

```powershell
bun --filter @workspace/admin-api test -- env.test.ts course-thumbnail-upload.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add -- apps/admin-api/package.json bun.lock apps/admin-api/src/env.ts apps/admin-api/src/env.test.ts apps/admin-api/src/storage/course-thumbnail-upload.ts apps/admin-api/src/storage/course-thumbnail-upload.test.ts
git commit -m "어드민 썸네일 스토리지 업로드 준비"
```

---

### Task 3: Admin API Signed URL Route

**Files:**

- Create: `apps/admin-api/src/routes/course-thumbnails.route.ts`
- Modify: `apps/admin-api/src/app.ts`
- Modify: `apps/admin-api/src/main.ts`
- Modify: `apps/admin-api/src/app.test.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.ts`

- [ ] **Step 1: Write failing route tests**

In `apps/admin-api/src/app.test.ts`, import the new type after it exists in this task:

```ts
import type { CourseThumbnailUploadService } from "@/routes/course-thumbnails.route"
```

Add this fake service near `adminService`:

```ts
const courseThumbnailUploads: CourseThumbnailUploadService = {
  async create(input) {
    return {
      status: "ok",
      value: {
        uploadUrl: `http://signed-upload.local/${input.fileName}`,
        method: "PUT",
        headers: {
          "content-type": input.contentType,
        },
        thumbnailPath:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
      },
    }
  },
}
```

Update `createTestApp` to pass the dependency:

```ts
function createTestApp(
  input?: Partial<{
    adminService: AdminService
    auth: AdminAuthRuntime
    courseThumbnailUploads: CourseThumbnailUploadService
  }>
) {
  return createAdminApiApp({
    adminService: input?.adminService ?? adminService,
    auth: input?.auth ?? auth,
    courseThumbnailUploads:
      input?.courseThumbnailUploads ?? courseThumbnailUploads,
    async checkDatabase() {
      return true
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
  })
}
```

Add tests:

```ts
it("creates a protected course thumbnail signed upload", async () => {
  const response = await createTestApp().request("/course-thumbnails/uploads", {
    body: JSON.stringify({
      fileName: "thumbnail.png",
      contentType: "image/png",
      contentLength: 128,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  })

  expect(response.status).toBe(201)
  await expect(response.json()).resolves.toEqual({
    uploadUrl: "http://signed-upload.local/thumbnail.png",
    method: "PUT",
    headers: {
      "content-type": "image/png",
    },
    thumbnailPath:
      "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
  })
})

it("rejects invalid course thumbnail upload metadata", async () => {
  const response = await createTestApp().request("/course-thumbnails/uploads", {
    body: JSON.stringify({
      fileName: "thumbnail.gif",
      contentType: "image/gif",
      contentLength: 128,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  })

  expect(response.status).toBe(400)
  await expect(response.json()).resolves.toEqual({
    code: "invalid-request",
    message: "썸네일 업로드 요청 본문이 올바르지 않습니다.",
  })
})

it("maps course thumbnail storage failures to unavailable", async () => {
  const response = await createTestApp({
    courseThumbnailUploads: {
      async create() {
        return {
          status: "unavailable",
          error: {
            code: "storage-unavailable",
            message: "스토리지를 사용할 수 없습니다.",
          },
        }
      },
    },
  }).request("/course-thumbnails/uploads", {
    body: JSON.stringify({
      fileName: "thumbnail.png",
      contentType: "image/png",
      contentLength: 128,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  })

  expect(response.status).toBe(503)
  await expect(response.json()).resolves.toEqual({
    code: "storage-unavailable",
    message: "스토리지를 사용할 수 없습니다.",
  })
})
```

Also update the OpenAPI assertion:

```ts
expect(document.paths).toHaveProperty("/course-thumbnails/uploads")
```

- [ ] **Step 2: Run route test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin-api test -- app.test.ts
```

Expected: FAIL because the route and dependency do not exist.

- [ ] **Step 3: Implement route**

Create `apps/admin-api/src/routes/course-thumbnails.route.ts`:

```ts
import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCreateCourseThumbnailUploadDtoSchema,
  adminCreateCourseThumbnailUploadRequestDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminStorageUnavailableErrorDtoSchema,
  type AdminCreateCourseThumbnailUploadDto,
  type AdminCreateCourseThumbnailUploadRequestDto,
  type AdminStorageUnavailableErrorDto,
} from "@workspace/core/admin"

import type { AdminAuthRuntime } from "@/auth/admin-session"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export type CourseThumbnailUploadResult =
  | {
      status: "ok"
      value: AdminCreateCourseThumbnailUploadDto
    }
  | {
      status: "unavailable"
      error: AdminStorageUnavailableErrorDto
    }

export interface CourseThumbnailUploadService {
  create(
    input: AdminCreateCourseThumbnailUploadRequestDto
  ): Promise<CourseThumbnailUploadResult>
}

export function registerCourseThumbnailsRoute(
  app: Hono,
  input: {
    auth: AdminAuthRuntime
    courseThumbnailUploads: CourseThumbnailUploadService
  }
) {
  app.post(
    "/course-thumbnails/uploads",
    requireAdminSession(input.auth),
    describeRoute({
      responses: {
        201: {
          description: "코스 썸네일 업로드 signed URL입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCreateCourseThumbnailUploadDtoSchema),
            },
          },
        },
        400: {
          description: "썸네일 업로드 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        503: {
          description: "스토리지를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminStorageUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const parsed =
        adminCreateCourseThumbnailUploadRequestDtoSchema.safeParse(body)

      if (!parsed.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "썸네일 업로드 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      const result = await input.courseThumbnailUploads.create(parsed.data)

      switch (result.status) {
        case "ok":
          return context.json(result.value, 201)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Register route and runtime service**

In `apps/admin-api/src/app.ts`, import and add dependency:

```ts
import {
  registerCourseThumbnailsRoute,
  type CourseThumbnailUploadService,
} from "@/routes/course-thumbnails.route"

export interface AdminApiAppDependencies {
  adminService: AdminService
  auth: AdminAuthRuntime
  checkDatabase(): Promise<boolean>
  corsOrigins?: string[]
  courseThumbnailUploads: CourseThumbnailUploadService
  logger: AdminApiLogger
}
```

Register before openapi:

```ts
registerCourseThumbnailsRoute(app, dependencies)
```

In `apps/admin-api/src/main.ts`, create the service:

```ts
import {
  createCourseThumbnailUpload,
  createS3CourseThumbnailUploadUrlFactory,
} from "@/storage/course-thumbnail-upload"

const courseThumbnailUploads = {
  async create(input) {
    try {
      return {
        status: "ok",
        value: await createCourseThumbnailUpload(input, {
          bucket: env.assetStorage.bucket,
          createUploadUrl: createS3CourseThumbnailUploadUrlFactory(
            env.assetStorage
          ),
          publicBaseUrl: env.assetStorage.publicBaseUrl,
        }),
      }
    } catch (error) {
      logger.error({ error }, "Course thumbnail signed URL creation failed")

      return {
        status: "unavailable",
        error: {
          code: "storage-unavailable",
          message: "스토리지를 사용할 수 없습니다.",
        },
      }
    }
  },
}
```

Then pass `courseThumbnailUploads` into `createAdminApiApp`.

- [ ] **Step 5: Run route test to verify it passes**

Run:

```powershell
bun --filter @workspace/admin-api test -- app.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add -- apps/admin-api/src/routes/course-thumbnails.route.ts apps/admin-api/src/app.ts apps/admin-api/src/main.ts apps/admin-api/src/app.test.ts
git commit -m "어드민 썸네일 업로드 URL 발급 API 추가"
```

---

### Task 4: Admin Web API Client

**Files:**

- Modify: `apps/admin/src/lib/api/admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.ts`
- Modify: `apps/admin/src/lib/api/http-admin-api.test.ts`

- [ ] **Step 1: Write failing HTTP client test**

In `apps/admin/src/lib/api/http-admin-api.test.ts`, add:

```ts
it("creates a course thumbnail signed upload request", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    createJsonResponse({
      uploadUrl: "http://signed-upload.local",
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
      thumbnailPath:
        "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
    })
  )
  const api = createHttpAdminApi({
    baseUrl: "http://localhost:4001",
    fetch: fetchMock,
  })

  await api.createCourseThumbnailUpload({
    fileName: "thumbnail.png",
    contentType: "image/png",
    contentLength: 128,
  })

  const request = getRequest(fetchMock)
  expect(request.url).toBe("http://localhost:4001/course-thumbnails/uploads")
  expect(request.method).toBe("POST")
  expect(request.headers.get("content-type")).toBe("application/json")
  await expect(request.json()).resolves.toEqual({
    fileName: "thumbnail.png",
    contentType: "image/png",
    contentLength: 128,
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin test -- http-admin-api.test.ts
```

Expected: FAIL because `createCourseThumbnailUpload` does not exist.

- [ ] **Step 3: Add Admin API client method**

In `apps/admin/src/lib/api/admin-api.ts`, import types:

```ts
  AdminCreateCourseThumbnailUploadDto,
  AdminCreateCourseThumbnailUploadRequestDto,
```

Then add to `AdminApi`:

```ts
  createCourseThumbnailUpload(
    input: AdminCreateCourseThumbnailUploadRequestDto
  ): Promise<AdminApiResult<AdminCreateCourseThumbnailUploadDto>>
```

In `apps/admin/src/lib/api/http-admin-api.ts`, add:

```ts
    createCourseThumbnailUpload(input) {
      return requestJson(
        fetcher,
        createAdminApiUrl(baseUrl, "/course-thumbnails/uploads"),
        headers,
        {
          body: input,
          method: "POST",
        }
      )
    },
```

Also update `isAdminApiErrorDto`:

```ts
    value.code === "storage-unavailable" ||
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
bun --filter @workspace/admin test -- http-admin-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -- apps/admin/src/lib/api/admin-api.ts apps/admin/src/lib/api/http-admin-api.ts apps/admin/src/lib/api/http-admin-api.test.ts
git commit -m "어드민 썸네일 업로드 클라이언트 추가"
```

---

### Task 5: Admin Thumbnail Upload UI

**Files:**

- Modify: `apps/admin/src/features/courses/course-editor/course-summary-panel.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-summary-panel.test.tsx`
- Modify: `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- Modify: `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`

- [ ] **Step 1: Write failing summary panel tests**

In `apps/admin/src/features/courses/course-editor/course-summary-panel.test.tsx`, add:

```ts
it("calls thumbnail file selection when an image is chosen", async () => {
  const user = userEvent.setup()
  const onSelectThumbnailFile = vi.fn()

  render(
    <CourseSummaryPanel
      course={{
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장 성분을 익힙니다.",
        thumbnailPath: "/course-thumbnails/sentence-structure.png",
        sortOrder: 1,
      }}
      onSelectThumbnailFile={onSelectThumbnailFile}
    />
  )

  const file = new File(["image"], "thumbnail.png", { type: "image/png" })
  await user.upload(screen.getByLabelText("썸네일 파일"), file)

  expect(onSelectThumbnailFile).toHaveBeenCalledWith(file)
})

it("disables thumbnail file selection while read-only", () => {
  render(
    <CourseSummaryPanel
      course={{
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장 성분을 익힙니다.",
        thumbnailPath: "/course-thumbnails/sentence-structure.png",
        sortOrder: 1,
      }}
      isReadOnly
    />
  )

  expect(screen.getByLabelText("썸네일 파일")).toBeDisabled()
  expect(screen.getByRole("button", { name: "썸네일 변경" })).toBeDisabled()
})
```

Add missing imports:

```ts
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
```

- [ ] **Step 2: Run summary panel test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin test -- course-summary-panel.test.tsx
```

Expected: FAIL because the file input and prop do not exist.

- [ ] **Step 3: Implement summary panel file input**

In `course-summary-panel.tsx`, replace upload props with:

```ts
  isThumbnailUploading?: boolean
  thumbnailUploadError?: string | null
  onSelectThumbnailFile?: (file: File) => void
```

Add refs and handlers:

```ts
const fileInputRef = React.useRef<HTMLInputElement | null>(null)
const handleUploadButtonClick = React.useCallback(() => {
  fileInputRef.current?.click()
}, [])
const handleFileChange = React.useCallback(
  (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (file) {
      onSelectThumbnailFile?.(file)
    }
  },
  [onSelectThumbnailFile]
)
```

Render input and state:

```tsx
<input
  ref={fileInputRef}
  aria-label="썸네일 파일"
  className="sr-only"
  type="file"
  accept="image/png,image/jpeg,image/webp"
  disabled={isReadOnly || isThumbnailUploading}
  onChange={handleFileChange}
/>
<button
  type="button"
  className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
  disabled={isReadOnly || isThumbnailUploading}
  onClick={handleUploadButtonClick}
>
  {isThumbnailUploading ? "업로드 중..." : "썸네일 변경"}
</button>
{thumbnailUploadError ? (
  <p className="text-sm text-destructive">{thumbnailUploadError}</p>
) : null}
```

- [ ] **Step 4: Run summary panel test to verify it passes**

Run:

```powershell
bun --filter @workspace/admin test -- course-summary-panel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write failing page upload test**

In `apps/admin/src/features/courses/admin-course-detail-page.test.tsx`, extend `createAdminApiMock` with:

```ts
    async createCourseThumbnailUpload() {
      return {
        status: "ok",
        value: {
          uploadUrl: "http://signed-upload.local",
          method: "PUT",
          headers: {
            "content-type": "image/png",
          },
          thumbnailPath:
            "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
        },
      }
    },
```

Add success test:

```ts
it("uploads a selected thumbnail immediately and saves the uploaded path later", async () => {
  const user = userEvent.setup()
  const createCourseThumbnailUpload = vi.fn<
    AdminApi["createCourseThumbnailUpload"]
  >(async () => ({
    status: "ok",
    value: {
      uploadUrl: "http://signed-upload.local",
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
      thumbnailPath:
        "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
    },
  }))
  const saveCourseEditorDocument = vi.fn<
    AdminApi["saveCourseEditorDocument"]
  >(async (input) => ({
    status: "ok",
    value: {
      ...versionFixture,
      revision: input.baseRevision + 1,
      steps: input.steps,
    },
  }))
  const uploadFetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 200 }))

  render(
    <AdminCourseDetailPage
      adminApi={createAdminApiMock({
        createCourseThumbnailUpload,
        saveCourseEditorDocument,
      })}
      course={courseFixture}
      selectedVersionId="sentence-structure-v2"
      urlState={{
        versionId: "sentence-structure-v2",
        view: "lesson",
        lessonId: "sentence-structure-01",
        stepId: null,
      }}
      versions={[versionSummaryFixture]}
      version={versionFixture}
    />
  )

  const file = new File(["image"], "thumbnail.png", { type: "image/png" })
  await user.upload(screen.getByLabelText("썸네일 파일"), file)

  await waitFor(() => {
    expect(createCourseThumbnailUpload).toHaveBeenCalledWith({
      fileName: "thumbnail.png",
      contentType: "image/png",
      contentLength: file.size,
    })
  })
  expect(uploadFetch).toHaveBeenCalledWith(
    "http://signed-upload.local",
    expect.objectContaining({
      body: file,
      method: "PUT",
      headers: {
        "content-type": "image/png",
      },
    })
  )

  await user.click(screen.getByRole("button", { name: "저장" }))

  expect(saveCourseEditorDocument).toHaveBeenCalledWith(
    expect.objectContaining({
      course: expect.objectContaining({
        thumbnailPath:
          "http://localhost:9000/writing-app-public-assets/course-thumbnails/asset-1.png",
      }),
    })
  )
})
```

Add failure test:

```ts
it("does not dirty the editor when thumbnail upload fails", async () => {
  const user = userEvent.setup()
  const saveCourseEditorDocument = vi.fn<
    AdminApi["saveCourseEditorDocument"]
  >(async (input) => ({
    status: "ok",
    value: {
      ...versionFixture,
      revision: input.baseRevision + 1,
      steps: input.steps,
    },
  }))
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 500 })
  )

  render(
    <AdminCourseDetailPage
      adminApi={createAdminApiMock({
        saveCourseEditorDocument,
      })}
      course={courseFixture}
      selectedVersionId="sentence-structure-v2"
      urlState={{
        versionId: "sentence-structure-v2",
        view: "lesson",
        lessonId: "sentence-structure-01",
        stepId: null,
      }}
      versions={[versionSummaryFixture]}
      version={versionFixture}
    />
  )

  const file = new File(["image"], "thumbnail.png", { type: "image/png" })
  await user.upload(screen.getByLabelText("썸네일 파일"), file)

  await waitFor(() => {
    expect(screen.getByText("썸네일 업로드에 실패했습니다.")).toBeTruthy()
  })

  await user.click(screen.getByRole("button", { name: "저장" }))

  expect(saveCourseEditorDocument).toHaveBeenCalledWith(
    expect.objectContaining({
      course: expect.objectContaining({
        thumbnailPath: "/course-thumbnails/sentence.png",
      }),
    })
  )
})
```

- [ ] **Step 6: Run page test to verify it fails**

Run:

```powershell
bun --filter @workspace/admin test -- admin-course-detail-page.test.tsx
```

Expected: FAIL because upload handling is not implemented.

- [ ] **Step 7: Implement upload flow in page and shell**

In `course-editor-shell.tsx`, add props:

```ts
  isThumbnailUploading?: boolean
  thumbnailUploadError?: string | null
  onSelectThumbnailFile?: (file: File) => void
```

Pass them to `CourseSummaryPanel`.

In `admin-course-detail-page.tsx`, add state:

```ts
const [isThumbnailUploading, setIsThumbnailUploading] = React.useState(false)
const [thumbnailUploadError, setThumbnailUploadError] = React.useState<
  string | null
>(null)
```

Add validation helper at file bottom:

```ts
const allowedThumbnailContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const
const maxThumbnailSize = 5 * 1024 * 1024

function getThumbnailFileError(file: File) {
  if (!allowedThumbnailContentTypes.includes(file.type as never)) {
    return "허용하지 않는 파일 형식입니다."
  }

  if (file.size > maxThumbnailSize) {
    return "파일은 5MB 이하만 업로드할 수 있습니다."
  }

  return null
}
```

Add upload callback:

```ts
const handleSelectThumbnailFile = React.useCallback(
  async (file: File) => {
    const fileError = getThumbnailFileError(file)

    setStatusMessage(null)
    setThumbnailUploadError(null)

    if (fileError) {
      setThumbnailUploadError(fileError)
      return
    }

    setIsThumbnailUploading(true)

    try {
      const upload = await api.createCourseThumbnailUpload({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        contentLength: file.size,
      })

      if (upload.status === "error") {
        setThumbnailUploadError("썸네일 업로드 URL을 만들지 못했습니다.")
        return
      }

      const uploadResponse = await fetch(upload.value.uploadUrl, {
        body: file,
        headers: upload.value.headers,
        method: upload.value.method,
      })

      if (!uploadResponse.ok) {
        setThumbnailUploadError("썸네일 업로드에 실패했습니다.")
        return
      }

      updateWorkingCopy((current) =>
        updateCourseField(current, "thumbnailPath", upload.value.thumbnailPath)
      )
      setStatusMessage("썸네일을 업로드했습니다. 저장하면 반영됩니다.")
    } finally {
      setIsThumbnailUploading(false)
    }
  },
  [api, updateWorkingCopy]
)
```

Pass props into `CourseEditorShell`:

```tsx
isThumbnailUploading = { isThumbnailUploading }
onSelectThumbnailFile = { handleSelectThumbnailFile }
thumbnailUploadError = { thumbnailUploadError }
```

- [ ] **Step 8: Run UI tests to verify they pass**

Run:

```powershell
bun --filter @workspace/admin test -- course-summary-panel.test.tsx admin-course-detail-page.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add -- apps/admin/src/features/courses/course-editor/course-summary-panel.tsx apps/admin/src/features/courses/course-editor/course-summary-panel.test.tsx apps/admin/src/features/courses/course-editor/course-editor-shell.tsx apps/admin/src/features/courses/admin-course-detail-page.tsx apps/admin/src/features/courses/admin-course-detail-page.test.tsx
git commit -m "어드민 코스 썸네일 즉시 업로드 연결"
```

---

### Task 6: Documentation And Environment Examples

**Files:**

- Modify: `apps/admin-api/.env.example`
- Modify: `.env.docker.example`
- Modify: `BACKEND.md`
- Modify: `docs/operations-environment.md`
- Modify: `docs/admin-site.md`

- [ ] **Step 1: Update admin-api env example**

Append to `apps/admin-api/.env.example`:

```env
ADMIN_ASSET_S3_ENDPOINT=http://localhost:9000
ADMIN_ASSET_S3_REGION=us-east-1
ADMIN_ASSET_S3_BUCKET=writing-app-public-assets
ADMIN_ASSET_PUBLIC_BASE_URL=http://localhost:9000/writing-app-public-assets
ADMIN_ASSET_S3_ACCESS_KEY=replace-with-local-rustfs-access-key
ADMIN_ASSET_S3_SECRET_KEY=replace-with-local-rustfs-secret-key
```

- [ ] **Step 2: Update RustFS docker env example**

Replace `.env.docker.example` values with names that match the admin-api example:

```env
# Copy this file to .env.docker and replace the example values before
# running docker compose. Do not commit .env.docker.
# The admin API ADMIN_ASSET_S3_ACCESS_KEY and ADMIN_ASSET_S3_SECRET_KEY values
# must match these RustFS credentials.
RUSTFS_ACCESS_KEY=replace-with-local-rustfs-access-key
RUSTFS_SECRET_KEY=replace-with-local-rustfs-secret-key
```

- [ ] **Step 3: Update BACKEND.md**

In the `apps/admin-api` route list, add:

```md
- `POST /course-thumbnails/uploads`
```

In the admin API environment variable table, add rows:

```md
| `ADMIN_ASSET_S3_ENDPOINT` | 필수 | `http://localhost:9000` | RustFS 또는 S3-compatible API endpoint |
| `ADMIN_ASSET_S3_REGION` | 선택 | `us-east-1` | S3 서명 region |
| `ADMIN_ASSET_S3_BUCKET` | 필수 | `writing-app-public-assets` | 코스 썸네일을 저장할 공개 에셋 버킷 |
| `ADMIN_ASSET_PUBLIC_BASE_URL` | 필수 | `http://localhost:9000/writing-app-public-assets` | DB에 저장할 공개 썸네일 URL의 기준 경로 |
| `ADMIN_ASSET_S3_ACCESS_KEY` | 필수 | `replace-with-local-rustfs-access-key` | signed URL 발급용 S3 access key |
| `ADMIN_ASSET_S3_SECRET_KEY` | 필수 | `replace-with-local-rustfs-secret-key` | signed URL 발급용 S3 secret key |
```

- [ ] **Step 4: Update operations document**

In `docs/operations-environment.md`, add RustFS to the local ports table:

```md
| RustFS S3 API | `9000` | `docker compose up rustfs rustfs_public_assets_init` |
| RustFS Console | `9001` | `docker compose up rustfs` |
```

Add the same six `ADMIN_ASSET_*` values to the admin local setup block and admin API environment table.

- [ ] **Step 5: Update admin-site log**

Append to `docs/admin-site.md`:

```md
## 2026-05-29 어드민 코스 썸네일 업로드 시작

- 코스 상세 페이지의 `썸네일 변경` 버튼을 signed URL 기반 즉시 업로드 흐름으로 연결한다.
- 로컬 개발 환경은 RustFS의 S3-compatible API와 `writing-app-public-assets` 공개 버킷을 사용한다.
- 업로드 성공 후에는 기존 코스 편집 저장 버튼을 통해 DB의 `thumbnailPath`를 반영한다.

## 2026-05-29 어드민 코스 썸네일 업로드 완료

- 어드민 API에 `POST /course-thumbnails/uploads`를 추가해 RustFS PUT signed URL을 발급한다.
- 어드민 웹은 파일 선택 즉시 signed URL로 이미지를 업로드하고, 성공한 공개 URL을 dirty 상태의 `thumbnailPath`로 반영한다.
- 저장하지 않고 이탈한 경우 미참조 객체가 남을 수 있으며, 자동 정리는 이번 범위에 포함하지 않는다.
```

- [ ] **Step 6: Run format check on changed docs**

Run:

```powershell
bun prettier --check apps/admin-api/.env.example .env.docker.example BACKEND.md docs/operations-environment.md docs/admin-site.md
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add -- apps/admin-api/.env.example .env.docker.example BACKEND.md docs/operations-environment.md docs/admin-site.md
git commit -m "어드민 썸네일 업로드 환경 문서 갱신"
```

---

### Task 7: Full Verification

**Files:**

- Inspect: `git status --short`

- [ ] **Step 1: Run focused package tests**

Run:

```powershell
bun --filter @workspace/core test -- admin.dto.test.ts
bun --filter @workspace/admin-api test -- env.test.ts course-thumbnail-upload.test.ts app.test.ts
bun --filter @workspace/admin test -- http-admin-api.test.ts course-summary-panel.test.tsx admin-course-detail-page.test.tsx
```

Expected: all PASS.

- [ ] **Step 2: Run typechecks**

Run:

```powershell
bun --filter @workspace/core typecheck
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin typecheck
```

Expected: all PASS.

- [ ] **Step 3: Run lint**

Run:

```powershell
bun --filter @workspace/core lint
bun --filter @workspace/admin-api lint
bun --filter @workspace/admin lint
```

Expected: all PASS.

- [ ] **Step 4: Run pre-commit validation**

Run:

```powershell
bun lefthook run pre-commit
```

Expected: PASS.

- [ ] **Step 5: Confirm worktree scope**

Run:

```powershell
git status --short
```

Expected: only intended files are changed, with the existing untracked `prototype/` still untouched if it remains present.

---

## Self-Review

- Spec coverage: DTO validation, signed URL route, RustFS/S3 storage helper, immediate browser upload, dirty `thumbnailPath`, existing save API reuse, storage error handling, docs, and verification all have tasks.
- 빈칸 점검: this plan has no open-ended implementation steps. Each code task includes concrete file paths, snippets, commands, and expected results.
- Type consistency: `AdminCreateCourseThumbnailUploadRequestDto`, `AdminCreateCourseThumbnailUploadDto`, `CourseThumbnailUploadService`, and `thumbnailPath` names are consistent across core, API, HTTP client, and UI tasks.
