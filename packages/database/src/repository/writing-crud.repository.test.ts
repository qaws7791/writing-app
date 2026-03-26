import { afterEach, describe, expect, test } from "bun:test"
import {
  createEmptyWritingContent,
  extractWritingTextMetrics,
  toWritingId,
  toPromptId,
  toUserId,
} from "@workspace/core"

import { user } from "../schema/index.js"
import { createTestDb } from "../testing/index.js"

import { createWritingRepository } from "./index.js"

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

describe("writing repository", () => {
  test("persists writings, keeps ordering, and restores stored content", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)
    const timestamps = [
      "2026-03-21T00:00:00.000Z",
      "2026-03-21T00:01:00.000Z",
      "2026-03-21T00:02:00.000Z",
    ]

    const repository = createWritingRepository(
      db,
      () => timestamps.shift() ?? "2026-03-21T00:02:00.000Z"
    )
    const longText = "가".repeat(150)
    const content = {
      content: [
        {
          content: [{ text: longText, type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc" as const,
    }
    const metrics = extractWritingTextMetrics(content)

    const first = await repository.create(toUserId("dev-user"), {
      characterCount: metrics.characterCount,
      content,
      plainText: metrics.plainText,
      sourcePromptId: null,
      title: "긴 글",
      wordCount: metrics.wordCount,
    })
    const second = await repository.create(toUserId("dev-user"), {
      characterCount: 0,
      content: createEmptyWritingContent(),
      plainText: "",
      sourcePromptId: toPromptId(1),
      title: "둘째 글",
      wordCount: 0,
    })

    await repository.replace(toUserId("dev-user"), toWritingId(first.id), {
      characterCount: metrics.characterCount,
      content,
      plainText: metrics.plainText,
      sourcePromptId: null,
      title: "갱신된 긴 글",
      wordCount: metrics.wordCount,
    })

    const writings = await repository.list(toUserId("dev-user"), { limit: 10 })
    const resume = await repository.resume(toUserId("dev-user"))
    const detail = await repository.getById(
      toUserId("dev-user"),
      toWritingId(first.id)
    )

    expect(writings.items[0]?.id).toBe(first.id)
    expect(resume?.id).toBe(first.id)
    expect(writings.items[0]?.preview.length).toBe(123)
    expect(Number(second.sourcePromptId)).toBe(1)
    expect(detail).toEqual(
      expect.objectContaining({
        kind: "writing",
      })
    )

    if (detail.kind === "writing") {
      expect(detail.writing.content).toEqual(content)
      expect(detail.writing.updatedAt).toBe("2026-03-21T00:02:00.000Z")
    }
  })

  test("guards ownership for writing read, update, and delete", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)

    const repository = createWritingRepository(
      db,
      () => "2026-03-21T00:00:00.000Z"
    )
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
      content: createEmptyWritingContent(),
      plainText: "",
      sourcePromptId: null,
      title: "숨겨진 글",
      wordCount: 0,
    })

    const getResult = await repository.getById(
      toUserId("dev-user"),
      toWritingId(created.id)
    )
    const updateResult = await repository.replace(
      toUserId("dev-user"),
      toWritingId(created.id),
      {
        characterCount: 0,
        content: createEmptyWritingContent(),
        plainText: "",
        sourcePromptId: null,
        title: "수정 시도",
        wordCount: 0,
      }
    )
    const deleteResult = await repository.delete(
      toUserId("dev-user"),
      toWritingId(created.id)
    )

    expect(getResult.kind).toBe("forbidden")
    expect(updateResult.kind).toBe("forbidden")
    expect(deleteResult.kind).toBe("forbidden")
  })
})
