import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { Database } from "bun:sqlite"
import { describe, expect, test } from "bun:test"
import {
  createEmptyDraftContent,
  extractDraftTextMetrics,
  toDraftId,
  toPromptId,
  toUserId,
} from "@workspace/domain"

import {
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
} from "./sqlite-database.js"
import { SqliteDraftRepository } from "./sqlite-draft-repository.js"
import { SqlitePromptRepository } from "./sqlite-prompt-repository.js"
import { seedDatabase } from "./sqlite-seed.js"

function createTestDatabase(): { database: Database; close: () => void } {
  const directory = mkdtempSync(join(tmpdir(), "writing-infra-"))
  const database = openSqliteDatabase(join(directory, "test.sqlite"))
  ensureSqliteJsonbSupport(database)
  createSchema(database)
  seedDatabase(database, {
    nickname: "테스트 사용자",
    userId: toUserId("dev-user"),
  })

  return {
    database,
    close: () => database.close(false),
  }
}

describe("sqlite repositories", () => {
  test("seed is idempotent and updates the dev user nickname", () => {
    const { database, close } = createTestDatabase()

    seedDatabase(database, {
      nickname: "업데이트된 사용자",
      userId: toUserId("dev-user"),
    })

    const row = database
      .query("select nickname from users where id = ? limit 1")
      .get("dev-user") as { nickname: string } | null

    expect(row?.nickname).toBe("업데이트된 사용자")
    close()
  })

  test("lists today prompts in recommendation order and filters prompts", async () => {
    const { database, close } = createTestDatabase()
    const repository = new SqlitePromptRepository(database)

    const today = await repository.listTodayPrompts(toUserId("dev-user"), 4)
    const filtered = await repository.list(toUserId("dev-user"), {
      level: 3,
      query: "AI",
      topic: "기술",
    })

    expect(today.map((prompt) => Number(prompt.id))).toEqual([1, 3, 6, 7])
    expect(filtered).toHaveLength(1)
    expect(Number(filtered[0]?.id)).toBe(6)
    close()
  })

  test("persists saved prompts and saved filters", async () => {
    const { database, close } = createTestDatabase()
    const repository = new SqlitePromptRepository(database)

    await repository.save(toUserId("dev-user"), toPromptId(6))
    await repository.save(toUserId("dev-user"), toPromptId(1))

    const saved = await repository.listSaved(toUserId("dev-user"), 10)
    const filtered = await repository.list(toUserId("dev-user"), {
      saved: true,
    })

    expect(saved.map((prompt) => Number(prompt.id))).toEqual([1, 6])
    expect(filtered.map((prompt) => Number(prompt.id))).toEqual([1, 6])

    await repository.unsave(toUserId("dev-user"), toPromptId(1))
    expect(
      (await repository.list(toUserId("dev-user"), { saved: true })).map(
        (prompt) => Number(prompt.id)
      )
    ).toEqual([6])
    close()
  })

  test("orders drafts by updated time, truncates preview, and round-trips jsonb", async () => {
    const { database, close } = createTestDatabase()
    const repository = new SqliteDraftRepository(database)
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
    expect(detail).toEqual(
      expect.objectContaining({
        kind: "draft",
      })
    )
    if (detail.kind === "draft") {
      expect(detail.draft.content).toEqual(content)
    }
    expect(Number(second.sourcePromptId)).toBe(1)
    close()
  })

  test("guards ownership for draft read, update, and delete", async () => {
    const { database, close } = createTestDatabase()
    const repository = new SqliteDraftRepository(database)
    const now = new Date().toISOString()

    database
      .query(
        `
          insert into users (id, nickname, created_at)
          values (?, ?, ?)
        `
      )
      .run("other-user", "다른 사용자", now)

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
        JSON.stringify(createEmptyDraftContent()),
        "",
        0,
        0,
        null,
        now,
        now,
        now
      ) as { id: number }

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
    close()
  })
})
