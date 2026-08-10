import { describe, expect, it } from "vitest"

import { parseEnv, type AppEnvInput } from "#env/parse-env"

const learnerProductionSecret =
  "0123456789abcdef0123456789abcdef0123456789abcdef"
const adminProductionSecret = "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210"
const validProductionEnvironment: AppEnvInput = {
  ADMIN_AUTH_SECRET: adminProductionSecret,
  ADMIN_ORIGIN: "https://admin.example.com",
  CURSOR_SIGNING_SECRET: "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ1234567890AB",
  DATABASE_URL: "file:/var/lib/writing-app/api.sqlite",
  LEARNER_AUTH_SECRET: learnerProductionSecret,
  NODE_ENV: "production",
  WEB_ORIGIN: "https://app.example.com",
}

describe("production 환경 검증", () => {
  it.each([
    ["HTTP origin", { WEB_ORIGIN: "http://app.example.com" }, /WEB_ORIGIN/u],
    ["memory DB", { DATABASE_URL: ":memory:" }, /DATABASE_URL/u],
    [
      "공유 auth secret",
      { ADMIN_AUTH_SECRET: learnerProductionSecret },
      /ADMIN_AUTH_SECRET/u,
    ],
    [
      "낮은 entropy secret",
      { LEARNER_AUTH_SECRET: "x".repeat(48) },
      /LEARNER_AUTH_SECRET/u,
    ],
  ] as const)("%s 설정을 startup 전에 거부한다", (_, override, error) => {
    expect(() =>
      parseEnv({ ...validProductionEnvironment, ...override })
    ).toThrow(error)
  })
})
