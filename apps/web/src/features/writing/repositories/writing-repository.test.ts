import { afterEach, describe, expect, test, vi } from "vitest"

import {
  createLocalWritingRepository,
  createWritingRepository,
} from "./writing-repository"
import { createApiClient } from "@/foundation/api/client"
import { createMemoryStorage } from "@/foundation/lib/storage"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("local writing repository", () => {
  test("creates writings with initial title and content", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalWritingRepository(storage)

    const created = await repository.createWriting({
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
      title: "초기 글",
    })

    expect(created.title).toBe("초기 글")
    expect(created.sourcePromptId).toBe(1)
    expect(created.characterCount).toBeGreaterThan(0)
    expect(created.preview).toContain("처음부터 본문이 있습니다")
  })

  test("creates, autosaves, lists and deletes writings without remote api", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalWritingRepository(storage)

    const created = await repository.createWriting({ sourcePromptId: 1 })
    const saved = await repository.autosaveWriting(created.id, {
      content: {
        content: [
          {
            content: [{ text: "외부 API 없이도 동작합니다", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      title: "로컬 글",
    })

    const writings = await repository.listWritings()
    expect(saved.writing.title).toBe("로컬 글")
    expect(writings[0]?.id).toBe(created.id)

    await repository.deleteWriting(created.id)
    expect(
      (await repository.listWritings()).some(
        (writing) => writing.id === created.id
      )
    ).toBe(false)
  })

  test("does not fall back to local storage in api mode", async () => {
    globalThis.fetch = vi.fn(() => {
      throw new TypeError("network down")
    }) as unknown as typeof fetch

    const repository = createWritingRepository({
      client: createApiClient({ baseUrl: "http://127.0.0.1:3010" }),
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.getWriting(1)).rejects.toThrow("network down")
  })

  test("returns undefined for 204 responses from remote api", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 204 })
    ) as unknown as typeof fetch

    const repository = createWritingRepository({
      client: createApiClient({ baseUrl: "http://127.0.0.1:3010" }),
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.deleteWriting(1)).resolves.toBeUndefined()
  })

  test("maps remote api errors with status and message", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "글을 찾을 수 없습니다.",
            },
          }),
          { status: 404 }
        )
    ) as unknown as typeof fetch

    const repository = createWritingRepository({
      client: createApiClient({ baseUrl: "http://127.0.0.1:3010" }),
      mode: "api",
      storage: createMemoryStorage(),
    })

    await expect(repository.getWriting(999)).rejects.toMatchObject({
      message: "글을 찾을 수 없습니다.",
      status: 404,
    })
  })
})
