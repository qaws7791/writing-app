import { afterEach, describe, expect, test } from "vitest"
import { APIError } from "better-auth/api"

import { createTestApi } from "./test-support/create-test-app.js"
import { createCapturedLogger } from "./test-support/capture-logger.js"

const createdApps: Array<ReturnType<typeof createTestApi>> = []

afterEach(() => {
  while (createdApps.length > 0) {
    createdApps.pop()?.close()
  }
})

function setup() {
  const api = createTestApi()
  createdApps.push(api)
  return api
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse
}

describe("health", () => {
  test("reports server status", async () => {
    const { app } = setup()
    const response = await app.request("/health")
    const body = await readJson<{ status: string }>(response)

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
  })

  test("allows the local web origin through cors", async () => {
    const { app } = setup()
    const response = await app.request("/health", {
      headers: {
        origin: "http://127.0.0.1:3000",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://127.0.0.1:3000"
    )
  })

  test("does not expose a disallowed origin", async () => {
    const { app } = setup()
    const response = await app.request("/health", {
      headers: {
        origin: "http://malicious.example",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).not.toBe(
      "http://malicious.example"
    )
  })
})

describe("home", () => {
  test("returns daily prompt and active journeys", async () => {
    const { app } = setup()
    const response = await app.request("/home")
    const body = await readJson<{
      dailyPrompt: { id: number } | null
      activeJourneys: Array<{ journeyId: number }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.activeJourneys).toEqual([])
    expect(body.dailyPrompt).not.toBeNull()
  })
})

describe("prompts", () => {
  test("lists prompts without filters", async () => {
    const { app } = setup()
    const response = await app.request("/prompts")
    const body = await readJson<{
      items: Array<{ id: number; promptType: string }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.items.length).toBeGreaterThan(0)
  })

  test("bookmarks a prompt idempotently", async () => {
    const { app } = setup()

    const firstBookmark = await app.request("/prompts/1/bookmark", {
      method: "PUT",
    })
    const secondBookmark = await app.request("/prompts/1/bookmark", {
      method: "PUT",
    })

    expect(firstBookmark.status).toBe(200)
    expect(secondBookmark.status).toBe(200)

    const body = await readJson<{ kind: string; savedAt: string }>(
      firstBookmark
    )
    expect(body.kind).toBe("bookmarked")
  })

  test("unbookmarks a prompt", async () => {
    const { app } = setup()

    await app.request("/prompts/1/bookmark", { method: "PUT" })
    const unbookmark = await app.request("/prompts/1/bookmark", {
      method: "DELETE",
    })

    expect(unbookmark.status).toBe(204)
  })

  test("returns prompt summary", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/1")
    const body = await readJson<{
      id: number
      promptType: string
      title: string
    }>(response)

    expect(response.status).toBe(200)
    expect(body.id).toBe(1)
    expect(body.promptType).toBeDefined()
  })

  test("returns not found for missing prompt", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/999")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })

  test("rejects invalid prompt ids", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/invalid")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("returns not found when bookmarking an unknown prompt", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/999/bookmark", {
      method: "PUT",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })
})

describe("writings", () => {
  test("creates writing and lists it", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({ sourcePromptId: 1 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{
      id: number
      sourcePromptId: number | null
    }>(create)
    const list = await app.request("/writings")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(list)

    expect(create.status).toBe(201)
    expect(created.sourcePromptId).toBe(1)
    expect(listBody.items[0]?.id).toBe(created.id)
  })

  test("creates writing with initial title and body", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({
        title: "첫 문장부터 저장",
        bodyPlainText: "첫 저장에서 바로 생성합니다",
        wordCount: 3,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{
      preview: string
      title: string
      wordCount: number
    }>(create)

    expect(create.status).toBe(201)
    expect(created.title).toBe("첫 문장부터 저장")
    expect(created.preview).toContain("첫 저장에서 바로 생성합니다")
    expect(created.wordCount).toBe(3)
  })

  test("autosaves writing body and title", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const patch = await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({
        title: "자동저장 테스트",
        bodyPlainText: "첫 문장 입니다 둘째 문장도 적습니다",
        wordCount: 6,
      }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const patchBody = await readJson<{
      writing: {
        preview: string
        title: string
        wordCount: number
      }
      kind: string
    }>(patch)

    expect(patch.status).toBe(200)
    expect(patchBody.kind).toBe("autosaved")
    expect(patchBody.writing.title).toBe("자동저장 테스트")
    expect(patchBody.writing.preview).toContain("첫 문장")
    expect(patchBody.writing.wordCount).toBe(6)
  })

  test("reloads the same bodyJson after autosave", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const bodyJson = { type: "doc", content: [{ type: "paragraph" }] }

    await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({ bodyJson }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const detail = await app.request(`/writings/${created.id}`)
    const body = await readJson<{ bodyJson: unknown }>(detail)

    expect(detail.status).toBe(200)
    expect(body.bodyJson).toEqual(bodyJson)
  })

  test("deletes writing", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const deleted = await app.request(`/writings/${created.id}`, {
      method: "DELETE",
    })
    const list = await app.request("/writings")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(list)

    expect(deleted.status).toBe(204)
    expect(listBody.items).toHaveLength(0)
  })

  test("rejects extra fields in autosave payloads", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({ unknownField: true }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("rejects empty autosave payloads", async () => {
    const { app } = setup()
    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("rejects invalid raw json bodies", async () => {
    const { app } = setup()
    const response = await app.request("/writings", {
      body: "{invalid",
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("invalid_json")
  })

  test("rejects title exceeding max length", async () => {
    const { app } = setup()

    const response = await app.request("/writings", {
      body: JSON.stringify({
        title: "x".repeat(201),
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("returns forbidden for writings owned by another user", async () => {
    const { app, injectForeignWriting } = setup()
    const created = injectForeignWriting({ title: "숨겨진 글" })

    const response = await app.request(`/writings/${created.id}`)
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
  })

  test("returns not found for missing writings", async () => {
    const { app } = setup()
    const response = await app.request("/writings/999")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })

  test("rejects invalid writing ids", async () => {
    const { app } = setup()
    const response = await app.request("/writings/invalid")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })
})

describe("fallbacks", () => {
  test("returns not found for unsupported routes", async () => {
    const { app } = setup()
    const response = await app.request("/unknown")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })
})

describe("logging", () => {
  test("logs request lifecycle and reuses request ids", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/health", {
      headers: { "x-request-id": "req-123" },
    })

    const started = entries.find((entry) => entry.msg === "request started")
    const completed = entries.find((entry) => entry.msg === "request completed")

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe("req-123")
    expect(started).toEqual(
      expect.objectContaining({
        level: 30,
        method: "GET",
        path: "/health",
        requestId: "req-123",
        scope: "http",
      })
    )
    expect(completed).toEqual(
      expect.objectContaining({
        level: 30,
        requestId: "req-123",
        status: 200,
      })
    )
    expect(completed?.durationMs).toEqual(expect.any(Number))
  })

  test("logs 4xx validation errors at warn level", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/writings/invalid")
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(400)
    expect(failed).toEqual(
      expect.objectContaining({
        code: "validation_error",
        level: 40,
        status: 400,
      })
    )
  })

  test("maps better-auth api errors through the global error handler", async () => {
    const api = createTestApi({
      homeError: new APIError("CONFLICT", {
        message: "이미 가입된 이메일입니다.",
      }),
    })
    createdApps.push(api)

    const response = await api.app.request("/home")
    const body = await readJson<{ error: { code: string; message: string } }>(
      response
    )

    expect(response.status).toBe(409)
    expect(body.error).toEqual({
      code: "conflict",
      message: "이미 가입된 이메일입니다.",
    })
  })

  test("logs 5xx errors at error level", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({
      homeError: new Error("boom"),
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/home")
    const body = await readJson<{
      error: { code: string; requestId?: string }
    }>(response)
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(500)
    expect(body.error.code).toBe("internal_error")
    expect(body.error.requestId).toEqual(expect.any(String))
    expect(failed).toEqual(
      expect.objectContaining({
        code: "internal_error",
        level: 50,
        status: 500,
      })
    )
    expect(failed?.err).toEqual(
      expect.objectContaining({
        message: "boom",
        type: "Error",
      })
    )
  })

  test("includes userId in 5xx error logs", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({
      homeError: new Error("crash"),
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/home", {
      headers: { "x-test-user-id": "user-42" },
    })
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(500)
    expect(failed).toEqual(
      expect.objectContaining({
        code: "internal_error",
        level: 50,
        status: 500,
        userId: "user-42",
      })
    )
  })

  test("does not include requestId in 4xx error responses", async () => {
    const { app } = setup()
    const response = await app.request("/writings/invalid")
    const body = await readJson<{
      error: { code: string; requestId?: string }
    }>(response)

    expect(response.status).toBe(400)
    expect(body.error.requestId).toBeUndefined()
  })

  test("serves the openapi document with new route paths", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/openapi.json")
    const body = await readJson<{
      openapi: string
      paths?: Record<string, unknown>
    }>(response)
    const failed = entries.find(
      (entry) => entry.msg === "openapi document generation failed"
    )

    expect(response.status).toBe(200)
    expect(body.openapi).toBe("3.0.0")
    expect(body.paths).toHaveProperty("/writings")
    expect(body.paths).toHaveProperty("/journeys")
    expect(body.paths).toHaveProperty("/home")
    expect(failed).toBeUndefined()
  })
})

describe("ai", () => {
  test("generates text feedback", async () => {
    const { app } = setup()
    const response = await app.request("/ai/feedback", {
      body: JSON.stringify({
        text: "오늘 하루는 참 바빴다. 하지만 뜻 깊은 하루였다.",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{
      strengths: string[]
      improvements: string[]
      question: string
    }>(response)

    expect(response.status).toBe(200)
    expect(Array.isArray(body.strengths)).toBe(true)
    expect(Array.isArray(body.improvements)).toBe(true)
    expect(typeof body.question).toBe("string")
  })

  test("rejects feedback request without text", async () => {
    const { app } = setup()
    const response = await app.request("/ai/feedback", {
      body: JSON.stringify({ level: "beginner" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("rejects unauthenticated feedback request", async () => {
    const { app } = setup()
    const response = await app.request("/ai/feedback", {
      body: JSON.stringify({ text: "테스트 글" }),
      headers: {
        "content-type": "application/json",
        "x-test-auth": "none",
      },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("unauthorized")
  })

  test("compares two texts", async () => {
    const { app } = setup()
    const response = await app.request("/ai/compare", {
      body: JSON.stringify({
        originalText: "오늘 날씨가 맑다.",
        revisedText: "오늘 하늘이 맑고 바람도 선선하게 불었다.",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{
      improvements: string[]
      summary: string
    }>(response)

    expect(response.status).toBe(200)
    expect(Array.isArray(body.improvements)).toBe(true)
    expect(typeof body.summary).toBe("string")
  })

  test("rejects compare request with missing fields", async () => {
    const { app } = setup()
    const response = await app.request("/ai/compare", {
      body: JSON.stringify({ originalText: "원문" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("rejects unauthenticated compare request", async () => {
    const { app } = setup()
    const response = await app.request("/ai/compare", {
      body: JSON.stringify({
        originalText: "원문입니다.",
        revisedText: "수정된 내용입니다.",
      }),
      headers: {
        "content-type": "application/json",
        "x-test-auth": "none",
      },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("unauthorized")
  })

  test("generates feedback for a specific writing", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({
        bodyPlainText: "나는 오늘 책을 읽었다. 매우 유익했다.",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/writings/${created.id}/feedback`, {
      body: JSON.stringify({ level: "beginner" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{
      strengths: string[]
      improvements: string[]
      question: string
    }>(response)

    expect(response.status).toBe(200)
    expect(Array.isArray(body.strengths)).toBe(true)
    expect(typeof body.question).toBe("string")
  })

  test("returns not found when generating feedback for missing writing", async () => {
    const { app } = setup()

    const response = await app.request("/writings/999/feedback", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })

  test("compares revisions for a specific writing", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({ bodyPlainText: "처음 작성한 글입니다." }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/writings/${created.id}/compare`, {
      body: JSON.stringify({
        originalText: "처음 작성한 글입니다.",
        revisedText: "많이 다듬어진 글입니다. 문장이 더 명확해졌습니다.",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{
      improvements: string[]
      summary: string
    }>(response)

    expect(response.status).toBe(200)
    expect(Array.isArray(body.improvements)).toBe(true)
    expect(typeof body.summary).toBe("string")
  })

  test("returns forbidden for writing compare owned by another user", async () => {
    const { app, injectForeignWriting } = setup()
    const foreign = injectForeignWriting({ title: "다른 사람 글" })

    const response = await app.request(`/writings/${foreign.id}/compare`, {
      body: JSON.stringify({
        originalText: "원문",
        revisedText: "수정본",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
  })
})
