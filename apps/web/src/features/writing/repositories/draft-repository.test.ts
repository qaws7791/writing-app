import { afterEach, describe, expect, test, vi } from "vitest"

import {
  createLocalDraftRepository,
  createDraftRepository,
} from "./draft-repository"
import { createMemoryStorage } from "@/foundation/lib/storage"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("local draft repository", () => {
  test("creates drafts with initial title and content", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalDraftRepository(storage)

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
    const repository = createLocalDraftRepository(storage)

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

  test("does not fall back to local storage in api mode", async () => {
    globalThis.fetch = vi.fn(() => {
      throw new TypeError("network down")
    }) as unknown as typeof fetch

    const repository = createDraftRepository({
      apiBaseUrl: "http://127.0.0.1:3010",
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.getDraft(1)).rejects.toThrow("network down")
  })

  test("returns undefined for 204 responses from remote api", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 204 })
    ) as unknown as typeof fetch

    const repository = createDraftRepository({
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

    const repository = createDraftRepository({
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
