import { describe, expect, it } from "vitest"
import { adminIdSchema } from "@workspace/contracts/admin"

import { createApp, type AdminApiDependencies } from "@/app"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import {
  createTestAdminApiDependencies,
  testAdminNow,
} from "@/routes/test-dependencies"
import type {
  AdminArchiveCourseResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
} from "@workspace/contracts/admin"
import type { AdminRole } from "@workspace/core/admin"
import { adminRoles } from "@workspace/core/admin"

const courseDetail: AdminCourseDetailDto = {
  category: "미분류",
  description: "강의 설명을 입력하세요.",
  id: "cmock",
  revision: 1,
  status: "active",
  title: "새 강의",
  units: [
    {
      id: "cmock-u1",
      lessons: [
        {
          category: "미분류",
          description: "레슨 설명을 입력하세요.",
          estimatedMinutes: 5,
          id: "cmock-l1",
          sortOrder: 1,
          status: "active",
          summary: [],
          steps: [
            {
              contentJson: JSON.stringify({
                body: "본문을 입력하세요.",
                title: "새 읽기 스텝",
                type: "reading",
              }),
              id: "cmock-l1-s1",
              sortOrder: 1,
              status: "active",
              type: "READING",
            },
            {
              contentJson: JSON.stringify({
                goal: 150,
                max: 500,
                min: 50,
                prompt: "주제를 입력하세요.",
                title: "글쓰기",
                type: "write",
              }),
              id: "cmock-l1-s2",
              sortOrder: 2,
              status: "active",
              type: "WRITE",
            },
          ],
          title: "새 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "새 유닛",
    },
  ],
}

const archiveCourseResult: AdminArchiveCourseResultDto = {
  archived: true,
}

const courseList: AdminCourseListDto = {
  items: [
    {
      category: "입문자를 위한 코스",
      id: "c1",
      lessonCount: 10,
      revision: 2,
      status: "active",
      title: "글쓰기 첫걸음 30일",
      unitCount: 3,
      visualKey: "basic-sentence-writing",
    },
  ],
  pagination: {
    page: 2,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("어드민 API courses route", () => {
  it("관리자 세션이 있으면 코스 목록 query를 파싱해 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request(
      "/courses?category=%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC+%EC%9C%84%ED%95%9C+%EC%BD%94%EC%8A%A4&page=2&pageSize=10&query=%EA%B8%80%EC%93%B0%EA%B8%B0&status=active",
      {
        headers: {
          Cookie: "admin_session_token=admin-token",
        },
      }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseList)
  })

  it("허용하지 않는 코스 목록 query는 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses?page=0", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("코스 목록 페이지 크기 query가 상한을 넘으면 400을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses?pageSize=101", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed",
    })
  })

  it("관리자 세션이 없으면 코스 생성 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses", {
      method: "POST",
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 기본 유닛, 레슨, 읽기/쓰기 스텝을 가진 코스를 생성한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseDetail)
  })

  it("application 정책이 거부한 코스 생성은 표준 403 오류로 변환한다", async () => {
    const app = createApp(
      createDependencies({ denyCreateCourseAtApplication: true })
    )

    const response = await app.request("/courses", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("운영자는 코스 생성 요청을 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/courses", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("관리자 세션이 있으면 코스를 archived 상태로 전환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "DELETE",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(archiveCourseResult)
  })

  it("운영자는 코스 보관 요청을 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/courses/cmock", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "DELETE",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("없는 코스 보관 요청은 404를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/missing", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "DELETE",
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not Found",
    })
  })
})

function createDependencies({
  denyCreateCourseAtApplication = false,
  role = adminRoles.owner,
}: {
  readonly denyCreateCourseAtApplication?: boolean
  readonly role?: AdminRole
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    adminServices: {
      courses: {
        async archiveCourse(input) {
          expect(input.now).toEqual(testAdminNow)
          expect(input.actor).toEqual({
            id: adminIdSchema.parse("admin-1"),
            role,
          })

          if (input.courseId === "missing") {
            return { kind: "not-found" }
          }

          expect(input.courseId).toBe("cmock")
          return { kind: "ok", value: archiveCourseResult }
        },
        async createCourse(input) {
          expect(input.now).toEqual(testAdminNow)
          expect(input.actor).toEqual({
            id: adminIdSchema.parse("admin-1"),
            role,
          })
          if (denyCreateCourseAtApplication) {
            return { kind: "forbidden" }
          }
          return { kind: "ok", value: courseDetail }
        },
        async getCourses(input) {
          expect(input).toEqual({
            category: "입문자를 위한 코스",
            page: 2,
            pageSize: 10,
            query: "글쓰기",
            status: "active",
          })
          return courseList
        },
      },
    },
    sessionResolver: {
      async resolveSession(headers) {
        if (
          !headers.get("Cookie")?.includes("admin_session_token=admin-token")
        ) {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: adminIdSchema.parse("admin-1"),
            name: "관리자",
            role,
          },
          [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
        }
      },
    },
  })
}
