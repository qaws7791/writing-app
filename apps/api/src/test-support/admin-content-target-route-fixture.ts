import { adminIdSchema } from "@workspace/contracts/admin"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  adminCourseDetailDtoSchema,
  adminCourseEditorDocumentSchema,
} from "@workspace/contracts/admin/content-data"
import { adminRoles } from "@workspace/core/admin"
import type { AdminCourseUseCase } from "@workspace/core/content"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/auth/admin/server"
import { createAdminApp } from "@/http/admin-app"
import { createAdminContentRoutes } from "@/modules/admin-content/admin-content.routes"

export type AdminContentTargetRouteFixtureJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminContentTargetRouteFixtureJson[]
  | { readonly [key: string]: AdminContentTargetRouteFixtureJson }

export type AdminContentTargetRouteFixture = {
  readonly fetch: (request: Request) => Promise<Response> | Response
  readonly readEffectJournal: () => readonly AdminContentTargetRouteFixtureJson[]
}

const fixtureNow = new Date("2026-06-14T03:00:00.000Z")
const courseDetail = adminCourseDetailDtoSchema.parse({
  category: "미분류",
  curriculumVersionId: "course-1-v1",
  description: "강의 설명",
  editVersion: 3,
  id: "course-1",
  revision: 1,
  status: "active",
  title: "코스 1",
  units: [],
})
const courseEditorDocument = adminCourseEditorDocumentSchema.parse({
  category: "미분류",
  curriculumVersionId: "course-1-v1",
  description: "강의 설명",
  editVersion: 3,
  id: "course-1",
  revision: 1,
  status: "active",
  title: "코스 1",
  units: [
    {
      id: "course-1-unit-1",
      lessons: [
        {
          category: "미분류",
          description: "레슨 설명",
          estimatedMinutes: 5,
          id: "course-1-lesson-1",
          sortOrder: 1,
          status: "active",
          steps: [
            {
              body: "본문",
              guide: "",
              id: "course-1-step-1",
              sortOrder: 1,
              status: "active",
              title: "읽기",
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
})

export function createAdminContentTargetRouteFixture(
  scenario: string
): AdminContentTargetRouteFixture {
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(scenario)
  const app = createAdminApp({
    capabilityRoutes: createAdminContentRoutes({
      courseService: createCourseService(journal),
      now: () => fixtureNow,
      sessionResolver,
    }),
    sessionResolver,
  })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createCourseService(
  journal: ReturnType<typeof createEffectJournal>
): AdminCourseUseCase {
  return {
    async archiveCourse(input) {
      journal.record("courses.archive", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        courseId: input.courseId,
      })

      return input.courseId === "missing"
        ? { kind: "not-found" }
        : { kind: "ok" }
    },
    async createCourse(input) {
      journal.record("courses.create", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        now: input.now.toISOString(),
      })

      return { kind: "ok", value: courseDetail }
    },
    async getCourseEditor(input) {
      journal.record("courses.editor.read", {
        courseId: input.courseId,
      })

      return input.courseId === "missing" ? null : courseEditorDocument
    },
    async getCourses(input) {
      journal.record("courses.list", {
        category: input.category,
        page: input.page,
        pageSize: input.pageSize,
        query: input.query,
        status: input.status,
      })

      return {
        items: [
          {
            category: "미분류",
            id: "course-1",
            lessonCount: 1,
            revision: 1,
            status: "active",
            title: "코스 1",
            unitCount: 1,
            visualKey: "basic-sentence-writing",
          },
        ],
        page: input.page,
        pageSize: input.pageSize,
        totalItems: 1,
        totalPages: 1,
      }
    },
    async publishCourse(input) {
      journal.record("courses.publish", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        courseId: input.courseId,
        expectedEditVersion: input.expectedEditVersion,
        now: input.now.toISOString(),
      })

      if (input.courseId === "unpublishable") return { kind: "invalid-draft" }
      if (input.expectedEditVersion !== courseEditorDocument.editVersion) {
        return { kind: "stale-revision" }
      }

      return {
        kind: "ok",
        value: {
          curriculumVersionId: courseEditorDocument.curriculumVersionId,
          publishedAt: fixtureNow.toISOString(),
          revision: courseEditorDocument.revision,
        },
      }
    },
    async saveCourseEditor(input) {
      journal.record("courses.editor.save", {
        actor: {
          id: input.actor.id,
          role: input.actor.role,
        },
        courseId: input.courseId,
        expectedEditVersion: input.expectedEditVersion,
        now: input.now.toISOString(),
      })

      if (input.expectedEditVersion !== courseEditorDocument.editVersion) {
        return { kind: "stale-revision" }
      }

      return {
        kind: "ok",
        value: {
          ...input.document,
          editVersion: input.document.editVersion + 1,
        },
      }
    },
  }
}

function createSessionResolver(scenario: string): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: readScenarioRole(scenario),
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readScenarioRole(scenario: string) {
  if (scenario === "owner") return adminRoles.owner
  if (scenario === "operator") return adminRoles.operator

  throw new Error(
    `지원하지 않는 target admin content scenario입니다: ${scenario}`
  )
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

function createEffectJournal() {
  const entries: AdminContentTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    record(effect: string, input: AdminContentTargetRouteFixtureJson) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
    read() {
      return entries
    },
  }
}
