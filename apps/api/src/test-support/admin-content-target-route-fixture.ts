import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import type { ContentApplication } from "@workspace/content/application"
import type {
  ContentAdminSessionPort,
  CourseEditorDocument,
} from "@workspace/content/ports"
import { createAdminContentRoutes } from "@workspace/content/http"
import { adminRoles } from "@workspace/identity/admin-actor"
import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { err, ok } from "@workspace/kernel/result"

import { createAdminApp } from "@/http/admin-app"

type AdminContentTargetRouteFixtureJson =
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
const courseId = courseIdSchema.parse("course-1")
const curriculumVersionId = curriculumVersionIdSchema.parse("course-1-v1")
const courseEditorDocument: CourseEditorDocument = {
  category: "미분류",
  courseId,
  curriculumVersionId,
  description: "강의 설명",
  editVersion: 3,
  revision: 1,
  title: "코스 1",
  units: [
    {
      id: unitIdSchema.parse("course-1-unit-1"),
      lessons: [
        {
          category: "미분류",
          description: "레슨 설명",
          estimatedMinutes: 5,
          id: lessonIdSchema.parse("course-1-lesson-1"),
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
              id: lessonStepIdSchema.parse("course-1-step-1"),
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

export function createAdminContentTargetRouteFixture(
  scenario: string
): AdminContentTargetRouteFixture {
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver(scenario)
  const app = createAdminApp({
    capabilityRoutes: createAdminContentRoutes({
      application: createContentApplication(journal),
      sessionPort: createContentSessionPort(sessionResolver),
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

function createContentApplication(
  journal: ReturnType<typeof createEffectJournal>
): ContentApplication {
  return {
    async archiveCourse(command) {
      journal.record("courses.archive", {
        actor: toJournalActor(command.actor),
        courseId: command.courseId,
      })
      return command.courseId === "missing"
        ? err({ kind: "content-not-found" })
        : ok(undefined)
    },
    async createCourse(actor) {
      journal.record("courses.create", {
        actor: toJournalActor(actor),
        now: fixtureNow.toISOString(),
      })
      return ok(courseEditorDocument)
    },
    async getCourseEditor(requestedCourseId) {
      journal.record("courses.editor.read", { courseId: requestedCourseId })
      return requestedCourseId === "missing" ? null : courseEditorDocument
    },
    async getCourses(input) {
      journal.record("courses.list", input)
      return {
        items: [
          {
            category: "미분류",
            id: courseId,
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
    async publishCourse(command) {
      journal.record("courses.publish", {
        actor: toJournalActor(command.actor),
        courseId: command.courseId,
        expectedEditVersion: command.expectedEditVersion,
        now: fixtureNow.toISOString(),
      })
      if (command.courseId === "unpublishable") {
        return err({
          kind: "content-validation-failed",
          reason: "empty-unit",
        })
      }
      if (command.expectedEditVersion !== courseEditorDocument.editVersion) {
        return err({ kind: "content-conflict" })
      }
      return ok({
        curriculumVersionId,
        publishedAt: fixtureNow,
        revision: 1,
      })
    },
    async resetContent(command) {
      journal.record("content.reset", {
        actor: toJournalActor(command.actor),
        now: fixtureNow.toISOString(),
      })
      return ok({
        changed: {
          archived: 0,
          courses: 5,
          lessons: 44,
          steps: 136,
          units: 15,
        },
        revision: 1,
      })
    },
    async saveCourseEditor(command) {
      journal.record("courses.editor.save", {
        actor: toJournalActor(command.actor),
        courseId: command.document.courseId,
        expectedEditVersion: command.expectedEditVersion,
        now: fixtureNow.toISOString(),
      })
      if (command.expectedEditVersion !== courseEditorDocument.editVersion) {
        return err({ kind: "content-conflict" })
      }
      return ok({
        ...command.document,
        editVersion: command.document.editVersion + 1,
      })
    },
  }
}

function createContentSessionPort(
  sessionResolver: AdminSessionResolver
): ContentAdminSessionPort {
  return {
    async resolveActor(headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      return {
        adminId: session.admin.id,
        mutation:
          session.admin.role === adminRoles.owner ? "allowed" : "forbidden",
      }
    },
  }
}

function toJournalActor(
  actor: Parameters<ContentApplication["createCourse"]>[0]
): AdminContentTargetRouteFixtureJson {
  return {
    id: actor.adminId,
    role: actor.mutation === "allowed" ? "owner" : "operator",
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
