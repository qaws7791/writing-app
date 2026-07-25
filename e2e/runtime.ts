export const e2eRuntime = {
  adminOrigin: "http://127.0.0.1:3101",
  apiOrigin: "http://127.0.0.1:4100",
  assetOrigin: "http://127.0.0.1:4199",
  learnerOrigin: "http://localhost:3100",
} as const

export function readRequiredE2eEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    throw new Error(`${name}이 없습니다. E2E 공개 명령을 사용해 주세요.`)
  }
  return value
}
