import { describe, expect, it } from "vitest"

import { createApp } from "@/app"
import { createTestDependencies } from "@/routes/test-dependencies"

describe("플랫폼 API lessons route", () => {
  it("인증된 사용자가 lesson 상세를 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/lessons/l1", {
      headers: {
        Cookie: "learner_session_token=active-token",
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      courseId: "c1",
      id: "l1",
      steps: [
        {
          id: "l1-s1",
          type: "READING",
        },
      ],
      title: "좋은 문장이란 무엇인가",
    })
  })
})
