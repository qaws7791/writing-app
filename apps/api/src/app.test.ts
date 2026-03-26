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
  test("reports sqlite version", async () => {
    const { app } = setup()
    const response = await app.request("/health")
    const body = await readJson<{
      sqliteVersion: string
      status: string
    }>(response)

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.sqliteVersion.length).toBeGreaterThan(0)
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

describe("prompts", () => {
  test("lists today prompts without version prefix", async () => {
    const { app } = setup()
    const response = await app.request("/home")
    const body = await readJson<{
      todayPrompts: Array<{ id: number }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.todayPrompts.length).toBe(2)
  })

  test("filters prompts by query and topic", async () => {
    const { app } = setup()
    const response = await app.request("/prompts?query=AI&topic=기술")
    const body = await readJson<{
      items: Array<{ id: number; text: string; topic: string }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]?.topic).toBe("기술")
    expect(body.items[0]?.text).toContain("AI")
  })

  test("saves a prompt idempotently and exposes saved filters", async () => {
    const { app } = setup()

    const firstSave = await app.request("/prompts/1/save", { method: "PUT" })
    const secondSave = await app.request("/prompts/1/save", { method: "PUT" })
    const savedList = await app.request("/prompts?saved=true")
    const body = await readJson<{
      items: Array<{ id: number; saved: boolean }>
    }>(savedList)

    expect(firstSave.status).toBe(200)
    expect(secondSave.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        id: 1,
        saved: true,
      })
    )
  })

  test("returns prompt detail and supports unsave", async () => {
    const { app } = setup()

    await app.request("/prompts/6/save", { method: "PUT" })
    const detail = await app.request("/prompts/6")
    const detailBody = await readJson<{ id: number; saved: boolean }>(detail)
    const unsave = await app.request("/prompts/6/save", { method: "DELETE" })
    const savedList = await app.request("/prompts?saved=true")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(savedList)

    expect(detail.status).toBe(200)
    expect(detailBody).toEqual(expect.objectContaining({ id: 6, saved: true }))
    expect(unsave.status).toBe(204)
    expect(listBody.items).toHaveLength(0)
  })

  test("rejects invalid prompt query filters", async () => {
    const { app } = setup()
    const response = await app.request("/prompts?saved=maybe")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("validation_error")
  })

  test("returns not found for missing prompt details", async () => {
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

  test("returns not found when saving an unknown prompt", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/999/save", {
      method: "PUT",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })

  test("returns not found when unsaving a prompt that was not saved", async () => {
    const { app } = setup()
    const response = await app.request("/prompts/6/save", {
      method: "DELETE",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })
})

describe("writings", () => {
  test("creates writing from prompt and lists it", async () => {
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

  test("creates writing with initial title and content", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({
        content: {
          content: [
            {
              content: [{ text: "첫 저장에서 바로 생성합니다", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
        },
        title: "첫 문장부터 저장",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{
      characterCount: number
      preview: string
      title: string
      wordCount: number
    }>(create)

    expect(create.status).toBe(201)
    expect(created.title).toBe("첫 문장부터 저장")
    expect(created.preview).toContain("첫 저장에서 바로 생성합니다")
    expect(created.characterCount).toBeGreaterThan(0)
    expect(created.wordCount).toBeGreaterThan(0)
  })

  test("autosaves tiptap json and returns derived metrics", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const patch = await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({
        content: {
          content: [
            {
              content: [{ text: "첫 문장 입니다", type: "text" }],
              type: "paragraph",
            },
            {
              content: [{ text: "둘째 문장도 적습니다", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "doc",
        },
        title: "자동저장 테스트",
      }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const patchBody = await readJson<{
      writing: {
        characterCount: number
        content: { type: string }
        preview: string
        title: string
        wordCount: number
      }
      kind: string
    }>(patch)

    expect(patch.status).toBe(200)
    expect(patchBody.kind).toBe("autosaved")
    expect(patchBody.writing.title).toBe("자동저장 테스트")
    expect(patchBody.writing.content.type).toBe("doc")
    expect(patchBody.writing.preview).toContain("첫 문장")
    expect(patchBody.writing.characterCount).toBeGreaterThan(0)
    expect(patchBody.writing.wordCount).toBeGreaterThan(0)
  })

  test("reloads the same json structure after autosave", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const content = {
      content: [
        {
          attrs: { align: "left" },
          content: [{ text: "JSONB 복원", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    }

    await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({ content }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const detail = await app.request(`/writings/${created.id}`)
    const body = await readJson<{ content: typeof content }>(detail)

    expect(detail.status).toBe(200)
    expect(body.content).toEqual(content)
  })

  test("deletes writings and keeps home resume ordering stable", async () => {
    const { app } = setup()

    const firstCreate = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const secondCreate = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    const first = await readJson<{ id: number }>(firstCreate)
    const second = await readJson<{ id: number }>(secondCreate)

    await app.request(`/writings/${first.id}`, {
      body: JSON.stringify({ title: "첫 글" }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })
    await app.request(`/writings/${second.id}`, {
      body: JSON.stringify({ title: "둘째 글" }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const home = await app.request("/home")
    const homeBody = await readJson<{
      recentWritings: Array<{ id: number }>
      resumeWriting: { id: number } | null
    }>(home)
    const deleted = await app.request(`/writings/${second.id}`, {
      method: "DELETE",
    })
    const list = await app.request("/writings")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(list)

    expect(homeBody.resumeWriting?.id).toBe(second.id)
    expect(homeBody.recentWritings[0]?.id).toBe(second.id)
    expect(deleted.status).toBe(204)
    expect(listBody.items.map((item) => item.id)).toEqual([first.id])
  })

  test("rejects malformed writing payloads", async () => {
    const { app } = setup()

    const create = await app.request("/writings", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/writings/${created.id}`, {
      body: JSON.stringify({
        content: {
          content: [],
          invalid: true,
          type: "doc",
        },
      }),
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

  test("rejects malformed create writing payloads", async () => {
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
    const created = injectForeignWriting({
      title: "숨겨진 글",
    })

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
    const api = createTestApi({
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/health", {
      headers: {
        "x-request-id": "req-123",
      },
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

  test("logs 4xx errors at warn level", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/prompts?saved=maybe")
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
    const body = await readJson<{ error: { code: string } }>(response)
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(500)
    expect(body.error.code).toBe("internal_error")
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

  test("serves the openapi document for recursive writing schemas", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/openapi.json")
    const body = await readJson<{
      components?: {
        schemas?: Record<string, unknown>
      }
      openapi: string
      paths?: Record<string, unknown>
    }>(response)
    const failed = entries.find(
      (entry) => entry.msg === "openapi document generation failed"
    )

    expect(response.status).toBe(200)
    expect(body.openapi).toBe("3.0.0")
    expect(body.paths).toHaveProperty("/writings")
    expect(body.paths).toHaveProperty("/writings/{writingId}")
    expect(body.components?.schemas).toHaveProperty("WritingContent")
    expect(body.components?.schemas).toHaveProperty("TiptapNode")
    expect(failed).toBeUndefined()
  })
})
