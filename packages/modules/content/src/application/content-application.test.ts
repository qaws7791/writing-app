import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import { createContentApplication } from "#content/application/content-application"
import type {
  ContentApplicationDependencies,
  ContentRepository,
} from "#content/application/ports/content-ports"
import type { CurriculumDraft } from "#content/domain/content-model"

const owner = {
  adminId: "owner-1" as AdminId,
  mutation: "allowed",
} as const
const operator = {
  adminId: "operator-1" as AdminId,
  mutation: "forbidden",
} as const
const now = new Date("2026-07-22T00:00:00.000Z")

describe("content application", () => {
  it("course command와 query를 각각 좁은 repository port에 위임한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.createCourse(owner)
    ).resolves.toMatchObject({
      value: { courseId: "course-1" },
    })
    await expect(
      fixture.application.getCourses({
        category: "",
        page: 1,
        pageSize: 20,
        query: "",
        status: "all",
      })
    ).resolves.toMatchObject({ page: 1, totalItems: 0 })

    expect(fixture.repository.createCourse).toHaveBeenCalledWith({
      courseId: "course-1",
      now,
    })
    expect(fixture.repository.readCourses).toHaveBeenCalledOnce()
  })

  it("owner가 아닌 mutation은 persistence 전에 거절한다", async () => {
    const fixture = createApplicationFixture()

    await expect(fixture.application.createCourse(operator)).resolves.toEqual(
      err({ kind: "content-forbidden" })
    )
    await expect(
      fixture.application.archiveCourse({
        actor: operator,
        courseId: draft.courseId,
      })
    ).resolves.toEqual(err({ kind: "content-forbidden" }))
    await expect(
      fixture.application.publishCourse({
        actor: operator,
        courseId: draft.courseId,
        expectedEditVersion: 0,
      })
    ).resolves.toEqual(err({ kind: "content-forbidden" }))

    expect(fixture.repository.createCourse).not.toHaveBeenCalled()
    expect(fixture.repository.findCourse).not.toHaveBeenCalled()
    expect(fixture.repository.findDraft).not.toHaveBeenCalled()
  })

  it("stale edit version을 optimistic conflict로 반환한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.saveCourseEditor({
        actor: owner,
        document: toEditorDocument(draft),
        expectedEditVersion: 1,
      })
    ).resolves.toEqual(err({ kind: "content-conflict" }))
    expect(fixture.repository.saveDraft).not.toHaveBeenCalled()
  })

  it("publish commit 이후 event를 발행하고 실패를 rollback으로 표현하지 않는다", async () => {
    const order: string[] = []
    const fixture = createApplicationFixture({ eventFailure: true, order })

    const result = await fixture.application.publishCourse({
      actor: owner,
      courseId: draft.courseId,
      expectedEditVersion: draft.editVersion,
    })

    expect(result.isOk()).toBe(true)
    expect(order).toEqual(["commit", "publish", "observe"])
    expect(fixture.dependencies.eventFailureObserver).toHaveBeenCalledWith({
      eventId: "content-event-1",
      eventName: "content.curriculum-published",
      kind: "content-event-publish-failed",
    })
  })

  it("reset guard가 거절하면 seed persistence를 호출하지 않는다", async () => {
    const fixture = createApplicationFixture({ resetForbidden: true })

    await expect(
      fixture.application.resetContent({ actor: owner })
    ).resolves.toEqual(err({ kind: "content-reset-forbidden" }))
    expect(fixture.repository.resetContent).not.toHaveBeenCalled()
  })
})

function createApplicationFixture({
  eventFailure = false,
  order = [],
  resetForbidden = false,
}: {
  readonly eventFailure?: boolean
  readonly order?: string[]
  readonly resetForbidden?: boolean
} = {}) {
  const repository = {
    createCourse: vi.fn(async () => ok(toEditorDocument(draft))),
    findCourse: vi.fn(async () => ({
      createdAt: now,
      id: draft.courseId,
      publishedCurriculumVersionId: null,
      sortOrder: 1,
      status: "active" as const,
    })),
    findCurriculumByLesson: vi.fn(async () => null),
    findDraft: vi.fn(async () => ok(draft)),
    listPublishedCourseSummaries: vi.fn(async () => []),
    publishDraft: vi.fn(async ({ decision }) => {
      order.push("commit")
      return ok(decision.aggregate)
    }),
    readCourseEditor: vi.fn(async () => toEditorDocument(draft)),
    readCourses: vi.fn(async (input) => ({
      items: [],
      page: input.page,
      pageSize: input.pageSize,
      totalItems: 0,
      totalPages: 1,
    })),
    readCurriculum: vi.fn(async () => null),
    resetContent: vi.fn(async () =>
      ok({
        changed: {
          archived: 0,
          courses: 5,
          lessons: 44,
          steps: 136,
          units: 15,
        },
        revision: 2,
      })
    ),
    saveCourse: vi.fn(async ({ course }) => ok(course)),
    saveDraft: vi.fn(async ({ draft: value }) =>
      ok({ ...value, editVersion: value.editVersion + 1 })
    ),
  } satisfies ContentRepository
  const dependencies = {
    clock: { now: vi.fn(() => now) },
    courseIdGenerator: { next: vi.fn(() => draft.courseId) },
    eventFailureObserver: vi.fn(() => order.push("observe")),
    eventIdGenerator: { next: vi.fn(() => "content-event-1") },
    eventPublisher: {
      publishCurriculumPublished: vi.fn(async () => {
        order.push("publish")
        return eventFailure
          ? err({ kind: "content-event-publish-failed" as const })
          : ok(undefined)
      }),
    },
    repository,
    resetGuard: {
      authorize: vi.fn(() =>
        resetForbidden
          ? err({ kind: "content-reset-forbidden" as const })
          : ok(undefined)
      ),
    },
  } satisfies ContentApplicationDependencies

  return {
    application: createContentApplication(dependencies),
    dependencies,
    repository,
  }
}

function toEditorDocument({
  visualKey: _visualKey,
  ...document
}: CurriculumDraft) {
  return document
}

const draft: CurriculumDraft = {
  category: "입문",
  courseId: "course-1" as CourseId,
  curriculumVersionId: "curriculum:course-1:1" as CurriculumVersionId,
  description: "설명",
  editVersion: 0,
  revision: 1,
  title: "코스",
  units: [
    {
      id: "unit-1" as UnitId,
      lessons: [
        {
          category: null,
          description: null,
          estimatedMinutes: 5,
          id: "lesson-1" as LessonId,
          sortOrder: 1,
          status: "active",
          steps: [
            {
              contentJson: JSON.stringify({ prompt: "작성하세요" }),
              id: "step-1" as LessonStepId,
              sortOrder: 1,
              status: "active",
              type: "WRITE",
            },
          ],
          summary: [],
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
