import { toPromptId, toUserId, type PromptRepository } from "@workspace/domain"

import { NotFoundError } from "./errors.js"
import { createPromptUseCases } from "./prompt-use-cases.js"

function createPromptRepository(): PromptRepository {
  return {
    exists: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    listSaved: vi.fn(),
    listTodayPrompts: vi.fn(),
    save: vi.fn(),
    unsave: vi.fn(),
  }
}

describe("createPromptUseCases", () => {
  test("passes list filters through unchanged", async () => {
    const repository = createPromptRepository()
    vi.mocked(repository.list).mockResolvedValue([])
    const useCases = createPromptUseCases(repository)

    await useCases.listPrompts(toUserId("dev-user"), {
      query: "AI",
      saved: true,
      topic: "기술",
    })

    expect(repository.list).toHaveBeenCalledWith("dev-user", {
      query: "AI",
      saved: true,
      topic: "기술",
    })
  })

  test("throws not found when prompt detail is missing", async () => {
    const repository = createPromptRepository()
    vi.mocked(repository.getById).mockResolvedValue(null)
    const useCases = createPromptUseCases(repository)

    await expect(
      useCases.getPrompt(toUserId("dev-user"), toPromptId(99))
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test("keeps save idempotent while surfacing saved payload", async () => {
    const repository = createPromptRepository()
    vi.mocked(repository.save).mockResolvedValue({
      kind: "saved",
      savedAt: "2026-03-20T10:00:00.000Z",
    })
    const useCases = createPromptUseCases(repository)

    await expect(
      useCases.savePrompt(toUserId("dev-user"), toPromptId(1))
    ).resolves.toEqual({
      kind: "saved",
      savedAt: "2026-03-20T10:00:00.000Z",
    })
  })

  test("throws not found when save target is missing", async () => {
    const repository = createPromptRepository()
    vi.mocked(repository.save).mockResolvedValue({
      kind: "not-found",
    })
    const useCases = createPromptUseCases(repository)

    await expect(
      useCases.savePrompt(toUserId("dev-user"), toPromptId(404))
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test("throws not found when unsaving a missing saved prompt", async () => {
    const repository = createPromptRepository()
    vi.mocked(repository.unsave).mockResolvedValue(false)
    const useCases = createPromptUseCases(repository)

    await expect(
      useCases.unsavePrompt(toUserId("dev-user"), toPromptId(404))
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
