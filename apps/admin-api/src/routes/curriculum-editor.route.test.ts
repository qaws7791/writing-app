import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import {
  createTestAdminApiDependencies,
  createTestAdminSessionResolver,
  testAdminSession,
} from "@/routes/test-dependencies"
import {
  adminCourseEditorDocumentSchema,
  type AdminCourseEditorDocument,
} from "@workspace/contracts/admin"
import { adminRoles } from "@workspace/core/admin"

const courseDetail: AdminCourseEditorDocument =
  adminCourseEditorDocumentSchema.parse({
    category: "미분류",
    curriculumVersionId: "cmock-v1",
    description: "강의 설명을 입력하세요.",
    editVersion: 0,
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
            summary: ["새 레슨 요약"],
            steps: [
              {
                body: "본문을 입력하세요.",
                guide: "",
                id: "cmock-l1-s1",
                sortOrder: 1,
                status: "active",
                title: "새 읽기 스텝",
                type: "READING",
              },
              {
                goal: 150,
                id: "cmock-l1-s2",
                max: 500,
                min: 50,
                prompt: "주제를 입력하세요.",
                sortOrder: 2,
                status: "active",
                title: "글쓰기",
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
  })

describe("어드민 API curriculum editor route", () => {
  it("관리자 세션이 없으면 코스 editor 문서 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock/editor")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  })

  it("관리자 세션이 있으면 생성된 코스를 editor 문서로 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock/editor", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("ETag")).toBe('"0"')
    await expect(response.json()).resolves.toEqual(courseDetail)
  })

  it("없는 코스 editor 문서 요청은 404를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/missing/editor", {
      headers: {
        Cookie: "admin_session_token=admin-token",
      },
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not Found",
    })
  })

  it("owner가 If-Match로 editor 문서를 저장하면 editVersion이 증가한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock/editor", {
      body: JSON.stringify({ ...courseDetail, title: "저장한 강의" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin_session_token=admin-token",
        "If-Match": '"0"',
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("ETag")).toBe('"1"')
    await expect(response.json()).resolves.toMatchObject({
      editVersion: 1,
      revision: 1,
      title: "저장한 강의",
    })
  })

  it("경로와 문서 ID 불일치 및 revision 충돌을 구분한다", async () => {
    const app = createApp(createDependencies())
    const headers = {
      "Content-Type": "application/json",
      Cookie: "admin_session_token=admin-token",
      "If-Match": '"0"',
      Origin: "http://localhost:3001",
    }

    const mismatched = await app.request("/courses/other/editor", {
      body: JSON.stringify(courseDetail),
      headers,
      method: "PUT",
    })
    const stale = await app.request("/courses/cmock/editor", {
      body: JSON.stringify(courseDetail),
      headers: { ...headers, "If-Match": '"9"' },
      method: "PUT",
    })

    expect(mismatched.status).toBe(400)
    expect(stale.status).toBe(409)
    await expect(stale.json()).resolves.toMatchObject({
      code: "STALE_REVISION",
    })
  })

  it("If-Match 없이 저장하면 428을 반환한다", async () => {
    const app = createApp(createDependencies())
    const response = await app.request("/courses/cmock/editor", {
      body: JSON.stringify(courseDetail),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin_session_token=admin-token",
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(428)
  })

  it("owner가 현재 초안을 발행하면 발행 리비전을 반환한다", async () => {
    const app = createApp(createDependencies())
    const response = await app.request("/courses/cmock/publish", {
      headers: {
        Cookie: "admin_session_token=admin-token",
        "If-Match": '"0"',
        Origin: "http://localhost:3001",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      curriculumVersionId: "cmock-v1",
      publishedAt: "2026-06-14T00:00:00.000Z",
      revision: 1,
    })
  })

  it("operator의 editor 저장을 service 호출 전에 거부한다", async () => {
    const app = createApp(
      createTestAdminApiDependencies({
        sessionResolver: createTestAdminSessionResolver({
          session: {
            ...testAdminSession,
            admin: { ...testAdminSession.admin, role: adminRoles.operator },
          },
        }),
      })
    )

    const response = await app.request("/courses/cmock/editor", {
      body: JSON.stringify(courseDetail),
      headers: {
        "Content-Type": "application/json",
        Cookie: "admin_session_token=admin-token",
        "If-Match": '"0"',
        Origin: "http://localhost:3001",
      },
      method: "PUT",
    })

    expect(response.status).toBe(403)
  })
})

function createDependencies() {
  return createTestAdminApiDependencies({
    adminServices: {
      courses: {
        async getCourseEditor(input) {
          if (input.courseId === "missing") {
            return null
          }

          expect(input.courseId).toBe("cmock")
          return courseDetail
        },
        async saveCourseEditor(input) {
          if (input.expectedEditVersion !== courseDetail.editVersion) {
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
        async publishCourse(input) {
          if (input.expectedEditVersion !== courseDetail.editVersion) {
            return { kind: "stale-revision" }
          }
          return {
            kind: "ok",
            value: {
              curriculumVersionId: courseDetail.curriculumVersionId,
              publishedAt: "2026-06-14T00:00:00.000Z",
              revision: courseDetail.revision,
            },
          }
        },
      },
    },
  })
}
