import { describe, expect, it, vi } from "vitest"

import {
  adminCourseEditorDocumentSchema,
  type AdminCourseDetailDto,
  type AdminPublishCourseResult,
} from "@workspace/contracts/admin/content-data"
import { adminIdSchema } from "@workspace/contracts/admin/identity-data"
import type { CourseAdminRepository } from "#core/modules/content/application/ports/admin-content.repository"
import { createAdminCourseUseCase } from "#core/modules/content/application/use-cases/admin-course.use-case"

const ownerActor = {
  id: adminIdSchema.parse("owner-1"),
  role: "owner",
} as const

const operatorActor = {
  id: adminIdSchema.parse("operator-1"),
  role: "operator",
} as const

const now = new Date("2026-06-14T03:00:00.000Z")

const courseDetail: AdminCourseDetailDto = {
  category: "미분류",
  curriculumVersionId: "course-1-v1",
  description: "강의 설명",
  editVersion: 0,
  id: "course-1",
  revision: 1,
  status: "active",
  title: "새 강의",
  units: [],
}

const editorDocument = adminCourseEditorDocumentSchema.parse(courseDetail)

const publishResult: AdminPublishCourseResult = {
  curriculumVersionId: editorDocument.curriculumVersionId,
  publishedAt: now.toISOString(),
  revision: editorDocument.revision,
}

describe("content 소유 관리자 course use case", () => {
  it("course 조회 query를 좁은 content repository에 전달한다", async () => {
    const repository = createCourseRepository()
    const useCase = createAdminCourseUseCase(repository)

    await expect(
      useCase.getCourses({
        category: "미분류",
        page: 2,
        pageSize: 20,
        query: "강의",
        status: "active",
      })
    ).resolves.toEqual({
      items: [],
      page: 2,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
    })
    await expect(
      useCase.getCourseEditor({ courseId: courseDetail.id })
    ).resolves.toEqual(editorDocument)

    expect(repository.readCourses).toHaveBeenCalledWith({
      category: "미분류",
      page: 2,
      pageSize: 20,
      query: "강의",
      status: "active",
    })
    expect(repository.readCourseEditor).toHaveBeenCalledWith({
      courseId: courseDetail.id,
    })
  })

  it("owner command에서 actor를 제거하고 기존 persistence 결과를 보존한다", async () => {
    const repository = createCourseRepository()
    const useCase = createAdminCourseUseCase(repository)

    await expect(
      useCase.createCourse({ actor: ownerActor, now })
    ).resolves.toEqual({ kind: "ok", value: courseDetail })
    await expect(
      useCase.archiveCourse({
        actor: ownerActor,
        courseId: courseDetail.id,
        now,
      })
    ).resolves.toEqual({ kind: "ok" })
    await expect(
      useCase.saveCourseEditor({
        actor: ownerActor,
        courseId: courseDetail.id,
        document: editorDocument,
        expectedEditVersion: editorDocument.editVersion,
        now,
      })
    ).resolves.toEqual({ kind: "ok", value: editorDocument })
    await expect(
      useCase.publishCourse({
        actor: ownerActor,
        courseId: courseDetail.id,
        expectedEditVersion: editorDocument.editVersion,
        now,
      })
    ).resolves.toEqual({ kind: "ok", value: publishResult })

    expect(repository.createCourse).toHaveBeenCalledWith({ now })
    expect(repository.archiveCourse).toHaveBeenCalledWith({
      courseId: courseDetail.id,
      now,
    })
    expect(repository.saveCourseEditor).toHaveBeenCalledWith({
      courseId: courseDetail.id,
      document: editorDocument,
      expectedEditVersion: editorDocument.editVersion,
      now,
    })
    expect(repository.publishCourse).toHaveBeenCalledWith({
      courseId: courseDetail.id,
      expectedEditVersion: editorDocument.editVersion,
      now,
    })
  })

  it("operator의 모든 course command를 repository 호출 전에 거절한다", async () => {
    const repository = createCourseRepository()
    const useCase = createAdminCourseUseCase(repository)

    await expect(
      Promise.all([
        useCase.createCourse({ actor: operatorActor, now }),
        useCase.archiveCourse({
          actor: operatorActor,
          courseId: courseDetail.id,
          now,
        }),
        useCase.saveCourseEditor({
          actor: operatorActor,
          courseId: courseDetail.id,
          document: editorDocument,
          expectedEditVersion: editorDocument.editVersion,
          now,
        }),
        useCase.publishCourse({
          actor: operatorActor,
          courseId: courseDetail.id,
          expectedEditVersion: editorDocument.editVersion,
          now,
        }),
      ])
    ).resolves.toEqual(Array.from({ length: 4 }, () => ({ kind: "forbidden" })))

    expect(repository.createCourse).not.toHaveBeenCalled()
    expect(repository.archiveCourse).not.toHaveBeenCalled()
    expect(repository.saveCourseEditor).not.toHaveBeenCalled()
    expect(repository.publishCourse).not.toHaveBeenCalled()
  })
})

function createCourseRepository(): CourseAdminRepository & {
  readonly archiveCourse: ReturnType<
    typeof vi.fn<CourseAdminRepository["archiveCourse"]>
  >
  readonly createCourse: ReturnType<
    typeof vi.fn<CourseAdminRepository["createCourse"]>
  >
  readonly publishCourse: ReturnType<
    typeof vi.fn<CourseAdminRepository["publishCourse"]>
  >
  readonly readCourseEditor: ReturnType<
    typeof vi.fn<CourseAdminRepository["readCourseEditor"]>
  >
  readonly readCourses: ReturnType<
    typeof vi.fn<CourseAdminRepository["readCourses"]>
  >
  readonly saveCourseEditor: ReturnType<
    typeof vi.fn<CourseAdminRepository["saveCourseEditor"]>
  >
} {
  return {
    archiveCourse: vi.fn(async () => ({ kind: "ok" })),
    createCourse: vi.fn(async () => courseDetail),
    publishCourse: vi.fn(async () => ({ kind: "ok", value: publishResult })),
    readCourseEditor: vi.fn(async () => editorDocument),
    readCourses: vi.fn(async (input) => ({
      items: [],
      page: input.page,
      pageSize: input.pageSize,
      totalItems: 0,
      totalPages: 1,
    })),
    saveCourseEditor: vi.fn(async () => ({
      kind: "ok",
      value: editorDocument,
    })),
  }
}
