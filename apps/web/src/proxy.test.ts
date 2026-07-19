import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"

describe("learner route proxy", () => {
  it("세션이 없으면 동적 보호 경로와 query를 로그인 next 경로로 보존한다", () => {
    const response = proxy(
      new NextRequest(
        "http://localhost:3000/app/courses/course-1?source=dashboard"
      )
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fapp%2Fcourses%2Fcourse-1%3Fsource%3Ddashboard"
    )
  })
})
