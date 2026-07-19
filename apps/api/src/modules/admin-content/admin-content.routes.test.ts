import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createAdminContentTargetRouteFixture } from "@/test-support/admin-content-target-route-fixture"

const adminCookie = `${adminSessionCookieName}=admin-token`
const adminOrigin = localRuntimeDefaults.adminWebOrigin

describe("통합 관리자 Content route", () => {
  it("owner mutation, editor ETag와 owner authorization을 공통 admin delivery에 연결한다", async () => {
    const ownerFixture = createAdminContentTargetRouteFixture("owner")
    const operatorFixture = createAdminContentTargetRouteFixture("operator")

    const ownerResponse = await ownerFixture.fetch(
      new Request("http://api.test/courses/course-1/editor", {
        headers: { Cookie: adminCookie },
      })
    )
    const operatorResponse = await operatorFixture.fetch(
      new Request("http://api.test/courses", {
        headers: {
          Cookie: adminCookie,
          Origin: adminOrigin,
          "Sec-Fetch-Site": "same-origin",
        },
        method: "POST",
      })
    )

    expect(ownerResponse.status).toBe(200)
    expect(ownerResponse.headers.get("ETag")).toBe('"3"')
    expect(operatorResponse.status).toBe(403)
    await expect(operatorResponse.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("목록·생성과 curriculum editor의 target operation을 직접 등록한다", async () => {
    const fixture = createAdminContentTargetRouteFixture("owner")

    const listResponse = await fixture.fetch(
      new Request(
        "http://api.test/courses?category=%EB%AF%B8%EB%B6%84%EB%A5%98&page=2&pageSize=5&query=%EC%BD%94%EC%8A%A4&status=active",
        { headers: { Cookie: adminCookie } }
      )
    )
    const createResponse = await fixture.fetch(
      new Request("http://api.test/courses", {
        headers: {
          Cookie: adminCookie,
          Origin: adminOrigin,
          "Sec-Fetch-Site": "same-origin",
        },
        method: "POST",
      })
    )

    expect(listResponse.status).toBe(200)
    await expect(listResponse.json()).resolves.toMatchObject({
      items: [{ id: "course-1", title: "코스 1" }],
      pagination: {
        page: 2,
        pageSize: 5,
        totalItems: 1,
        totalPages: 1,
      },
    })
    expect(createResponse.status).toBe(200)
    await expect(createResponse.json()).resolves.toMatchObject({
      id: "course-1",
      title: "코스 1",
    })
    expect(fixture.readEffectJournal()).toEqual([
      {
        effect: "courses.list",
        input: {
          category: "미분류",
          page: 2,
          pageSize: 5,
          query: "코스",
          status: "active",
        },
        sequence: 1,
      },
      {
        effect: "courses.create",
        input: {
          actor: { id: "admin-1", role: "owner" },
          now: "2026-06-14T03:00:00.000Z",
        },
        sequence: 2,
      },
    ])
  })

  it("Content OpenAPI가 target route의 여섯 operation을 공개한다", async () => {
    const fixture = createAdminContentTargetRouteFixture("owner")
    const response = await fixture.fetch(new Request("http://api.test/openapi"))
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document).toMatchObject({
      components: {
        securitySchemes: {
          adminSessionCookie: {
            in: "cookie",
            name: adminSessionCookieName,
            type: "apiKey",
          },
        },
      },
      paths: {
        "/api/admin/courses": {
          get: { operationId: "getAdminCourses" },
          post: { operationId: "createAdminCourse" },
        },
        "/api/admin/courses/{courseId}": {
          delete: { operationId: "archiveAdminCourse" },
        },
        "/api/admin/courses/{courseId}/editor": {
          get: { operationId: "getAdminCourseEditor" },
          put: { operationId: "saveAdminCourseEditor" },
        },
        "/api/admin/courses/{courseId}/publish": {
          post: { operationId: "publishAdminCourse" },
        },
      },
    })
  })
})
