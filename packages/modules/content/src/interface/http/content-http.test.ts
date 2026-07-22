import { describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createApp } from "@workspace/http-platform/core"
import { err, ok } from "@workspace/kernel/result"

import type { ContentApplication } from "#content/application/content-application"
import type {
  ContentAdminSessionPort,
  CourseEditorDocument,
} from "#content/application/ports/content-ports"
import {
  createCourseId,
  createCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readUnitId,
} from "#content/domain/content-model"
import { createAdminContentRoutes } from "#content/interface/http/content-http"

const courseId = createCourseId("course-1")
const curriculumVersionId = createCurriculumVersionId(courseId, 1)
const editorDocument: CourseEditorDocument = {
  category: "기초",
  courseId,
  curriculumVersionId,
  description: "강의 설명",
  editVersion: 3,
  revision: 1,
  title: "코스 1",
  units: [
    {
      id: readUnitId("course-1-unit-1"),
      lessons: [
        {
          category: "기초",
          description: "레슨 설명",
          estimatedMinutes: 5,
          id: readLessonId("course-1-lesson-1"),
          sortOrder: 1,
          status: "active",
          steps: [
            {
              contentJson: JSON.stringify({
                body: "본문",
                guide: "",
                title: "읽기",
                type: "reading",
              }),
              id: readLessonStepId("course-1-step-1"),
              sortOrder: 1,
              status: "active",
              type: "READING",
            },
          ],
          summary: [],
          title: "레슨 1",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "유닛 1",
    },
  ],
}

describe("content HTTP interface", () => {
  it("unauthenticated read와 operator mutation을 각각 401·403으로 거절한다", async () => {
    const createCourse = vi.fn(async () => ok(editorDocument))
    const app = createContentHttpFixture({ createCourse })

    const unauthenticated = await app.request("/courses")
    const forbidden = await app.request("/courses", {
      headers: { Cookie: "admin=operator" },
      method: "POST",
    })

    expect(unauthenticated.status).toBe(401)
    await expect(unauthenticated.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(forbidden.status).toBe(403)
    await expect(forbidden.json()).resolves.toMatchObject({ code: "FORBIDDEN" })
    expect(createCourse).not.toHaveBeenCalled()
  })

  it("editor ETag를 읽고 If-Match가 일치하면 증가한 ETag를 반환한다", async () => {
    const app = createContentHttpFixture()
    const headers = { Cookie: "admin=owner" }

    const read = await app.request("/courses/course-1/editor", { headers })
    const save = await app.request("/courses/course-1/editor", {
      body: JSON.stringify(await read.clone().json()),
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "If-Match": '"3"',
      },
      method: "PUT",
    })

    expect(read.status).toBe(200)
    expect(read.headers.get("etag")).toBe('"3"')
    expect(save.status).toBe(200)
    expect(save.headers.get("etag")).toBe('"4"')
  })

  it("If-Match가 없으면 application 호출 전 428을 반환한다", async () => {
    const saveCourseEditor = vi.fn(async () => ok(editorDocument))
    const app = createContentHttpFixture({ saveCourseEditor })

    const response = await app.request("/courses/course-1/editor", {
      body: JSON.stringify(toWireDocument(editorDocument)),
      headers: {
        Cookie: "admin=owner",
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(428)
    await expect(response.json()).resolves.toMatchObject({
      code: "PRECONDITION_REQUIRED",
    })
    expect(saveCourseEditor).not.toHaveBeenCalled()
  })

  it.each([
    ["content-conflict", "CONTENT_CONFLICT"],
    ["content-immutable-revision", "CONTENT_IMMUTABLE_REVISION"],
  ] as const)("%s를 canonical 409 %s로 mapping한다", async (kind, code) => {
    const app = createContentHttpFixture({
      saveCourseEditor: async () => err({ kind }),
    })

    const response = await app.request("/courses/course-1/editor", {
      body: JSON.stringify(toWireDocument(editorDocument)),
      headers: {
        Cookie: "admin=owner",
        "Content-Type": "application/json",
        "If-Match": '"3"',
      },
      method: "PUT",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ code })
  })
})

function createContentHttpFixture(overrides: Partial<ContentApplication> = {}) {
  const application: ContentApplication = {
    archiveCourse: async () => ok(undefined),
    createCourse: async () => ok(editorDocument),
    getCourseEditor: async () => editorDocument,
    getCourses: async (query) => ({
      items: [
        {
          category: editorDocument.category,
          id: courseId,
          lessonCount: 1,
          revision: editorDocument.revision,
          status: "active",
          title: editorDocument.title,
          unitCount: 1,
          visualKey: "basic-sentence-writing",
        },
      ],
      page: query.page,
      pageSize: query.pageSize,
      totalItems: 1,
      totalPages: 1,
    }),
    publishCourse: async () =>
      ok({ curriculumVersionId, publishedAt: new Date(), revision: 1 }),
    resetContent: async () =>
      ok({
        changed: {
          archived: 0,
          courses: 1,
          lessons: 1,
          steps: 1,
          units: 1,
        },
        revision: 1,
      }),
    saveCourseEditor: async () =>
      ok({ ...editorDocument, editVersion: editorDocument.editVersion + 1 }),
    ...overrides,
  }
  const sessionPort: ContentAdminSessionPort = {
    async resolveActor(headers) {
      const cookie = headers.get("Cookie")
      if (cookie === null) return null
      return {
        adminId: adminIdSchema.parse("admin-1"),
        mutation: cookie === "admin=owner" ? "allowed" : "forbidden",
      }
    },
  }

  return createApp({
    routes: createAdminContentRoutes({ application, sessionPort }),
  })
}

function toWireDocument(document: CourseEditorDocument) {
  return {
    category: document.category,
    curriculumVersionId: document.curriculumVersionId,
    description: document.description,
    editVersion: document.editVersion,
    id: document.courseId,
    revision: document.revision,
    status: "active",
    title: document.title,
    units: document.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: lesson.steps.map((step) => ({
          body: "본문",
          guide: "",
          id: step.id,
          sortOrder: step.sortOrder,
          status: step.status,
          title: "읽기",
          type: step.type,
        })),
      })),
    })),
  }
}
