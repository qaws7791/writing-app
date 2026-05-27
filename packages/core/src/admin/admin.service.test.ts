import { describe, expect, it } from "vitest"

import { createAdminService } from "@/admin/admin.service"
import type { AdminRepository } from "@/admin/admin.repository"

const repository: AdminRepository = {
  async listCourseTree() {
    return {
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
                  id: "sentence-structure-lesson-1",
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
    }
  },
  async listCourses() {
    return {
      courses: [
        {
          id: "sentence-structure",
          title: "문장 구조의 기본",
          description: "문장의 뼈대를 이해합니다.",
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
    }
  },
  async listUsers() {
    return {
      users: [
        {
          id: "user-1",
          name: "학습자",
          email: "user@example.com",
          emailVerified: true,
          image: null,
          createdAt: "2026-05-27T00:00:00.000Z",
          updatedAt: "2026-05-27T00:00:00.000Z",
        },
      ],
    }
  },
}

describe("createAdminService", () => {
  it("returns paginated courses", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.listCourses({ page: 1, pageSize: 10, query: "문장" })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        courses: [{ id: "sentence-structure" }],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
        },
        query: "문장",
      },
    })
  })

  it("returns a course tree", async () => {
    const service = createAdminService({ repository })

    await expect(service.listCourseTree()).resolves.toMatchObject({
      status: "ok",
      value: {
        courses: [
          {
            id: "sentence-structure",
            chapters: [
              {
                lessons: [{ lessonId: "sentence-structure-01" }],
              },
            ],
          },
        ],
      },
    })
  })

  it("returns unavailable when course tree repository throws", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async listCourseTree() {
          throw new Error("database unavailable")
        },
      },
    })

    await expect(service.listCourseTree()).resolves.toMatchObject({
      status: "unavailable",
      error: {
        code: "database-unavailable",
      },
    })
  })

  it("returns basic users", async () => {
    const service = createAdminService({ repository })

    await expect(service.listUsers()).resolves.toMatchObject({
      status: "ok",
      value: {
        users: [{ email: "user@example.com" }],
      },
    })
  })

  it("returns unavailable when user repository returns invalid email", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async listUsers() {
          return {
            users: [
              {
                id: "user-1",
                name: "학습자",
                email: "invalid-email",
                emailVerified: true,
                image: null,
                createdAt: "2026-05-27T00:00:00.000Z",
                updatedAt: "2026-05-27T00:00:00.000Z",
              },
            ],
          }
        },
      },
    })

    await expect(service.listUsers()).resolves.toMatchObject({
      status: "unavailable",
      error: {
        code: "database-unavailable",
      },
    })
  })

  it("returns unavailable when user repository returns invalid datetime", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async listUsers() {
          return {
            users: [
              {
                id: "user-1",
                name: "학습자",
                email: "user@example.com",
                emailVerified: true,
                image: null,
                createdAt: "not-a-datetime",
                updatedAt: "2026-05-27T00:00:00.000Z",
              },
            ],
          }
        },
      },
    })

    await expect(service.listUsers()).resolves.toMatchObject({
      status: "unavailable",
      error: {
        code: "database-unavailable",
      },
    })
  })
})
