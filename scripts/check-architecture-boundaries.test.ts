import { describe, expect, test } from "bun:test"

import {
  isApiTransportFile,
  isAuthClientFile,
  isAuthClientServerDependency,
} from "./check-architecture-boundaries"

describe("API transport persistence boundary", () => {
  test("target 관리자 transport helper를 persistence import 금지 범위에 포함한다", () => {
    expect(isApiTransportFile("api/src/admin/admin-auth.middleware.ts")).toBe(
      true
    )
    expect(isApiTransportFile("api/src/admin/admin-openapi.ts")).toBe(true)
  })

  test("composition과 adapter는 transport로 분류하지 않는다", () => {
    expect(
      isApiTransportFile(
        "api/src/composition/admin-route-composition-context.ts"
      )
    ).toBe(false)
    expect(
      isApiTransportFile(
        "api/src/adapters/auth/admin-session-drizzle.repository.ts"
      )
    ).toBe(false)
    expect(isApiTransportFile("admin/src/auth/admin-auth.ts")).toBe(false)
  })
})

describe("auth client server boundary", () => {
  test("공개 client와 공용 transport만 client 경계로 분류한다", () => {
    expect(isAuthClientFile("learner/client.ts")).toBe(true)
    expect(isAuthClientFile("admin/server.ts")).toBe(false)
  })

  test("vanilla client 이외의 Better Auth와 server 의존성을 차단한다", () => {
    expect(isAuthClientServerDependency("better-auth/client")).toBe(false)
    expect(isAuthClientServerDependency("better-auth")).toBe(true)
    expect(isAuthClientServerDependency("@workspace/db/client")).toBe(true)
    expect(
      isAuthClientServerDependency("#auth/shared/auth-database-adapter")
    ).toBe(true)
    expect(isAuthClientServerDependency("#auth/shared/client")).toBe(false)
  })
})
