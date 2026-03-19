import { describe, expect, test } from "bun:test"

import { createLocalPhaseOneRepository } from "./phase-one-repository"
import { createMemoryStorage } from "./phase-one-storage"

describe("phase one local repository", () => {
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
})
