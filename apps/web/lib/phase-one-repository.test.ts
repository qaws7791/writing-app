import { afterEach, describe, expect, test, vi } from "vitest"

import {
  createLocalPhaseOneRepository,
  createPhaseOneRepository,
} from "./phase-one-repository"
import { createMemoryStorage } from "./phase-one-storage"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("phase one local repository", () => {
  test("creates drafts with initial title and content", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalPhaseOneRepository(storage)

    const created = await repository.createDraft({
      content: {
        content: [
          {
            content: [{ text: "처음부터 본문이 있습니다", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      sourcePromptId: 1,
      title: "초기 초안",
    })

    expect(created.title).toBe("초기 초안")
    expect(created.sourcePromptId).toBe(1)
    expect(created.characterCount).toBeGreaterThan(0)
    expect(created.preview).toContain("처음부터 본문이 있습니다")
  })

  test("creates, autosaves, lists and deletes drafts without remote api", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalPhaseOneRepository(storage)

    const created = await repository.createDraft({ sourcePromptId: 1 })
    const saved = await repository.autosaveDraft(created.id, {
      content: {
        content: [
          {
            content: [{ text: "외부 API 없이도 동작합니다", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      title: "로컬 초안",
    })

    const drafts = await repository.listDrafts()
    expect(saved.draft.title).toBe("로컬 초안")
    expect(drafts[0]?.id).toBe(created.id)

    await repository.deleteDraft(created.id)
    expect(
      (await repository.listDrafts()).some((draft) => draft.id === created.id)
    ).toBe(false)
  })

  test("persists saved prompts in memory storage", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalPhaseOneRepository(storage)

    await repository.savePrompt(6)
    const home = await repository.getHome()

    expect(home.savedPrompts.some((prompt) => prompt.id === 6)).toBe(true)

    await repository.unsavePrompt(6)
    const prompts = await repository.listPrompts({ saved: true })
    expect(prompts).toHaveLength(0)
  })

  test("does not fall back to local storage in api mode", async () => {
    globalThis.fetch = vi.fn(() => {
      throw new TypeError("network down")
    }) as unknown as typeof fetch

    const repository = createPhaseOneRepository({
      apiBaseUrl: "http://127.0.0.1:3010",
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.getHome()).rejects.toThrow("network down")
  })

  test("serializes prompt filters for remote requests", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
        })
    ) as unknown as typeof fetch

    const repository = createPhaseOneRepository({
      apiBaseUrl: "http://127.0.0.1:3010/",
      mode: "api",
      storage: createMemoryStorage(),
    })

    await repository.listPrompts({
      level: 2,
      query: "AI",
      saved: true,
      topic: "기술",
    })

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const request = vi.mocked(globalThis.fetch).mock.calls[0][0] as Request
    const url = new URL(request.url)
    expect(url.pathname).toBe("/prompts")
    expect(url.searchParams.get("query")).toBe("AI")
    expect(url.searchParams.get("topic")).toBe("기술")
    expect(url.searchParams.get("level")).toBe("2")
    expect(url.searchParams.get("saved")).toBe("true")
  })

  test("returns undefined for 204 responses from remote api", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 204 })
    ) as unknown as typeof fetch

    const repository = createPhaseOneRepository({
      apiBaseUrl: "http://127.0.0.1:3010",
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.deleteDraft(1)).resolves.toBeUndefined()
  })

  test("maps remote api errors with status and message", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "초안을 찾을 수 없습니다.",
            },
          }),
          { status: 404 }
        )
    ) as unknown as typeof fetch

    const repository = createPhaseOneRepository({
      apiBaseUrl: "http://127.0.0.1:3010",
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.getDraft(999)).rejects.toMatchObject({
      message: "초안을 찾을 수 없습니다.",
      status: 404,
    })
  })
})
