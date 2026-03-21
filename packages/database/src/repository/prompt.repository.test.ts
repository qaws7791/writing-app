import { afterEach, describe, expect, test } from "bun:test"
import { count } from "drizzle-orm"
import { toPromptId, toUserId } from "@workspace/core"

import { seedDatabase } from "../connection/index.js"
import { prompts } from "../schema/index.js"
import { createTestDb } from "../testing/index.js"

import { createPromptRepository } from "./index.js"

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

describe("prompt repository", () => {
  test("seed is idempotent and preserves prompt rows", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)

    seedDatabase(db)

    const row = db
      .select({
        count: count(prompts.id),
      })
      .from(prompts)
      .get()

    expect(row?.count).toBe(10)
  })

  test("lists today prompts, filters prompts, and persists saved prompts", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)

    const repository = createPromptRepository(
      db,
      () => "2026-03-21T00:00:00.000Z"
    )

    const today = await repository.listTodayPrompts(toUserId("dev-user"), 4)
    const filtered = await repository.list(toUserId("dev-user"), {
      level: 3,
      query: "AI",
      topic: "기술",
    })

    expect(today.map((prompt) => Number(prompt.id))).toEqual([1, 3, 6, 7])
    expect(filtered).toHaveLength(1)
    expect(Number(filtered[0]?.id)).toBe(6)

    await repository.save(toUserId("dev-user"), toPromptId(6))
    await repository.save(toUserId("dev-user"), toPromptId(1))

    const saved = await repository.listSaved(toUserId("dev-user"), 10)
    const savedFiltered = await repository.list(toUserId("dev-user"), {
      saved: true,
    })

    expect(saved.map((prompt) => Number(prompt.id))).toEqual([1, 6])
    expect(savedFiltered.map((prompt) => Number(prompt.id))).toEqual([1, 6])

    expect(await repository.unsave(toUserId("dev-user"), toPromptId(1))).toBe(
      true
    )
    expect(
      (await repository.list(toUserId("dev-user"), { saved: true })).map(
        (prompt) => Number(prompt.id)
      )
    ).toEqual([6])
  })

  test("returns not-found when saving a missing prompt", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)

    const repository = createPromptRepository(db)

    expect(await repository.exists(toPromptId(999))).toBe(false)
    expect(
      await repository.save(toUserId("dev-user"), toPromptId(999))
    ).toEqual({
      kind: "not-found",
    })
  })
})
