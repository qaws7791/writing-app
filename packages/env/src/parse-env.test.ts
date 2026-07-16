import { describe, expect, it } from "vitest"

import {
  localRuntimeDefaults,
  localRuntimePorts,
} from "#env/local-runtime-defaults"
import { parseEnv } from "#env/parse-env"

const validSecret = "x".repeat(32)
const learnerProductionSecret =
  "0123456789abcdef0123456789abcdef0123456789abcdef"
const adminProductionSecret = "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210"
const cursorProductionSecret =
  "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB"
const validProductionEnv = {
  ADMIN_BETTER_AUTH_SECRET: adminProductionSecret,
  ADMIN_BETTER_AUTH_URL: "https://admin-api.example.com",
  ADMIN_ORIGIN: "https://admin.example.com",
  BETTER_AUTH_SECRET: learnerProductionSecret,
  BETTER_AUTH_URL: "https://api.example.com",
  CURSOR_SIGNING_SECRET: cursorProductionSecret,
  DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
  NODE_ENV: "production",
  WEB_ORIGIN: "https://app.example.com",
} as const

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
      ADMIN_BETTER_AUTH_SECRET: undefined,
      ADMIN_BETTER_AUTH_URL: undefined,
      ADMIN_ORIGIN: localRuntimeDefaults.adminWebOrigin,
      API_PORT: 4001,
      BETTER_AUTH_URL: undefined,
      BETTER_AUTH_SECRET: validSecret,
      CURSOR_SIGNING_SECRET: undefined,
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

  it("production 필수 URL·DB·관리자 secret이 모두 있으면 통과한다", () => {
    expect(parseEnv(validProductionEnv)).toMatchObject(validProductionEnv)
  })

  it.each([
    "ADMIN_BETTER_AUTH_SECRET",
    "ADMIN_BETTER_AUTH_URL",
    "BETTER_AUTH_URL",
    "DATABASE_URL",
  ] as const)("production에서 %s 누락을 startup 전에 거부한다", (name) => {
    expect(() =>
      parseEnv({ ...validProductionEnv, [name]: undefined })
    ).toThrow(new RegExp(name))
  })

  it.each([
    ["HTTP origin", { WEB_ORIGIN: "http://app.example.com" }],
    ["localhost", { ADMIN_ORIGIN: "https://localhost" }],
    ["memory DB", { DATABASE_URL: ":memory:" }],
    ["동일 secret", { ADMIN_BETTER_AUTH_SECRET: learnerProductionSecret }],
    ["동일 cursor secret", { CURSOR_SIGNING_SECRET: learnerProductionSecret }],
    ["낮은 entropy", { BETTER_AUTH_SECRET: "x".repeat(48) }],
    [
      "placeholder",
      { BETTER_AUTH_SECRET: "replace-with-production-secret-0123456789" },
    ],
    ["test auth", { ENABLE_TEST_AUTH: "true" }],
    ["cookie domain", { BETTER_AUTH_COOKIE_DOMAIN: "attacker.example" }],
  ])("production에서 %s 설정을 거부한다", (_, override) => {
    expect(() => parseEnv({ ...validProductionEnv, ...override })).toThrow()
  })

  it("development의 localhost와 테스트 인증은 유지한다", () => {
    expect(
      parseEnv({
        BETTER_AUTH_SECRET: validSecret,
        ENABLE_TEST_AUTH: "true",
        NODE_ENV: "development",
      })
    ).toMatchObject({ ENABLE_TEST_AUTH: true, NODE_ENV: "development" })
  })
})
