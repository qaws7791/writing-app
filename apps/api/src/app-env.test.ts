import { describe, expectTypeOf, test } from "vitest"

import type { UserId } from "@workspace/core"

import type { ApiLogger } from "./observability/logger"
import type {
  AppEnv,
  AppServices,
  AppVariables,
  AuthenticatedSession,
  AuthenticatedUser,
} from "./app-env"

/**
 * AppEnv 타입 계약 테스트
 *
 * AppEnv는 모든 미들웨어와 라우트 핸들러가 공유하는 Hono context 타입입니다.
 * 이 테스트는 AppEnv.Variables의 각 필드가 올바른 타입을 가지는지 검증합니다.
 * 타입 변경 시 영향을 받는 코드(require-user-id, resolve-session, 라우트 핸들러)의
 * 파급 효과를 컴파일 단계에서 조기에 발견할 수 있습니다.
 */
describe("AppEnv 타입 계약", () => {
  test("AppEnv.Variables는 AppVariables 타입이다", () => {
    expectTypeOf<AppEnv["Variables"]>().toEqualTypeOf<AppVariables>()
  })

  describe("AppVariables 필드 타입", () => {
    test("authSession: AuthenticatedSession | null", () => {
      expectTypeOf<
        AppVariables["authSession"]
      >().toEqualTypeOf<AuthenticatedSession | null>()
    })

    test("authUser: AuthenticatedUser | null", () => {
      expectTypeOf<
        AppVariables["authUser"]
      >().toEqualTypeOf<AuthenticatedUser | null>()
    })

    test("requestId: string", () => {
      expectTypeOf<AppVariables["requestId"]>().toEqualTypeOf<string>()
    })

    test("requestLogger: ApiLogger", () => {
      expectTypeOf<AppVariables["requestLogger"]>().toEqualTypeOf<ApiLogger>()
    })

    test("services: AppServices", () => {
      expectTypeOf<AppVariables["services"]>().toEqualTypeOf<AppServices>()
    })

    test("userId: UserId | null", () => {
      expectTypeOf<AppVariables["userId"]>().toEqualTypeOf<UserId | null>()
    })
  })
})
