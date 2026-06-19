import { describe, expect, it } from "vitest"
import { readBearerToken } from "@workspace/core/auth"

import { createApp, type AdminApiDependencies } from "@/app"
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
          Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseDetail)
  })

  it("운영자는 코스 생성 요청을 실행할 수 없다", async () => {
    const app = createApp(createDependencies({ role: adminRoles.operator }))

    const response = await app.request("/courses", {
      headers: {
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
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
        Authorization: "Bearer admin-token",
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
  role = adminRoles.owner,
}: {
  readonly role?: AdminRole
} = {}): AdminApiDependencies {
  return createTestAdminApiDependencies({
    dashboardService: {
      async archiveCourse(input) {
        expect(input.now).toEqual(testAdminNow)

        if (input.courseId === "missing") {
          return null
        }

        expect(input.courseId).toBe("cmock")
        return archiveCourseResult
      },
      async createCourse(input) {
        expect(input.now).toEqual(testAdminNow)
        return courseDetail
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
    sessionResolver: {
      async resolveSession(headers) {
        const token = readBearerToken(headers.get("Authorization"))

        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role,
          },
        }
      },
    },
  })
}
