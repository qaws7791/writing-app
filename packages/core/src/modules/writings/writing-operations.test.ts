import { describe, expect, it } from "vitest"

import type { WritingContent } from "../../shared/schema/index"
import {
  applyOperationsToContent,
  computeWritingMetrics,
  advanceWritingVersion,
} from "./writing-operations"
import {
  createTestWriting,
  testContent,
  updatedContent,
} from "./testing/test-fixtures"

describe("applyOperationsToContent", () => {
  it("setTitle 연산을 적용한다", () => {
    const result = applyOperationsToContent(testContent, "원래 제목", [
      { type: "setTitle", title: "새 제목" },
    ])

    expect(result.title).toBe("새 제목")
    expect(result.content).toEqual(testContent)
  })

  it("setContent 연산을 적용한다", () => {
    const result = applyOperationsToContent(testContent, "제목", [
      { type: "setContent", content: updatedContent },
    ])

    expect(result.content).toEqual(updatedContent)
    expect(result.title).toBe("제목")
  })

  it("여러 연산을 순서대로 적용한다", () => {
    const result = applyOperationsToContent(testContent, "원래 제목", [
      { type: "setTitle", title: "중간 제목" },
      { type: "setContent", content: updatedContent },
      { type: "setTitle", title: "최종 제목" },
    ])

    expect(result.title).toBe("최종 제목")
    expect(result.content).toEqual(updatedContent)
  })

  it("빈 연산 배열이면 원본을 그대로 반환한다", () => {
    const result = applyOperationsToContent(testContent, "제목", [])

    expect(result.title).toBe("제목")
    expect(result.content).toEqual(testContent)
  })
})

describe("computeWritingMetrics", () => {
  it("빈 content에서 메트릭을 계산한다", () => {
    const emptyContent: WritingContent = {
      type: "doc",
      content: [{ type: "paragraph" }],
    }

    const metrics = computeWritingMetrics(emptyContent)

    expect(metrics.characterCount).toBe(0)
    expect(metrics.wordCount).toBe(0)
  })

  it("텍스트 content에서 메트릭을 계산한다", () => {
    const metrics = computeWritingMetrics(testContent)

    expect(metrics.characterCount).toBeGreaterThan(0)
    expect(metrics.plainText).toContain("테스트 본문")
  })
})

describe("advanceWritingVersion", () => {
  it("새 버전으로 Writing을 갱신한다", () => {
    const writing = createTestWriting({ version: 5 })
    const now = "2026-03-25T12:00:00.000Z"

    const result = advanceWritingVersion(
      writing,
      updatedContent,
      "새 제목",
      6,
      now
    )

    expect(result.version).toBe(6)
    expect(result.title).toBe("새 제목")
    expect(result.content).toEqual(updatedContent)
    expect(result.updatedAt).toBe(now)
    expect(result.lastSavedAt).toBe(now)
  })
})
