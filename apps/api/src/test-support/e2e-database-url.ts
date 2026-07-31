import path from "node:path"

export function requireE2eDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  const databaseUrl = environment["DATABASE_URL"]
  const runRoot = environment["E2E_RUN_ROOT"]

  if (
    environment["NODE_ENV"] !== "test" ||
    databaseUrl === undefined ||
    runRoot === undefined
  ) {
    throw new Error(
      "E2E 데이터베이스 준비에는 NODE_ENV=test와 E2E_RUN_ROOT가 필요합니다."
    )
  }

  const databasePath = path.resolve(databaseUrl.replace(/^file:/u, ""))
  const expectedDatabasePath = path.join(
    path.resolve(runRoot),
    "writing-app.sqlite"
  )

  if (databasePath !== expectedDatabasePath) {
    throw new Error(
      `허용되지 않은 E2E 데이터베이스 경로입니다: ${databasePath}`
    )
  }

  return databasePath
}
