import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { afterEach, describe, expect, test } from "bun:test"
import { count } from "drizzle-orm"
import {
  createEmptyDraftContent,
  extractDraftTextMetrics,
  toDraftId,
  toPromptId,
  toUserId,
} from "@workspace/core"

import { prompts, user } from "../schema/index.js"
import {
  createDraftRepository,
  createPromptRepository,
  migrateDatabase,
  openDb,
  seedDatabase,
} from "./index.js"

type TestDatabase = {
  close: () => void
  path: string
} & ReturnType<typeof openDb>

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

async function createTestDatabase(): Promise<TestDatabase> {
  const root = mkdtempSync(join(tmpdir(), "writing-db-"))
  const path = join(root, "test.sqlite")
  const database = openDb(path)
  const close = () => {
    database.close()
  }

  cleanupTasks.push(close)
  await migrateDatabase(database.db)
  seedDatabase(database.db)

  const now = new Date("2026-03-21T00:00:00.000Z")
  database.db
    .insert(user)
    .values({
      createdAt: now,
      email: "dev-user@example.com",
      emailVerified: true,
      id: "dev-user",
      image: null,
      name: "테스트 사용자",
      updatedAt: now,
    })
    .run()

  return {
    ...database,
    close,
    path,
  }
}

describe("database migration", () => {
  test("creates app and auth tables idempotently", async () => {
    const root = mkdtempSync(join(tmpdir(), "writing-db-"))
    const database = openDb(join(root, "idempotent.sqlite"))
    cleanupTasks.push(() => {
      database.close()
    })

    await migrateDatabase(database.db)
    await migrateDatabase(database.db)

    const rows = database.sqlite
      .query(
        "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name <> '__drizzle_migrations' order by name"
      )
      .all() as Array<{ name: string }>

    expect(rows.map((row) => row.name)).toEqual([
      "account",
      "drafts",
      "prompts",
      "saved_prompts",
      "session",
      "user",
      "verification",
    ])
  })
})

describe("prompt repository", () => {
  test("seed is idempotent and preserves prompt rows", async () => {
    const { db } = await createTestDatabase()

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
    const { db } = await createTestDatabase()
    const repository = createPromptRepository(db)

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
    const { db } = await createTestDatabase()
    const repository = createPromptRepository(db)

    expect(await repository.exists(toPromptId(999))).toBe(false)
    expect(
      await repository.save(toUserId("dev-user"), toPromptId(999))
    ).toEqual({
      kind: "not-found",
    })
  })
})

describe("draft repository", () => {
  test("persists drafts, keeps ordering, and restores stored content", async () => {
    const { db } = await createTestDatabase()
    const repository = createDraftRepository(db)
    const longText = "가".repeat(150)
    const content = {
      content: [
        {
          attrs: { align: "left" },
          content: [{ text: longText, type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc" as const,
    }
    const metrics = extractDraftTextMetrics(content)

    const first = await repository.create(toUserId("dev-user"), {
      characterCount: metrics.characterCount,
      content,
      plainText: metrics.plainText,
      sourcePromptId: null,
      title: "긴 초안",
      wordCount: metrics.wordCount,
    })
    const second = await repository.create(toUserId("dev-user"), {
      characterCount: 0,
      content: createEmptyDraftContent(),
      plainText: "",
      sourcePromptId: toPromptId(1),
      title: "둘째 초안",
      wordCount: 0,
    })

    await repository.replace(toUserId("dev-user"), toDraftId(first.id), {
      characterCount: metrics.characterCount,
      content,
      plainText: metrics.plainText,
      sourcePromptId: null,
      title: "갱신된 긴 초안",
      wordCount: metrics.wordCount,
    })

    const drafts = await repository.list(toUserId("dev-user"), 10)
    const resume = await repository.resume(toUserId("dev-user"))
    const detail = await repository.getById(
      toUserId("dev-user"),
      toDraftId(first.id)
    )

    expect(drafts[0]?.id).toBe(first.id)
    expect(resume?.id).toBe(first.id)
    expect(drafts[0]?.preview.length).toBe(123)
    expect(Number(second.sourcePromptId)).toBe(1)
    expect(detail).toEqual(
      expect.objectContaining({
        kind: "draft",
      })
    )

    if (detail.kind === "draft") {
      expect(detail.draft.content).toEqual(content)
    }
  })

  test("guards ownership for draft read, update, and delete", async () => {
    const { db } = await createTestDatabase()
    const repository = createDraftRepository(db)
    const now = new Date("2026-03-21T00:00:00.000Z")

    db.insert(user)
      .values({
        createdAt: now,
        email: "other-user@example.com",
        emailVerified: true,
        id: "other-user",
        image: null,
        name: "다른 사용자",
        updatedAt: now,
      })
      .run()

    const created = await repository.create(toUserId("other-user"), {
      characterCount: 0,
      content: createEmptyDraftContent(),
      plainText: "",
      sourcePromptId: null,
      title: "숨겨진 초안",
      wordCount: 0,
    })

    const getResult = await repository.getById(
      toUserId("dev-user"),
      toDraftId(created.id)
    )
    const updateResult = await repository.replace(
      toUserId("dev-user"),
      toDraftId(created.id),
      {
        characterCount: 0,
        content: createEmptyDraftContent(),
        plainText: "",
        sourcePromptId: null,
        title: "수정 시도",
        wordCount: 0,
      }
    )
    const deleteResult = await repository.delete(
      toUserId("dev-user"),
      toDraftId(created.id)
    )

    expect(getResult.kind).toBe("forbidden")
    expect(updateResult.kind).toBe("forbidden")
    expect(deleteResult.kind).toBe("forbidden")
  })
})
