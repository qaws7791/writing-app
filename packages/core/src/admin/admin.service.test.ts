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
              status: "active",
              lessons: [
                {
                  id: "sentence-structure-lesson-1",
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
    }
  },
  async listCourses() {
    return {
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
    }
  },
  async listCurriculumVersions() {
    return {
      versions: [
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
    }
  },
  async createCurriculumDraft() {
    return {
      status: "created",
      version: {
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
      id: "sentence-structure-v2",
      courseId: "sentence-structure",
      versionNumber: 2,
      status: "draft",
      title: "문장 구조의 기본",
      changelog: "Draft from v1",
      publishedAt: null,
      createdAt: "2026-05-28T00:00:00.000Z",
      chapters: [],
    }
  },
  async publishCurriculumVersion() {
    return {
      status: "published",
      version: {
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
      status: "created",
      migration: {
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
    }
  },
  async applyCurriculumMigration() {
    return {
      status: "applied",
      application: {
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
        courses: [
          {
            id: "sentence-structure",
            thumbnailPath: "/course-thumbnails/sentence-structure.png",
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
                lessons: [
                  { lessonId: "sentence-structure-01", status: "active" },
                ],
                status: "active",
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

  it("returns unavailable when course tree repository returns an invalid node status", async () => {
    const invalidNodeStatus: "active" = JSON.parse('"deleted"')
    const invalidStatusRepository = {
      ...repository,
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
                  status: invalidNodeStatus,
                  lessons: [],
                },
              ],
            },
          ],
        }
      },
    }
    const service = createAdminService({
      repository: invalidStatusRepository,
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

  it("returns course detail for the editor", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async getCourseDetail() {
          return {
            id: "sentence-structure",
            title: "기초 문장 만들기",
            description: "문장의 뼈대를 세웁니다.",
            thumbnailPath: "/course-thumbnails/sentence.png",
            sortOrder: 1,
          }
        },
      },
    })

    await expect(
      service.getCourseDetail("sentence-structure")
    ).resolves.toEqual({
      status: "ok",
      value: {
        id: "sentence-structure",
        title: "기초 문장 만들기",
        description: "문장의 뼈대를 세웁니다.",
        thumbnailPath: "/course-thumbnails/sentence.png",
        sortOrder: 1,
      },
    })
  })

  it("maps save draft content conflicts", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
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
    })

    await expect(
      service.saveCurriculumVersionContent({
        courseId: "sentence-structure",
        versionId: "sentence-structure-v2",
        baseRevision: 1,
        course: {
          title: "기초 문장 만들기",
          description: "문장의 뼈대를 세웁니다.",
          thumbnailPath: "/course-thumbnails/sentence.png",
          sortOrder: 1,
        },
        chapters: [],
        lessons: [],
        steps: [],
      })
    ).resolves.toEqual({
      status: "conflict",
      error: {
        code: "conflict",
        message: "Curriculum version has changed.",
      },
    })
  })

  it("returns curriculum versions for a course", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.listCurriculumVersions("sentence-structure")
    ).resolves.toEqual({
      status: "ok",
      value: {
        versions: [
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
    })
  })

  it("creates a curriculum draft", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.createCurriculumDraft("sentence-structure")
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        status: "draft",
        versionNumber: 2,
      },
    })
  })

  it("preserves invalid draft creation requests", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
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
    })

    await expect(
      service.createCurriculumDraft("sentence-structure")
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Draft curriculum version already exists.",
      },
    })
  })

  it("returns a curriculum version detail", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.getCurriculumVersionDetail("sentence-structure-v2")
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        status: "draft",
        chapters: [],
      },
    })
  })

  it("returns not found when curriculum version detail is missing", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async getCurriculumVersionDetail() {
          return undefined
        },
      },
    })

    await expect(
      service.getCurriculumVersionDetail("missing-version")
    ).resolves.toEqual({
      status: "not-found",
      error: {
        code: "not-found",
        message: "Curriculum version was not found.",
      },
    })
  })

  it("publishes a curriculum draft", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.publishCurriculumVersion("sentence-structure-v2")
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "sentence-structure-v2",
        status: "published",
        publishedAt: "2026-05-28T00:00:00.000Z",
      },
    })
  })

  it("preserves invalid publish requests", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async publishCurriculumVersion() {
          return {
            status: "invalid-request",
            error: {
              code: "invalid-request",
              message: "Only draft curriculum versions can be published.",
            },
          }
        },
      },
    })

    await expect(
      service.publishCurriculumVersion("sentence-structure-v1")
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Only draft curriculum versions can be published.",
      },
    })
  })

  it("creates a curriculum migration map", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.createCurriculumMigration({
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "equivalent",
          },
        ],
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "sentence-structure-v1-to-sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            mappingType: "equivalent",
            toLessonId: "sentence-structure-01",
          },
        ],
      },
    })
  })

  it("returns a curriculum migration map", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.getCurriculumMigration(
        "sentence-structure-v1-to-sentence-structure-v2"
      )
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        id: "sentence-structure-v1-to-sentence-structure-v2",
        status: "active",
        mappings: [{ mappingType: "equivalent" }],
      },
    })
  })

  it("returns not found when a curriculum migration map is missing", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
        async getCurriculumMigration() {
          return undefined
        },
      },
    })

    await expect(service.getCurriculumMigration("missing")).resolves.toEqual({
      status: "not-found",
      error: {
        code: "not-found",
        message: "Curriculum migration was not found.",
      },
    })
  })

  it("applies a curriculum migration to a learner", async () => {
    const service = createAdminService({ repository })

    await expect(
      service.applyCurriculumMigration({
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        userId: "user-1",
      })
    ).resolves.toMatchObject({
      status: "ok",
      value: {
        migrationId: "sentence-structure-v1-to-sentence-structure-v2",
        userId: "user-1",
        completedLessonIds: ["sentence-structure-01"],
        completedLessonCount: 1,
      },
    })
  })

  it("preserves invalid curriculum migration requests", async () => {
    const service = createAdminService({
      repository: {
        ...repository,
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
    })

    await expect(
      service.createCurriculumMigration({
        fromVersionId: "sentence-structure-v1",
        toVersionId: "sentence-structure-v2",
        mappings: [
          {
            fromLessonId: "sentence-structure-01",
            toLessonId: "sentence-structure-01",
            mappingType: "removed",
          },
        ],
      })
    ).resolves.toEqual({
      status: "invalid-request",
      error: {
        code: "invalid-request",
        message: "Removed mappings must not include a target lesson.",
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
