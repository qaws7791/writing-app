/**
 * E2E 실행 topology와 seeded fixture credential의 단일 출처다. 값은 모두 합성이며
 * 실제 사용자 데이터나 production endpoint가 아니다. seeder, Playwright config,
 * Lighthouse wrapper가 같은 값을 각자 다시 적지 않게 하려고 여기에 모았다.
 */
export const e2eRuntimeOrigins = {
  adminOrigin: "http://127.0.0.1:3101",
  apiOrigin: "http://127.0.0.1:4100",
  assetOrigin: "http://127.0.0.1:4199",
  learnerOrigin: "http://localhost:3100",
} as const

export const e2eSeededCredentials = {
  adminPassword: "e2e-password-123",
  learnerEmail: "learner@example.com",
  learnerPassword: "e2e-password-123",
} as const

export function readRequiredE2eEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    throw new Error(`${name}이 없습니다. E2E 공개 명령을 사용해 주세요.`)
  }

  return value
}
