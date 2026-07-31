import { describe, expect, it, vi } from "vitest"
import { adminContentAssetMaxBytes } from "@workspace/contracts/content/admin-assets"
import { adminCourseEditorWriteDocumentSchema } from "@workspace/contracts/content/admin-courses"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createApp } from "@workspace/http-platform/app"
import { err, ok } from "@workspace/kernel/result"
import type { ContentAssetId } from "@workspace/types/ids"

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
import { registerContentRoutes } from "#content/interface/http/content-http"
import type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"

const courseId = createCourseId("course-1")
const curriculumVersionId = createCurriculumVersionId(courseId, 1)
const adminCookie = "admin=valid"
const editorDocument: CourseEditorDocument = {
  assets: [],
  category: "미분류",
  courseId,
  coverAssetId: null,
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
  it("인증되지 않은 요청을 401로 처리한다", async () => {
    const createCourse = vi.fn(async () => ok(editorDocument))
    const app = createContentHttpFixture({ createCourse })

    const unauthenticated = await app.request("/courses")

    expect(unauthenticated.status).toBe(401)
    await expect(unauthenticated.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(createCourse).not.toHaveBeenCalled()
  })

  it("일치하지 않는 관리자 session cookie를 401로 거절한다", async () => {
    const createCourse = vi.fn(async () => ok(editorDocument))
    const app = createContentHttpFixture({ createCourse })

    const response = await app.request("/courses", {
      headers: { Cookie: "admin=forged" },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(createCourse).not.toHaveBeenCalled()
  })

  it("editor ETag를 읽고 If-Match가 일치하면 증가한 ETag를 반환한다", async () => {
    const app = createContentHttpFixture()
    const headers = { Cookie: adminCookie }

    const read = await app.request("/courses/course-1/editor", { headers })
    const save = await app.request("/courses/course-1/editor", {
      body: JSON.stringify(toWireDocument(editorDocument)),
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
        Cookie: "admin=valid",
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
        Cookie: "admin=valid",
        "Content-Type": "application/json",
        "If-Match": '"3"',
      },
      method: "PUT",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ code })
  })

  it("multipart 콘텐츠 이미지를 application command로 전달한다", async () => {
    const uploadAsset = vi.fn(async () =>
      ok({
        asset: {
          altText: "코스 표지",
          byteSize: 4,
          contentType: "image/jpeg" as const,
          courseId,
          createdAt: new Date(),
          curriculumVersionId,
          id: "content-asset-1" as ContentAssetId,
          kind: "course-cover" as const,
          objectKey: "content-assets/course-cover/content-asset-1.jpg",
          orphanedAt: null,
          status: "active" as const,
          updatedAt: new Date(),
        },
        url: "https://cdn.example.test/content-asset-1.jpg",
      })
    )
    const app = createContentHttpFixture({ uploadAsset })
    const form = new FormData()
    form.set("altText", "코스 표지")
    form.set("curriculumVersionId", curriculumVersionId)
    form.set("kind", "course-cover")
    form.set(
      "file",
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "ignored.jpg", {
        type: "image/jpeg",
      })
    )

    const response = await app.request("/courses/course-1/assets", {
      body: form,
      headers: { Cookie: "admin=valid" },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      contentType: "image/jpeg",
      id: "content-asset-1",
      kind: "course-cover",
    })
    expect(uploadAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: "admin-1",
        altText: "코스 표지",
        courseId,
        curriculumVersionId,
        declaredContentType: "image/jpeg",
        kind: "course-cover",
      })
    )
  })

  it("multipart file 누락을 application 호출 전에 400으로 거절한다", async () => {
    const uploadAsset = vi.fn()
    const app = createContentHttpFixture({ uploadAsset })
    const form = new FormData()
    form.set("altText", "코스 표지")
    form.set("curriculumVersionId", curriculumVersionId)
    form.set("kind", "course-cover")

    const response = await app.request("/courses/course-1/assets", {
      body: form,
      headers: { Cookie: "admin=valid" },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
    })
    expect(uploadAsset).not.toHaveBeenCalled()
  })

  it("5MB 초과 multipart 파일을 application 호출 전에 413으로 거절한다", async () => {
    const uploadAsset = vi.fn()
    const app = createContentHttpFixture({ uploadAsset })
    const form = new FormData()
    form.set("altText", "코스 표지")
    form.set("curriculumVersionId", curriculumVersionId)
    form.set("kind", "course-cover")
    form.set(
      "file",
      new File(
        [new Uint8Array(adminContentAssetMaxBytes + 1)],
        "oversized.jpg",
        { type: "image/jpeg" }
      )
    )

    const response = await app.request("/courses/course-1/assets", {
      body: form,
      headers: { Cookie: "admin=valid" },
      method: "POST",
    })

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toMatchObject({
      code: "CONTENT_ASSET_TOO_LARGE",
    })
    expect(uploadAsset).not.toHaveBeenCalled()
  })
})

function createContentHttpFixture(overrides: Partial<ContentApplication> = {}) {
  const application: ContentApplication = {
    archiveCourse: async () => ok(undefined),
    cleanupOrphanedAssets: async () =>
      ok({ deleted: 0, retained: 0, scanned: 0 }),
    createCourse: async () => ok(editorDocument),
    restoreCourse: async () => ok(undefined),
    findCurriculumByLesson: async () => null,
    getCourseAssets: async () => [],
    getCourseEditor: async () => editorDocument,
    getCourses: async (query) => ({
      items: [
        {
          category: editorDocument.category,
          cover: null,
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
    listPublishedCourses: async () => [],
    publishCourse: async () =>
      ok({ curriculumVersionId, publishedAt: new Date(), revision: 1 }),
    readCurriculum: async () => null,
    resolveAssetReferences: async () => [],
    saveCourseEditor: async () =>
      ok({ ...editorDocument, editVersion: editorDocument.editVersion + 1 }),
    uploadAsset: async () =>
      err({
        kind: "content-asset-invalid",
        reason: "image-decode-failed",
      }),
    ...overrides,
  }
  const sessionPort: ContentAdminSessionPort = {
    async resolveAdminId(headers) {
      return headers.get("Cookie") === adminCookie
        ? adminIdSchema.parse("admin-1")
        : null
    },
  }

  const app = createApp<ContentAdminHonoEnv>()
  registerContentRoutes(app, { application, sessionPort })
  return app
}

function toWireDocument(document: CourseEditorDocument) {
  return adminCourseEditorWriteDocumentSchema.parse({
    category: document.category,
    coverAssetId: document.coverAssetId,
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
          ...(JSON.parse(step.contentJson) as Readonly<
            Record<string, unknown>
          >),
          id: step.id,
          sortOrder: step.sortOrder,
          status: step.status,
          type: step.type,
        })),
      })),
    })),
  })
}
