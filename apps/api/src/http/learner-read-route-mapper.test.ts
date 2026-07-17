import { describe, expect, it } from "vitest"

import {
  learnerCourseSummarySchema,
  learnerIdSchema,
  learnerProgressCourseSchema,
} from "@workspace/contracts/learning/read-data"
import { createLearnerCursorCodec } from "@workspace/core/learning"

import {
  decodeLearnerCourseListQuery,
  decodeLearnerProgressListQuery,
  encodeLearnerCoursePage,
  encodeLearnerProgressPage,
} from "@/http/learner-read-route-mapper"

const cursorCodec = createLearnerCursorCodec(
  "learner-read-transport-test-secret-with-32-bytes"
)
const version = { curriculumVersionId: "course-1-v1", revision: 1 } as const
const course = learnerCourseSummarySchema.parse({
  category: "입문",
  contentStatus: "active",
  description: "설명",
  id: "course-1",
  lessonCount: 2,
  title: "글쓰기 입문",
  version,
  visualKey: "basic-sentence-writing",
})
const progressCourse = learnerProgressCourseSchema.parse({
  id: "course-1",
  learning: {
    completedLessons: 1,
    lastActivityAt: "2026-06-14T00:00:00.000Z",
    nextLesson: {
      currentStepId: "step-2",
      currentStepIndex: 0,
      estimatedMinutes: 5,
      id: "lesson-2",
      title: "다음 레슨",
    },
    progressPercent: 50,
    status: "in_progress",
    totalLessons: 2,
    version,
  },
  title: "글쓰기 입문",
  visualKey: "basic-sentence-writing",
})

describe("learner read transport mapping", () => {
  it("course query를 정규화하고 다음 위치를 같은 조건의 opaque cursor로 왕복한다", () => {
    const first = decodeLearnerCourseListQuery(cursorCodec, {
      category: "입문",
      limit: 1,
      query: " 글쓰기 ",
      sort: "title-asc",
    })

    expect(first).toEqual({
      kind: "ok",
      value: {
        category: "입문",
        limit: 1,
        query: "글쓰기",
        sort: "title-asc",
      },
    })
    if (first.kind !== "ok") throw new Error("course query decode failed")

    const position = { courseId: "course-1", primary: "글쓰기 입문" }
    const wirePage = encodeLearnerCoursePage(cursorCodec, first.value, {
      items: [course],
      nextPosition: position,
    })
    expect(wirePage.items).toEqual([course])
    expect(wirePage.nextCursor).toEqual(expect.any(String))

    const next = decodeLearnerCourseListQuery(cursorCodec, {
      category: "입문",
      cursor: wirePage.nextCursor ?? undefined,
      limit: 1,
      query: "글쓰기",
      sort: "title-asc",
    })
    expect(next).toEqual({
      kind: "ok",
      value: { ...first.value, after: position },
    })

    expect(
      decodeLearnerCourseListQuery(cursorCodec, {
        cursor: wirePage.nextCursor ?? undefined,
        limit: 1,
        sort: "title-desc",
      })
    ).toEqual({ error: { kind: "invalid-cursor" }, kind: "err" })
  })

  it("마지막·빈 course page는 cursor 없이 기존 wire envelope로 변환한다", () => {
    const query = {
      limit: 20,
      sort: "recommended" as const,
    }

    expect(
      encodeLearnerCoursePage(cursorCodec, query, {
        items: [],
        nextPosition: null,
      })
    ).toEqual({ items: [], nextCursor: null })
  })

  it("progress cursor를 학습자 scope에 묶고 다른 학습자의 재사용을 거부한다", () => {
    const learnerId = learnerIdSchema.parse("learner-1")
    const query = decodeLearnerProgressListQuery(cursorCodec, learnerId, {
      limit: 10,
      status: "in_progress",
    })
    if (query.kind !== "ok") throw new Error("progress query decode failed")

    const position = { courseId: "course-1", primary: 1 }
    const wirePage = encodeLearnerProgressPage(cursorCodec, query.value, {
      items: [progressCourse],
      nextPosition: position,
    })

    expect(
      decodeLearnerProgressListQuery(cursorCodec, learnerId, {
        cursor: wirePage.nextCursor ?? undefined,
        limit: 10,
        status: "in_progress",
      })
    ).toEqual({
      kind: "ok",
      value: { ...query.value, after: position },
    })
    expect(
      decodeLearnerProgressListQuery(
        cursorCodec,
        learnerIdSchema.parse("learner-2"),
        {
          cursor: wirePage.nextCursor ?? undefined,
          limit: 10,
          status: "in_progress",
        }
      )
    ).toEqual({ error: { kind: "invalid-cursor" }, kind: "err" })
  })

  it("마지막·빈 progress page는 cursor 없이 기존 wire envelope로 변환한다", () => {
    const learnerId = learnerIdSchema.parse("learner-1")
    const query = decodeLearnerProgressListQuery(cursorCodec, learnerId, {
      limit: 10,
    })
    if (query.kind !== "ok") throw new Error("progress query decode failed")

    expect(
      encodeLearnerProgressPage(cursorCodec, query.value, {
        items: [],
        nextPosition: null,
      })
    ).toEqual({ items: [], nextCursor: null })
  })
})
