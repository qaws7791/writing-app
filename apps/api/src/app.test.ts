import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"

import { createTestApi } from "./test-support/create-test-app.js"

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
  test("reports sqlite jsonb support", async () => {
    const { app } = setup()
    const response = await app.request("/health")
    const body = await readJson<{
      jsonbSupported: boolean
      sqliteVersion: string
      status: string
    }>(response)

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.jsonbSupported).toBe(true)
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
})

describe("prompts", () => {
  test("lists today prompts without version prefix", async () => {
    const { app } = setup()
    const response = await app.request("/home")
    const body = await readJson<{
      todayPrompts: Array<{ id: number }>
    }>(response)

    expect(response.status).toBe(200)
    expect(body.todayPrompts.length).toBe(4)
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
})

describe("drafts", () => {
  test("creates draft from prompt and lists it", async () => {
    const { app } = setup()

    const create = await app.request("/drafts", {
      body: JSON.stringify({ sourcePromptId: 1 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{
      id: number
      sourcePromptId: number | null
    }>(create)
    const list = await app.request("/drafts")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(list)

    expect(create.status).toBe(201)
    expect(created.sourcePromptId).toBe(1)
    expect(listBody.items[0]?.id).toBe(created.id)
  })

  test("creates draft with initial title and content", async () => {
    const { app } = setup()

    const create = await app.request("/drafts", {
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

    const create = await app.request("/drafts", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const patch = await app.request(`/drafts/${created.id}`, {
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
      draft: {
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
    expect(patchBody.draft.title).toBe("자동저장 테스트")
    expect(patchBody.draft.content.type).toBe("doc")
    expect(patchBody.draft.preview).toContain("첫 문장")
    expect(patchBody.draft.characterCount).toBeGreaterThan(0)
    expect(patchBody.draft.wordCount).toBeGreaterThan(0)
  })

  test("reloads the same json structure after autosave", async () => {
    const { app } = setup()

    const create = await app.request("/drafts", {
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

    await app.request(`/drafts/${created.id}`, {
      body: JSON.stringify({ content }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const detail = await app.request(`/drafts/${created.id}`)
    const body = await readJson<{ content: typeof content }>(detail)

    expect(detail.status).toBe(200)
    expect(body.content).toEqual(content)
  })

  test("deletes drafts and keeps home resume ordering stable", async () => {
    const { app } = setup()

    const firstCreate = await app.request("/drafts", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const secondCreate = await app.request("/drafts", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })

    const first = await readJson<{ id: number }>(firstCreate)
    const second = await readJson<{ id: number }>(secondCreate)

    await app.request(`/drafts/${first.id}`, {
      body: JSON.stringify({ title: "첫 초안" }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })
    await app.request(`/drafts/${second.id}`, {
      body: JSON.stringify({ title: "둘째 초안" }),
      headers: { "content-type": "application/json" },
      method: "PATCH",
    })

    const home = await app.request("/home")
    const homeBody = await readJson<{
      recentDrafts: Array<{ id: number }>
      resumeDraft: { id: number } | null
    }>(home)
    const deleted = await app.request(`/drafts/${second.id}`, {
      method: "DELETE",
    })
    const list = await app.request("/drafts")
    const listBody = await readJson<{ items: Array<{ id: number }> }>(list)

    expect(homeBody.resumeDraft?.id).toBe(second.id)
    expect(homeBody.recentDrafts[0]?.id).toBe(second.id)
    expect(deleted.status).toBe(204)
    expect(listBody.items.map((item) => item.id)).toEqual([first.id])
  })

  test("rejects malformed draft payloads", async () => {
    const { app } = setup()

    const create = await app.request("/drafts", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const created = await readJson<{ id: number }>(create)

    const response = await app.request(`/drafts/${created.id}`, {
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

  test("rejects invalid raw json bodies", async () => {
    const { app } = setup()
    const response = await app.request("/drafts", {
      body: "{invalid",
      headers: { "content-type": "application/json" },
      method: "POST",
    })
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(400)
    expect(body.error.code).toBe("invalid_json")
  })

  test("rejects malformed create draft payloads", async () => {
    const { app } = setup()

    const response = await app.request("/drafts", {
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

  test("returns forbidden for drafts owned by another user", async () => {
    const { app, databasePath } = setup()
    const database = new Database(databasePath)

    const now = new Date().toISOString()
    const result = database
      .query(
        `
          insert into users (id, nickname, created_at)
          values (?, ?, ?)
          on conflict(id) do nothing
        `
      )
      .run("other-user", "다른 사용자", now)

    expect(result.changes).toBeGreaterThanOrEqual(0)

    const created = database
      .query(
        `
          insert into drafts (
            user_id,
            title,
            body_jsonb,
            body_plain_text,
            character_count,
            word_count,
            source_prompt_id,
            last_saved_at,
            created_at,
            updated_at
          )
          values (?, ?, jsonb(?), ?, ?, ?, ?, ?, ?, ?)
          returning id
        `
      )
      .get(
        "other-user",
        "숨겨진 초안",
        JSON.stringify({
          content: [{ type: "paragraph" }],
          type: "doc",
        }),
        "숨겨진 초안",
        5,
        1,
        null,
        now,
        now,
        now
      ) as { id: number }

    database.close(false)

    const response = await app.request(`/drafts/${created.id}`)
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
  })
})
