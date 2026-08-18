import { describe, expect, it } from "vitest"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import {
  writingIdSchema,
  writingTaskIdSchema,
  writingTaskPublicationIdSchema,
} from "@workspace/contracts/writing/writing"

import {
  parseWritingCheckResult,
  readWritingCheckGate,
} from "#writing/domain/writing-check"
import {
  countWritingChars,
  createWritingPiece,
  previewWritingBody,
  reviseWritingPiece,
  writingEventTypes,
} from "#writing/domain/writing"
import {
  createWritingTaskDraft,
  publishWritingTask,
  saveWritingTaskDraft,
} from "#writing/domain/writing-task"

const now = new Date("2026-08-13T04:00:00.000Z")
const later = new Date("2026-08-13T05:00:00.000Z")
const taskId = writingTaskIdSchema.parse("task-policy")
const publicationId = writingTaskPublicationIdSchema.parse("pub-policy")
const writingId = writingIdSchema.parse("writing-policy")
const learnerId = learnerIdSchema.parse("learner-policy")

describe("쓰기 과제 발행", () => {
  it("발행본은 초안 스냅샷이고 이후 초안 저장은 발행본을 바꾸지 않는다", () => {
    const created = createWritingTaskDraft({ id: taskId, now })
    const ready = saveWritingTaskDraft(created, {
      audience: "학교 신문 독자",
      difficulty: "심화",
      domain: "설득·의견문",
      goalChars: 500,
      minChars: 200,
      now,
      requiredElements: ["주장과 근거를 연결한다", "반론을 다룬다"],
      situation: "숙제를 줄이자는 칼럼을 씁니다.",
      title: "숙제 폐지 찬반 칼럼",
      typeName: "칼럼",
    })
    const published = publishWritingTask(ready, {
      id: publicationId,
      now: later,
    })
    if ("kind" in published) {
      throw new Error(published.reason)
    }

    const revisedDraft = saveWritingTaskDraft(published.draft, {
      audience: published.draft.audience,
      difficulty: published.draft.difficulty,
      domain: published.draft.domain,
      goalChars: 800,
      minChars: published.draft.minChars,
      now: later,
      requiredElements: published.draft.requiredElements,
      situation: "초안만 바꿉니다.",
      title: "바뀐 제목",
      typeName: published.draft.typeName,
    })

    expect(published.publication).toMatchObject({
      goalChars: 500,
      id: publicationId,
      title: "숙제 폐지 찬반 칼럼",
    })
    expect(revisedDraft.latestPublicationId).toBe(publicationId)
    expect(revisedDraft.title).toBe("바뀐 제목")
  })

  it("필수 필드가 비면 발행하지 않는다", () => {
    const draft = createWritingTaskDraft({ id: taskId, now })
    expect(publishWritingTask(draft, { id: publicationId, now })).toEqual({
      kind: "writing-task-not-ready-to-publish",
      reason:
        "발행하려면 제목, 유형, 상황, 독자, 글자 수, 필수 요소가 필요합니다.",
    })
  })
})

describe("글 점검", () => {
  it("본문이 바뀌면 점검 뒤 수정 event를 남긴다", () => {
    const writing = createWritingPiece({
      id: writingId,
      learnerId,
      now,
      publicationId,
    })
    const revised = reviseWritingPiece(
      { ...writing, body: "충분한 본문", version: 1 },
      {
        body: "고친 본문",
        hasSucceededCheck: true,
        now: later,
      }
    )

    expect(revised.eventTypes).toEqual([writingEventTypes.revisedAfterCheck])
    expect(revised.writing).toMatchObject({
      body: "고친 본문",
      version: 2,
    })
  })

  it("최소 글자, 하루 한도, 고지 확인 전에는 점검을 시작하지 않는다", () => {
    expect(
      readWritingCheckGate({
        acknowledgedNotice: false,
        body: "가".repeat(200),
        dailyChecksRemaining: 5,
        minChars: 200,
      })
    ).toEqual({ kind: "writing-ai-notice-required" })
    expect(
      readWritingCheckGate({
        acknowledgedNotice: true,
        body: "짧음",
        dailyChecksRemaining: 5,
        minChars: 200,
      })
    ).toEqual({ kind: "writing-check-min-chars", minChars: 200 })
    expect(
      readWritingCheckGate({
        acknowledgedNotice: true,
        body: "가".repeat(200),
        dailyChecksRemaining: 0,
        minChars: 200,
      })
    ).toEqual({ kind: "writing-check-daily-limit" })
    expect(
      readWritingCheckGate({
        acknowledgedNotice: true,
        body: "가".repeat(200),
        dailyChecksRemaining: 1,
        minChars: 200,
      })
    ).toBeNull()
  })

  it("점검 결과는 잘된 점 1–2개와 고칠 일 최대 3개만 받는다", () => {
    expect(
      parseWritingCheckResult({
        revisions: [],
        strengths: ["첫 문장이 분명합니다."],
        unmetRequirements: [],
      })
    ).not.toBeNull()
    expect(
      parseWritingCheckResult({
        revisions: [
          {
            example: "반론을 한 문장 더 씁니다.",
            location: "둘째 문단",
            quote: "반대하는 사람도 있다.",
            reason: "반론이 한 문장으로 끝납니다.",
          },
        ],
        strengths: ["첫 문장이 분명합니다."],
        unmetRequirements: [],
      })
    ).not.toBeNull()
    expect(
      parseWritingCheckResult({
        revisions: [
          {
            example: "반론을 한 문장 더 씁니다.",
            location: "둘째 문단",
            reason: "반론이 한 문장으로 끝납니다.",
          },
        ],
        strengths: ["첫 문장이 분명합니다."],
        unmetRequirements: [],
      })
    ).not.toBeNull()
    expect(
      parseWritingCheckResult({
        revisions: [],
        strengths: [],
        unmetRequirements: [],
      })
    ).toBeNull()
  })

  it("본문 미리보기는 공백을 접고 120자에서 자른다", () => {
    expect(countWritingChars("한글12")).toBe(4)
    expect(previewWritingBody("  첫 줄\n\n둘째 줄  ")).toBe("첫 줄 둘째 줄")
    expect(previewWritingBody("가".repeat(120))).toBe("가".repeat(120))
    expect(previewWritingBody("가".repeat(121))).toBe(`${"가".repeat(120)}…`)
  })
})
