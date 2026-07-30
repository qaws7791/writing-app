import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

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

  it("세션 cookie가 있으면 보호 경로 요청을 로그인으로 보내지 않는다", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/app/courses/course-1", {
        headers: {
          cookie: `${learnerSessionCookieName}=learner-session-token`,
        },
      })
    )

    expect(response.headers.get("location")).toBeNull()
  })

  it.each([
    { label: "랜딩", path: "/" },
    { label: "로그인", path: "/login" },
  ])(
    "공개 $label 경로는 세션이 없어도 로그인으로 보내지 않는다",
    ({ path }) => {
      const response = proxy(new NextRequest(`http://localhost:3000${path}`))

      expect(response.headers.get("location")).toBeNull()
    }
  )
})
