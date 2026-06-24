import { describe, expect, it } from "vitest"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "@/local-runtime-defaults"
import { parseEnv } from "@/parse-env"

const validSecret = "x".repeat(32)

describe("env parser", () => {
  it("로컬 런타임 기본값은 중앙 계약을 따른다", () => {
    expect(
      parseEnv({
        BETTER_AUTH_SECRET: validSecret,
      })
    ).toMatchObject({
      ADMIN_API_PORT: localRuntimePorts.adminApi,
      ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
      API_PORT: localRuntimePorts.learnerApi,
      WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
    })
  })

  it("문자열 환경 변수를 런타임 설정으로 검증하고 변환한다", () => {
    expect(
      parseEnv({
        ADMIN_API_PORT: "4002",
        ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
        API_PORT: "4001",
        BETTER_AUTH_SECRET: validSecret,
        DATABASE_URL: ":memory:",
        NODE_ENV: "test",
        WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
      })
    ).toEqual({
      ADMIN_API_PORT: 4002,
      ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
      API_PORT: 4001,
      BETTER_AUTH_URL: undefined,
      BETTER_AUTH_SECRET: validSecret,
      DATABASE_URL: ":memory:",
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      ENABLE_TEST_AUTH: false,
      NODE_ENV: "test",
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: "gpt-5.2",
      WEB_ORIGIN: localRuntimeDefaults.learnerWebOrigin,
    })
  })

  it("테스트 인증 플래그는 명시적으로 true일 때만 켜진다", () => {
    expect(
      parseEnv({
        BETTER_AUTH_SECRET: validSecret,
        ENABLE_TEST_AUTH: "true",
      }).ENABLE_TEST_AUTH
    ).toBe(true)
    expect(
      parseEnv({
        BETTER_AUTH_SECRET: validSecret,
      }).ENABLE_TEST_AUTH
    ).toBe(false)
  })

  it("DATABASE_URL이 없으면 DB client 기본 경로를 사용하도록 비워 둔다", () => {
    expect(
      parseEnv({
        BETTER_AUTH_SECRET: validSecret,
      }).DATABASE_URL
    ).toBeUndefined()
  })

  it("Better Auth secret은 32자 이상이어야 한다", () => {
    expect(() =>
      parseEnv({
        BETTER_AUTH_SECRET: "short",
      })
    ).toThrow(/BETTER_AUTH_SECRET/)
  })

  it("port 범위를 명시적으로 검증한다", () => {
    expect(() =>
      parseEnv({
        API_PORT: "70000",
        BETTER_AUTH_SECRET: validSecret,
      })
    ).toThrow(/API_PORT/)
  })
})
