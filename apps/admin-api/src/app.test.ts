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
  async getCourseDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure",
        title: "문장 구조의 기본",
        description: "문장의 뼈대를 이해합니다.",
        thumbnailPath: "/course-thumbnails/sentence-structure.png",
        sortOrder: 1,
      },
    }
  },
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
                status: "active",
                lessons: [
                  {
                    id: "sentence-structure-01",
                    lessonId: "sentence-structure-01",
                    title: "주어와 서술어 찾기",
                    description: "중심 성분을 구분합니다.",
                    sortOrder: 1,
                    status: "active",
                  },
                ],
              },
            ],
          },
        ],
      },
    }
  },
  async listCurriculumVersions() {
    return {
      status: "ok",
      value: {
        versions: [
          {
            id: "sentence-structure-v2",
            courseId: "sentence-structure",
            versionNumber: 2,
            status: "draft",
            title: "문장 구조의 기본",
            changelog: "Draft from v1",
            publishedAt: null,
            createdAt: "2026-05-28T00:00:00.000Z",
          },
          {
            id: "sentence-structure-v1",
            courseId: "sentence-structure",
            versionNumber: 1,
            status: "published",
            title: "문장 구조의 기본",
            changelog: "초기 버전",
            publishedAt: "2026-05-28T00:00:00.000Z",
            createdAt: "2026-05-28T00:00:00.000Z",
          },
        ],
      },
    }
  },
  async createCurriculumDraft() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
      },
    }
  },
  async getCurriculumVersionDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        chapters: [],
      },
    }
  },
  async getCourseCurriculumVersionDetail() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 2,
        chapters: [
          {
            id: "sentence-structure-chapter-1",
            label: "1단원",
            title: "문장의 뼈대",
            sortOrder: 1,
            status: "active",
            lessons: [
              {
                id: "sentence-structure-01",
                lessonId: "sentence-structure-01",
                title: "주어와 서술어 찾기",
                description: "중심 성분을 구분합니다.",
                sortOrder: 1,
                status: "active",
              },
            ],
          },
        ],
        steps: [
          {
            id: "sentence-structure-step-1",
            lessonId: "sentence-structure-01",
            type: "INTRO",
            title: "도입",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {
              body: "문장의 중심 성분을 찾습니다.",
            },
          },
        ],
      },
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
        steps: [
          {
            id: "sentence-structure-step-1",
            lessonId: "sentence-structure-01",
            type: "INTRO",
            title: "도입",
            sortOrder: 1,
            points: 0,
            required: true,
            status: "active",
            content: {
              body: "문장의 중심 성분을 찾습니다.",
            },
          },
        ],
      },
    }
  },
  async restoreCurriculumDraft() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v3",
        courseId: "sentence-structure",
        versionNumber: 3,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Restored from v1",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
      },
    }
  },
  async saveCurriculumVersionContent() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "draft",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        revision: 3,
        chapters: [],
        steps: [],
      },
    }
  },
  async discardCurriculumVersion() {
    return {
      status: "ok",
      value: {
        versionId: "sentence-structure-v2",
      },
    }
  },
  async publishCurriculumVersion() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        courseId: "sentence-structure",
        versionNumber: 2,
        status: "published",
        title: "문장 구조의 기본",
        changelog: "Draft from v1",
        publishedAt: "2026-05-28T00:00:00.000Z",
        createdAt: "2026-05-28T00:00:00.000Z",
      },
    }
  },
  async createCurriculumMigration() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v1-to-sentence-structure-v2",
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        status: "active",
        createdAt: "2026-05-28T00:00:00.000Z",
        mappings: [
          {
            id: "sentence-structure-v1-to-sentence-structure-v2-1",
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "equivalent",
          },
        ],
      },
    }
  },
  async getCurriculumMigration() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v1-to-sentence-structure-v2",
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        status: "active",
        createdAt: "2026-05-28T00:00:00.000Z",
        mappings: [
          {
            id: "sentence-structure-v1-to-sentence-structure-v2-1",
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "equivalent",
          },
        ],
      },
    }
  },
  async applyCurriculumMigration() {
    return {
      status: "ok",
      value: {
        id: "sentence-structure-v1-to-sentence-structure-v2-user-1",
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        userId: "user-1",
        courseId: "sentence-structure",
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        status: "completed",
        completedLessonCount: 1,
        completedLessonIds: ["sentence-structure-01"],
        preservedLessonIds: [],
        skippedLessonIds: [],
        errorMessage: null,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:00:00.000Z",
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

function createTestApp(
  input?: Partial<{ adminService: AdminService; auth: AdminAuthRuntime }>
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
              status: "active",
              lessons: [
                {
                  id: "sentence-structure-01",
                  lessonId: "sentence-structure-01",
                  title: "주어와 서술어 찾기",
                  description: "중심 성분을 구분합니다.",
                  sortOrder: 1,
                  status: "active",
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

  it("returns protected curriculum versions for a course", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum-versions"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      versions: [
        {
          id: "sentence-structure-v2",
          courseId: "sentence-structure",
          versionNumber: 2,
          status: "draft",
          title: "문장 구조의 기본",
          changelog: "Draft from v1",
          publishedAt: null,
          createdAt: "2026-05-28T00:00:00.000Z",
        },
        {
          id: "sentence-structure-v1",
          courseId: "sentence-structure",
          versionNumber: 1,
          status: "published",
          title: "문장 구조의 기본",
          changelog: "초기 버전",
          publishedAt: "2026-05-28T00:00:00.000Z",
          createdAt: "2026-05-28T00:00:00.000Z",
        },
      ],
    })
  })

  it("returns protected restful curriculum versions for a course", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        versions: expect.arrayContaining([
          expect.objectContaining({
            id: "sentence-structure-v2",
            status: "draft",
          }),
        ]),
      })
    )
  })

  it("creates a protected curriculum draft", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum-versions",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      status: "draft",
    })
  })

  it("creates a protected curriculum draft through the explicit draft action", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/drafts",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      status: "draft",
    })
  })

  it("returns protected curriculum version detail", async () => {
    const response = await createTestApp().request(
      "/curriculum-versions/sentence-structure-v2"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "draft",
      title: "문장 구조의 기본",
      changelog: "Draft from v1",
      publishedAt: null,
      createdAt: "2026-05-28T00:00:00.000Z",
      chapters: [],
    })
  })

  it("returns protected course detail for the editor", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      id: "sentence-structure",
      title: "문장 구조의 기본",
      description: "문장의 뼈대를 이해합니다.",
      thumbnailPath: "/course-thumbnails/sentence-structure.png",
      sortOrder: 1,
    })
  })

  it("returns protected course curriculum version detail for the editor", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      revision: 2,
      chapters: [
        {
          id: "sentence-structure-chapter-1",
          lessons: [{ lessonId: "sentence-structure-01" }],
        },
      ],
      steps: [
        {
          id: "sentence-structure-step-1",
          type: "INTRO",
          content: {
            body: "문장의 중심 성분을 찾습니다.",
          },
        },
      ],
    })
  })

  it("returns protected lesson detail for a selected curriculum version", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/lessons/sentence-structure-01?version=sentence-structure-v2"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-01",
      courseId: "sentence-structure",
      steps: [
        {
          id: "sentence-structure-step-1",
          content: {
            body: "문장의 중심 성분을 찾습니다.",
          },
        },
      ],
    })
  })

  it("rejects lesson detail without a curriculum version query", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/lessons/sentence-structure-01"
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "version query is required.",
    })
  })

  it("publishes a protected curriculum draft", async () => {
    const response = await createTestApp().request(
      "/curriculum-versions/sentence-structure-v2/publish",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      status: "published",
      publishedAt: "2026-05-28T00:00:00.000Z",
    })
  })

  it("publishes a protected curriculum draft through the course-scoped action", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2/publish",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      status: "published",
    })
  })

  it("restores a protected curriculum draft through the explicit restore action", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/restores",
      {
        body: JSON.stringify({
          sourceVersionId: "sentence-structure-v1",
          replaceDraft: true,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v3",
      status: "draft",
    })
  })

  it("saves protected curriculum version content", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2/content",
      {
        body: JSON.stringify({
          courseId: "sentence-structure",
          versionId: "sentence-structure-v2",
          baseRevision: 2,
          course: {
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            thumbnailPath: "/course-thumbnails/sentence-structure.png",
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
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v2",
      revision: 3,
    })
  })

  it("discards a protected curriculum draft through the explicit discard action", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2/discard",
      {
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      versionId: "sentence-structure-v2",
    })
  })

  it("maps invalid curriculum draft creation to bad request", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async createCurriculumDraft() {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "Draft curriculum version already exists.",
            },
          }
        },
      },
    }).request("/courses/sentence-structure/curriculum-versions", {
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Draft curriculum version already exists.",
    })
  })

  it("rejects invalid curriculum restore body", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/restores",
      {
        body: JSON.stringify({
          sourceVersionId: "",
          replaceDraft: true,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Curriculum restore request body is invalid.",
    })
  })

  it("maps curriculum save conflicts to conflict", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async saveCurriculumVersionContent() {
          return {
            status: "conflict",
            error: {
              code: "conflict",
              message: "Curriculum version has changed.",
            },
          }
        },
      },
    }).request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2/content",
      {
        body: JSON.stringify({
          courseId: "sentence-structure",
          versionId: "sentence-structure-v2",
          baseRevision: 2,
          course: {
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            thumbnailPath: "/course-thumbnails/sentence-structure.png",
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

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "conflict",
      message: "Curriculum version has changed.",
    })
  })

  it("rejects curriculum save body that does not match route params", async () => {
    const response = await createTestApp().request(
      "/courses/sentence-structure/curriculum/versions/sentence-structure-v2/content",
      {
        body: JSON.stringify({
          courseId: "another-course",
          versionId: "sentence-structure-v2",
          baseRevision: 2,
          course: {
            title: "문장 구조의 기본",
            description: "문장의 뼈대를 이해합니다.",
            thumbnailPath: "/course-thumbnails/sentence-structure.png",
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
      message: "Route params must match request body.",
    })
  })

  it("maps missing curriculum versions to not found", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async getCurriculumVersionDetail() {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum version was not found.",
            },
          }
        },
      },
    }).request("/curriculum-versions/missing-version")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "not-found",
      message: "Curriculum version was not found.",
    })
  })

  it("creates a protected curriculum migration map", async () => {
    const response = await createTestApp().request("/curriculum-migrations", {
      body: JSON.stringify({
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "equivalent",
          },
        ],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v1-to-sentence-structure-v2",
      mappings: [{ mappingType: "equivalent" }],
    })
  })

  it("returns a protected curriculum migration map", async () => {
    const response = await createTestApp().request(
      "/curriculum-migrations/sentence-structure-v1-to-sentence-structure-v2"
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "sentence-structure-v1-to-sentence-structure-v2",
      status: "active",
    })
  })

  it("applies a protected curriculum migration map", async () => {
    const response = await createTestApp().request(
      "/curriculum-migrations/sentence-structure-v1-to-sentence-structure-v2/apply",
      {
        body: JSON.stringify({ userId: "user-1" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      completedLessonCount: 1,
      completedLessonIds: ["sentence-structure-01"],
      userId: "user-1",
    })
  })

  it("maps invalid curriculum migration creation to bad request", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async createCurriculumMigration() {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "Removed mappings must not include a target lesson.",
            },
          }
        },
      },
    }).request("/curriculum-migrations", {
      body: JSON.stringify({
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "removed",
          },
        ],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "invalid-request",
      message: "Removed mappings must not include a target lesson.",
    })
  })

  it("maps missing curriculum migrations to not found", async () => {
    const response = await createTestApp({
      adminService: {
        ...adminService,
        async getCurriculumMigration() {
          return {
            status: "not-found",
            error: {
              code: "not-found",
              message: "Curriculum migration was not found.",
            },
          }
        },
      },
    }).request("/curriculum-migrations/missing-migration")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "not-found",
      message: "Curriculum migration was not found.",
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
    expect(document.paths).toHaveProperty("/courses/{courseId}")
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum-versions"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/versions"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/drafts"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/restores"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/versions/{versionId}"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/versions/{versionId}/content"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/versions/{versionId}/publish"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/curriculum/versions/{versionId}/discard"
    )
    expect(document.paths).toHaveProperty(
      "/courses/{courseId}/lessons/{lessonId}"
    )
    expect(document.paths).toHaveProperty("/curriculum-versions/{versionId}")
    expect(document.paths).toHaveProperty(
      "/curriculum-versions/{versionId}/publish"
    )
    expect(document.paths).toHaveProperty("/curriculum-migrations")
    expect(document.paths).toHaveProperty(
      "/curriculum-migrations/{migrationId}"
    )
    expect(document.paths).toHaveProperty(
      "/curriculum-migrations/{migrationId}/apply"
    )
    expect(document.paths).toHaveProperty("/users")
  })
})
