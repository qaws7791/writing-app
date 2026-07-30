import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { createWritingAppDatabase } from "@workspace/db/client"
import { err } from "@workspace/kernel/result"

import { createApp } from "@/composition/create-app"
import {
  createContainer,
  type ApiContainer,
} from "@/composition/create-container"
import { parseApiEnv } from "@/config/env"

const unavailableAiFeedbackProvider: AiFeedbackProvider = {
  model: "test-unconfigured",
  provider: "test",
  async createFeedback() {
    return err({ kind: "provider-unavailable" })
  },
}

const openedContainers: ApiContainer[] = []
const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const container of openedContainers.splice(0)) {
    await container.dispose()
  }
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { recursive: true })
  }
})

describe("API container", () => {
  it("한 DB와 공통 runtime adapter로 learner·admin health와 OpenAPI 문서를 조립한다", async () => {
    const container = await openContainer()
    const app = createApp(container)

    const learnerHealth = await request(app.unified, "/api/health")
    const adminHealth = await request(app.unified, "/api/admin/health")
    const learnerOpenApi = await request(app.unified, "/api/openapi")
    const adminOpenApi = await request(app.unified, "/api/admin/openapi")

    expect(learnerHealth.status).toBe(200)
    expect(adminHealth.status).toBe(200)
    expect(learnerHealth.headers.get("x-request-id")).toBe("test-id-1")
    expect(adminHealth.headers.get("x-request-id")).toBe("test-id-2")
    expect((await learnerOpenApi.json()) as object).toHaveProperty([
      "paths",
      "/learning/lessons/{lessonId}/steps/{stepId}/complete",
      "post",
    ])
    expect((await adminOpenApi.json()) as object).toHaveProperty([
      "paths",
      "/api/admin/courses",
      "get",
    ])
  })

  it("dispose는 DB 준비 상태를 해제하고 반복 호출에도 안전하다", async () => {
    const container = await openContainer()
    expect(container.health.isDatabaseReady()).toBe(true)

    await container.dispose()

    expect(container.health.isDatabaseReady()).toBe(false)
    await expect(container.dispose()).resolves.toBeUndefined()
  })
})

async function openContainer(): Promise<ApiContainer> {
  const directory = await mkdtemp(join(tmpdir(), "writing-app-api-container-"))
  temporaryDirectories.push(directory)
  const databasePath = join(directory, "api.sqlite")
  const migrationDatabase = createWritingAppDatabase(databasePath)
  migrationDatabase.close()
  let sequence = 0
  const container = await createContainer(
    parseApiEnv(createTestEnvironment(databasePath)),
    {
      aiFeedbackProvider: unavailableAiFeedbackProvider,
      clock: { now: () => new Date("2026-07-23T00:00:00.000Z") },
      idGenerator: { next: () => `test-id-${++sequence}` },
    }
  )
  openedContainers.push(container)
  return container
}

function createTestEnvironment(
  databasePath: string
): Record<string, string | undefined> {
  return {
    ADMIN_AUTH_SECRET: "admin-test-secret-0123456789abcdef",
    ADMIN_ORIGIN: "http://localhost:3001",
    API_PORT: "4000",
    DATABASE_URL: databasePath,
    LEARNER_AUTH_SECRET: "learner-test-secret-0123456789abcdef",
    LOG_LEVEL: "silent",
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:3000",
  }
}

function request(
  app: { fetch: (request: Request) => Promise<Response> | Response },
  path: string
): Promise<Response> | Response {
  return app.fetch(
    new Request(`http://localhost:4000${path}`, {
      headers: { Host: "localhost:4000" },
    })
  )
}
