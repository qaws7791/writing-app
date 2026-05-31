import { describe, expect, it, vi } from "vitest"

import type { AdminService } from "@workspace/core/admin"

import { createAdminApiApp } from "@/app"
import type { AdminAuthRuntime } from "@/auth/admin-session"

const auth: AdminAuthRuntime = {
  async getSession() {
    return {
      session: { id: "session-1" },
      user: {
        email: "admin@example.com",
        id: "admin-1",
        image: null,
        name: "운영자",
      },
    }
  },
  async handler() {
    return new Response(null, { status: 204 })
  },
}

const course = {
  id: "sentence-structure",
  title: "문장 구조의 기본",
  description: "문장의 뼈대를 이해합니다.",
  sortOrder: 1,
}

const curriculum = {
  chapters: [
    {
      id: "sentence-structure-chapter-1",
      title: "문장의 뼈대",
      sortOrder: 1,
      status: "active" as const,
      lessons: [
        {
          id: "sentence-structure-course-lesson-1",
          lessonId: "sentence-structure-01",
          title: "주어와 서술어 찾기",
          description: "중심 성분을 구분합니다.",
          sortOrder: 1,
          status: "active" as const,
        },
      ],
    },
  ],
  steps: [
    {
      id: "sentence-structure-step-1",
      lessonId: "sentence-structure-01",
      type: "INTRO" as const,
      title: "도입",
      sortOrder: 1,
      points: 0,
      required: true,
      status: "active" as const,
      content: {
        title: "주어와 서술어 찾기",
        category: "문장 구조",
        tagTone: "info" as const,
        bullets: ["문장의 중심 성분을 찾습니다."],
        estimatedMinutes: 8,
        totalSteps: 1,
      },
    },
  ],
}

const editorDocument = {
  course,
  revision: 0,
  curriculum,
}

const adminService: AdminService = {
  async getCourseDetail() {
    return { status: "ok", value: course }
  },
  async getCourseEditorDocument() {
    return {
      status: "ok",
      value: editorDocument,
    }
  },
  async getCourseLessonDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-01",
        courseId: "sentence-structure",
        title: "주어와 서술어 찾기",
        categoryId: "grammar",
        unitNumber: 1,
        nextLessonId: null,
        steps: curriculum.steps,
      },
    }
  },
  async listCourses() {
    return {
      status: "ok",
      value: {
        courses: [course],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
        },
        query: "문장",
      },
    }
  },
  async listCourseTree() {
    return {
      status: "ok",
      value: {
        courses: [
          {
            ...course,
            chapters: curriculum.chapters,
          },
        ],
      },
    }
  },
  async listUsers() {
    return {
      status: "ok",
      value: {
        users: [
          {
            id: "user-1",
            name: "학습자",
            email: "learner@example.com",
            emailVerified: true,
            image: null,
            createdAt: "2026-05-27T00:00:00.000Z",
            updatedAt: "2026-05-27T00:00:00.000Z",
          },
        ],
      },
    }
  },
  async saveCurriculumContent() {
    return {
      status: "ok",
      value: curriculum,
    }
  },
  async saveCourseEditorDocument() {
    return {
      status: "ok",
      value: {
        ...editorDocument,
        revision: 1,
      },
    }
  },
}

function createTestApp(
  input?: Partial<{
    adminService: AdminService
    auth: AdminAuthRuntime
  }>
) {
  return createAdminApiApp({
    adminService: input?.adminService ?? adminService,
    auth: input?.auth ?? auth,
    async checkDatabase() {
      return true
    },
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
  })
}

describe("admin api app", () => {
  it("returns protected paginated courses", async () => {
    const response = await createTestApp().request(
      "/courses?page=1&pageSize=10&query=%EB%AC%B8%EC%9E%A5"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [course],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
      query: "문장",
    })
  })

  it("returns a protected course tree", async () => {
    const response = await createTestApp().request(
      "/courses?include=chapters,lessons"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      courses: [
        {
          ...course,
          chapters: curriculum.chapters,
        },
      ],
    })
  })

  it("returns protected users", async () => {
    const response = await createTestApp().request("/users")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      users: [
        {
          id: "user-1",
          email: "learner@example.com",
        },
      ],
    })
  })

  it("returns the current admin session without listing users", async () => {
    const listUsers = vi.fn(adminService.listUsers)
    const response = await createTestApp({
      adminService: {
        ...adminService,
        listUsers,
      },
    }).request("/session")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      session: { id: "session-1" },
      user: {
        email: "admin@example.com",
        id: "admin-1",
        image: null,
        name: "운영자",
      },
    })
    expect(listUsers).not.toHaveBeenCalled()
  })

  it("returns protected course detail for the editor", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(course)
  })

  it("returns the direct current curriculum editor document", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/editor"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(editorDocument)
  })

  it("returns protected lesson detail without a curriculum version query", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/lessons/sentence-structure-01"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-01",
      courseId: "sentence-structure",
      steps: [
        {
          id: "sentence-structure-step-1",
          content: {
            title: "주어와 서술어 찾기",
          },
        },
      ],
    })
  })

  it("saves protected course editor document", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/editor",
      {
        body: JSON.stringify({
          courseId: "sentence-structure",
          expectedRevision: 0,
          course: {
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            sortOrder: 1,
          },
          chapters: [],
          lessons: [],
          steps: [],
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ...editorDocument,
      revision: 1,
    })
  })

  it("rejects course editor save body that does not match route params", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/editor",
      {
        body: JSON.stringify({
          courseId: "another-course",
          expectedRevision: 0,
          course: {
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            sortOrder: 1,
          },
          chapters: [],
          lessons: [],
          steps: [],
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PUT",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "경로 매개변수와 요청 본문이 일치해야 합니다.",
    })
  })

  it("maps current curriculum save validation errors to bad request", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async saveCourseEditorDocument() {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "커리큘럼 저장 요청이 올바르지 않습니다.",
            },
          }
        },
      },
    }).request("/courses/sentence-structure/editor", {
      body: JSON.stringify({
        courseId: "sentence-structure",
        expectedRevision: 0,
        course: {
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          sortOrder: 1,
        },
        chapters: [],
        lessons: [],
        steps: [],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "커리큘럼 저장 요청이 올바르지 않습니다.",
    })
  })

  it("maps stale course editor saves to conflict", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async saveCourseEditorDocument() {
          return {
            status: "conflict",
            error: {
              code: "conflict",
              message: "다른 관리자가 먼저 저장했습니다.",
            },
          }
        },
      },
    }).request("/courses/sentence-structure/editor", {
      body: JSON.stringify({
        courseId: "sentence-structure",
        expectedRevision: 0,
        course: {
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          sortOrder: 1,
        },
        chapters: [],
        lessons: [],
        steps: [],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "conflict",
      message: "다른 관리자가 먼저 저장했습니다.",
    })
  })

  it("rejects unauthenticated admin route access", async () => {
    const response = await createTestApp({
      auth: {
        ...auth,
        async getSession() {
          return null
        },
      },
    }).request("/users")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "unauthorized",
      message: "관리자 로그인이 필요합니다.",
    })
  })

  it("rejects unauthenticated admin session access", async () => {
    const response = await createTestApp({
      auth: {
        ...auth,
        async getSession() {
          return null
        },
      },
    }).request("/session")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "unauthorized",
      message: "관리자 로그인이 필요합니다.",
    })
  })

  it("rejects invalid course list pagination query", async () => {
    const response = await createTestApp().request(
      "/courses?page=0&pageSize=15"
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message:
        "page must be positive and pageSize must be one of 10,20,30,40,50.",
    })
  })

  it("returns the Admin API OpenAPI document without version routes", async () => {
    const response = await createTestApp().request("/openapi.json")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document.info).toMatchObject({
      title: "Writing App Admin API",
      version: "0.0.1",
    })
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).toHaveProperty("/session")
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document.paths).toHaveProperty("/courses/{courseId}/editor")
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/lessons/{lessonId}"
    )
    expect(document.paths).toHaveProperty("/users")
    expect(document.paths).not.toHaveProperty(
      "/courses/{courseId}/curriculum-versions"
    )
    expect(document.paths).not.toHaveProperty(
      "/curriculum-versions/{versionId}"
    )
    expect(document.paths).not.toHaveProperty("/curriculum-migrations")
  })
})
