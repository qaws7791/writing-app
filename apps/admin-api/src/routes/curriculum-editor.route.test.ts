import { describe, expect, it } from "vitest"

import { createApp, type AdminApiDependencies } from "@/app"
import type { AdminCourseDetailDto } from "@workspace/core/admin"

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

describe("어드민 API curriculum editor route", () => {
  it("관리자 세션이 없으면 코스 editor 문서 요청은 401을 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock/editor")

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
      },
    })
  })

  it("관리자 세션이 있으면 생성된 코스를 editor 문서로 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/cmock/editor", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(courseDetail)
  })

  it("없는 코스 editor 문서 요청은 404를 반환한다", async () => {
    const app = createApp(createDependencies())

    const response = await app.request("/courses/missing/editor", {
      headers: {
        Authorization: "Bearer admin-token",
      },
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
      },
    })
  })
})

function createDependencies(): AdminApiDependencies {
  return {
    adminOrigin: "http://localhost:3003",
    dashboardService: {
      async archiveCourse() {
        throw new Error("unexpected archive course request")
      },
      async createCourse() {
        throw new Error("unexpected create course request")
      },
      async deleteUser() {
        throw new Error("unexpected delete user request")
      },
      async getAnalytics() {
        throw new Error("unexpected analytics request")
      },
      async getCourseEditor(input) {
        if (input.courseId === "missing") {
          return null
        }

        expect(input.courseId).toBe("cmock")
        return courseDetail
      },
      async getDashboard() {
        throw new Error("unexpected dashboard request")
      },
      async getLessonAnalytics() {
        throw new Error("unexpected lesson analytics request")
      },
      async getSettings() {
        throw new Error("unexpected settings request")
      },
      async getUser() {
        throw new Error("unexpected user detail request")
      },
      async getUsers() {
        throw new Error("unexpected user list request")
      },
      async resetContent() {
        throw new Error("unexpected content reset request")
      },
      async updateLegalSettings() {
        throw new Error("unexpected legal settings request")
      },
      async updateNoticeSettings() {
        throw new Error("unexpected notice settings request")
      },
      async updateUserStatus() {
        throw new Error("unexpected user status request")
      },
    },
    sessionResolver: {
      async resolveSession(token) {
        if (token !== "admin-token") {
          return null
        }

        return {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role: "owner",
          },
        }
      },
    },
  }
}
