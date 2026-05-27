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

const adminService: AdminService = {
  async listCourses() {
    return {
      status: "ok",
      value: {
        courses: [
          {
            id: "sentence-structure",
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            thumbnailPath: "/course-thumbnails/sentence-structure.png",
            sortOrder: 1,
          },
        ],
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
            id: "sentence-structure",
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            sortOrder: 1,
            chapters: [
              {
                id: "sentence-structure-chapter-1",
                label: "1단원",
                title: "문장의 뼈대",
                sortOrder: 1,
                lessons: [
                  {
                    id: "sentence-structure-01",
                    lessonId: "sentence-structure-01",
                    title: "주어와 서술어 찾기",
                    description: "중심 성분을 구분합니다.",
                    sortOrder: 1,
                  },
                ],
              },
            ],
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
}

function createTestApp(input?: Partial<{ auth: AdminAuthRuntime }>) {
  return createAdminApiApp({
    adminService,
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
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          thumbnailPath: "/course-thumbnails/sentence-structure.png",
          sortOrder: 1,
        },
      ],
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
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
          sortOrder: 1,
          chapters: [
            {
              id: "sentence-structure-chapter-1",
              label: "1단원",
              title: "문장의 뼈대",
              sortOrder: 1,
              lessons: [
                {
                  id: "sentence-structure-01",
                  lessonId: "sentence-structure-01",
                  title: "주어와 서술어 찾기",
                  description: "중심 성분을 구분합니다.",
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("returns protected users", async () => {
    const response = await createTestApp().request("/users")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
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
      message: "Admin authentication is required.",
    })
  })

  it.each(["/courses?include=chapters"])(
    "rejects invalid course include query: %s",
    async (path) => {
      const response = await createTestApp().request(path)

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        code: "invalid-request",
        message: "include must be chapters,lessons.",
      })
    }
  )

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

  it("returns the Admin API OpenAPI document", async () => {
    const response = await createTestApp().request("/openapi.json")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document.info).toMatchObject({
      title: "Writing App Admin API",
      version: "0.0.1",
    })
    expect(document.paths).toHaveProperty("/courses")
    expect(document.paths).toHaveProperty("/users")
  })
})
