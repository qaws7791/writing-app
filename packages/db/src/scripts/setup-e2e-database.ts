import { rmSync } from "node:fs"
import path from "node:path"

import { seedDatabase } from "@workspace/db/seeds/seed"

const e2eDatabaseUrl = requireE2eDatabaseUrl(process.env)

removeE2eDatabaseFiles(e2eDatabaseUrl)
await seedDatabase({ databaseUrl: e2eDatabaseUrl, nodeEnv: "test" })

function requireE2eDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  const databaseUrl = environment["DATABASE_URL"]

  if (environment["NODE_ENV"] !== "test" || databaseUrl === undefined) {
    throw new Error("E2E 데이터베이스 준비에는 NODE_ENV=test가 필요합니다.")
  }

  const databasePath = path.resolve(databaseUrl.replace(/^file:/, ""))
  const expectedSuffix = path.join("data", "e2e", "writing-app.sqlite")

  if (!databasePath.endsWith(expectedSuffix)) {
    throw new Error(
      `허용되지 않은 E2E 데이터베이스 경로입니다: ${databasePath}`
    )
  }

  return databasePath
}

function removeE2eDatabaseFiles(databasePath: string): void {
  for (const suffix of ["", "-shm", "-wal"] as const) {
    rmSync(`${databasePath}${suffix}`, { force: true })
  }
}
