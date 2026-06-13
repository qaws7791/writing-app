import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

describe("플랫폼 API courses route", () => {
  it("인증된 사용자가 active course 목록을 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      courses: [
        {
          id: "c1",
          lessonCount: 3,
          title: "글쓰기 첫걸음 30일",
        },
      ],
    })
  })

  it("인증된 사용자가 course 상세를 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses/c1", {
      headers: {
        Authorization: "Bearer active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "c1",
      units: [
        {
          id: "u1",
          lessons: [
            {
              id: "l1",
              estimatedMinutes: 5,
            },
          ],
        },
      ],
    })
  })
})
