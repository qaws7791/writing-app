import { describe, expect, it } from "vitest"
import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import {
  createCurriculumDraft,
  decideArchiveCourse,
  decidePublishCurriculum,
  decideRestoreCourse,
} from "#content/domain/curriculum"
import type { CurriculumDraft } from "#content/domain/content-model"

const courseId = "course-1" as CourseId
const versionId = "curriculum:course-1:1" as CurriculumVersionId
const unitId = "unit-1" as UnitId
const lessonId = "lesson-1" as LessonId
const writeStepId = "step-write" as LessonStepId
const feedbackStepId = "step-feedback" as LessonStepId
const now = new Date("2026-07-22T00:00:00.000Z")

describe("content curriculum domain", () => {
  it("draft를 검증하고 version 범위의 AI target과 selectable ID를 강제한다", () => {
    expect(createCurriculumDraft(createDraft()).isOk()).toBe(true)
    expect(
      createCurriculumDraft(
        createDraft({
          feedbackContentJson: JSON.stringify({ target: "missing" }),
        })
      )._unsafeUnwrapErr()
    ).toEqual({
      kind: "content-validation-failed",
      reason: "invalid-ai-feedback-target",
    })
  })

  it("발행 시 revision과 published 시각을 확정한다", () => {
    const decision = decidePublishCurriculum({
      draft: createDraft(),
      now,
    })._unsafeUnwrap()

    expect(decision).toMatchObject({
      courseId,
      curriculumVersionId: versionId,
      publishedAt: now,
      revision: 1,
    })
  })

  it("빈 hierarchy 발행을 명시적으로 거절한다", () => {
    const emptyDraft = { ...createDraft(), units: [] }

    expect(
      decidePublishCurriculum({
        draft: emptyDraft,
        now,
      })._unsafeUnwrapErr()
    ).toEqual({
      kind: "content-validation-failed",
      reason: "empty-unit",
    })
  })

  it("active course만 archive하고 이미 archived인 course는 not-found로 처리한다", () => {
    const course = {
      createdAt: now,
      id: courseId,
      publishedCurriculumVersionId: versionId,
      sortOrder: 1,
      status: "active" as const,
    }
    const archived = decideArchiveCourse(course)._unsafeUnwrap()

    expect(archived.status).toBe("archived")
    expect(decideArchiveCourse(archived)._unsafeUnwrapErr()).toEqual({
      kind: "content-not-found",
    })

    const restored = decideRestoreCourse(archived)._unsafeUnwrap()
    expect(restored.status).toBe("active")
    expect(decideRestoreCourse(restored)._unsafeUnwrapErr()).toEqual({
      kind: "content-not-found",
    })
  })
})

function createDraft({
  feedbackContentJson = JSON.stringify({ target: writeStepId }),
}: {
  readonly feedbackContentJson?: string
} = {}): CurriculumDraft {
  return {
    category: "입문",
    courseId,
    coverAssetId: null,
    curriculumVersionId: versionId,
    description: "설명",
    editVersion: 0,
    revision: 1,
    title: "코스",
    units: [
      {
        id: unitId,
        lessons: [
          {
            category: null,
            description: null,
            estimatedMinutes: 5,
            id: lessonId,
            sortOrder: 1,
            status: "active",
            steps: [
              {
                contentJson: JSON.stringify({ prompt: "작성하세요" }),
                id: writeStepId,
                sortOrder: 1,
                status: "active",
                type: "WRITE",
              },
              {
                contentJson: feedbackContentJson,
                id: feedbackStepId,
                sortOrder: 2,
                status: "active",
                type: "AI_FEEDBACK",
              },
            ],
            summary: ["요약"],
            title: "레슨",
          },
        ],
        sortOrder: 1,
        status: "active",
        title: "유닛",
      },
    ],
    visualKey: "basic-sentence-writing",
  }
}
