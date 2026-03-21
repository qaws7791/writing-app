import { afterEach, describe, expect, test } from "bun:test"
import {
  createEmptyDraftContent,
  extractDraftTextMetrics,
  toDraftId,
  toPromptId,
  toUserId,
} from "@workspace/core"

import { user } from "../schema/index.js"
import { createTestDb } from "../testing/index.js"

import { createDraftRepository } from "./index.js"

const cleanupTasks: Array<() => void> = []

afterEach(() => {
  while (cleanupTasks.length > 0) {
    cleanupTasks.pop()?.()
  }
})

describe("draft repository", () => {
  test("persists drafts, keeps ordering, and restores stored content", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)
    const timestamps = [
      "2026-03-21T00:00:00.000Z",
      "2026-03-21T00:01:00.000Z",
      "2026-03-21T00:02:00.000Z",
    ]

    const repository = createDraftRepository(
      db,
      () => timestamps.shift() ?? "2026-03-21T00:02:00.000Z"
    )
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
      expect(detail.draft.updatedAt).toBe("2026-03-21T00:02:00.000Z")
    }
  })

  test("guards ownership for draft read, update, and delete", async () => {
    const { cleanup, db } = await createTestDb()
    cleanupTasks.push(cleanup)

    const repository = createDraftRepository(
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
