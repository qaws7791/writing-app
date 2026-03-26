import { afterEach, describe, expect, test, vi } from "vitest"

import {
  createLocalPromptRepository,
  createPromptRepository,
} from "./prompt-repository"
import { createMemoryStorage } from "@/foundation/lib/storage"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("local prompt repository", () => {
  test("persists saved prompts in memory storage", async () => {
    const storage = createMemoryStorage()
    const repository = createLocalPromptRepository(storage)

    await repository.savePrompt(6)
    await repository.unsavePrompt(6)
    const prompts = await repository.listPrompts({ saved: true })
    expect(prompts).toHaveLength(0)
  })

  test("serializes prompt filters for remote requests", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
        })
    ) as unknown as typeof fetch

    const repository = createPromptRepository({
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
    const request = vi.mocked(globalThis.fetch).mock.calls[0]![0] as Request
    const url = new URL(request.url)
    expect(url.pathname).toBe("/prompts")
    expect(url.searchParams.get("query")).toBe("AI")
    expect(url.searchParams.get("topic")).toBe("기술")
    expect(url.searchParams.get("level")).toBe("2")
    expect(url.searchParams.get("saved")).toBe("true")
  })
})
