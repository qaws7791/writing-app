import { describe, expect, it, vi } from "vitest"

import { createAdminService } from "./admin.service"
import type { AdminRepository } from "./admin.repository"

function createRepository(
  overrides: Partial<AdminRepository> = {}
): AdminRepository {
  return {
    async getCourseDetail() {
      return {
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장 구조를 배웁니다.",
        sortOrder: 1,
      }
    },
    async getCourseEditorDocument() {
      return {
        course: {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 구조를 배웁니다.",
          sortOrder: 1,
        },
        curriculum: {
          chapters: [],
          steps: [],
        },
        revision: 0,
      }
    },
    async getCourseLessonDetail() {
      return {
        id: "sentence-structure-01",
        courseId: "sentence-structure",
        title: "주어와 서술어 찾기",
        categoryId: "writing-basics",
        unitNumber: 1,
        nextLessonId: null,
        steps: [],
      }
    },
    async listCourses() {
      return {
        courses: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        },
        query: "",
      }
    },
    async listCourseTree() {
      return { courses: [] }
    },
    async listUsers() {
      return { users: [] }
    },
    async saveCourseEditorDocument() {
      return {
        status: "saved",
        document: {
          course: {
            id: "sentence-structure",
            title: "문장 구조의 기본",
            description: "문장 구조를 배웁니다.",
            sortOrder: 1,
          },
          revision: 1,
          curriculum: {
            chapters: [],
            steps: [],
          },
        },
      }
    },
    ...overrides,
  }
}

describe("createAdminService", () => {
  it("returns the current course editor document", async () => {
    const service = createAdminService({ repository: createRepository() })

    const result = await service.getCourseEditorDocument("sentence-structure")

    expect(result).toEqual({
      status: "ok",
      value: {
        course: {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 구조를 배웁니다.",
          sortOrder: 1,
        },
        revision: 0,
        curriculum: {
          chapters: [],
          steps: [],
        },
      },
    })
  })

  it("saves the current curriculum without draft or publish state", async () => {
    const saveCourseEditorDocument = vi.fn<
      AdminRepository["saveCourseEditorDocument"]
    >(async (input) => ({
      status: "saved",
      document: {
        course: {
          id: input.courseId,
          title: input.course.title,
          description: input.course.description,
          sortOrder: input.course.sortOrder,
        },
        revision: input.expectedRevision + 1,
        curriculum: {
          chapters: [],
          steps: [],
        },
      },
    }))
    const service = createAdminService({
      repository: createRepository({ saveCourseEditorDocument }),
    })

    const result = await service.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: 0,
      course: {
        title: "문장 구조의 기본",
        description: "문장 구조를 배웁니다.",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    })

    expect(result).toEqual({
      status: "ok",
      value: {
        course: {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장 구조를 배웁니다.",
          sortOrder: 1,
        },
        revision: 1,
        curriculum: {
          chapters: [],
          steps: [],
        },
      },
    })
    expect(saveCourseEditorDocument).toHaveBeenCalledWith({
      courseId: "sentence-structure",
      expectedRevision: 0,
      course: {
        title: "문장 구조의 기본",
        description: "문장 구조를 배웁니다.",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    })
  })

  it("returns conflict when the editor document revision is stale", async () => {
    const repository = createRepository({
      async saveCourseEditorDocument() {
        return {
          status: "conflict",
          error: {
            code: "conflict",
            message: "다른 관리자가 먼저 저장했습니다.",
          },
        }
      },
    })
    const service = createAdminService({ repository })

    const result = await service.saveCourseEditorDocument({
      courseId: "sentence-structure",
      expectedRevision: 0,
      course: {
        title: "문장 구조의 기본",
        description: "문장 구조를 배웁니다.",
        sortOrder: 1,
      },
      chapters: [],
      lessons: [],
      steps: [],
    })

    expect(result).toEqual({
      status: "conflict",
      error: {
        code: "conflict",
        message: "다른 관리자가 먼저 저장했습니다.",
      },
    })
  })

  it("maps missing editor documents to not found", async () => {
    const service = createAdminService({
      repository: createRepository({
        async getCourseEditorDocument() {
          return undefined
        },
      }),
    })

    const result = await service.getCourseEditorDocument("missing")

    expect(result).toEqual({
      status: "not-found",
      error: {
        code: "not-found",
        message: "코스 편집 문서를 찾을 수 없습니다.",
      },
    })
  })
})
