import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestAdminApiDependencies } from "@/routes/test-dependencies"
import type { AdminCourseDetailDto } from "@workspace/contracts/admin"

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
          summary: ["새 레슨 요약"],
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
      code: "UNAUTHORIZED",
      message: "Unauthorized",
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
      code: "NOT_FOUND",
      message: "Not Found",
    })
  })
})

function createDependencies() {
  return createTestAdminApiDependencies({
    dashboardService: {
      async getCourseEditor(input) {
        if (input.courseId === "missing") {
          return null
        }

        expect(input.courseId).toBe("cmock")
        return courseDetail
      },
    },
  })
}
