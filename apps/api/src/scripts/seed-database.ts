import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

import { seedApplicationDatabase } from "@/db/seed"

export type SeedDatabaseEnvironment = Readonly<{
  DATABASE_SEED_EXPECTED_DATABASE_URL?: string
  DATABASE_SEED_PRODUCTION_APPROVED?: string
  DATABASE_URL?: string
  NODE_ENV?: string
}>

export function parseSeedDatabaseEnvironment(
  environment: SeedDatabaseEnvironment
): string {
  const databaseUrl = environment.DATABASE_URL ?? getDefaultDatabaseUrl()
  if (environment.NODE_ENV !== "production") return databaseUrl

  if (environment.DATABASE_SEED_PRODUCTION_APPROVED !== "true") {
    throw new Error(
      "운영 database seed에는 DATABASE_SEED_PRODUCTION_APPROVED=true가 필요합니다."
    )
  }
  if (environment.DATABASE_URL === undefined) {
    throw new Error(
      "운영 database seed에는 명시적인 DATABASE_URL이 필요합니다."
    )
  }
  if (environment.DATABASE_SEED_EXPECTED_DATABASE_URL !== databaseUrl) {
    throw new Error(
      "운영 database seed 대상 DATABASE_URL 확인값이 일치하지 않습니다."
    )
  }

  return databaseUrl
}

async function runSeedDatabase(): Promise<void> {
  if (process.argv.includes("--force")) {
    throw new Error(
      "seed는 database를 reset하지 않습니다. db:reset을 별도로 실행하세요."
    )
  }

  const databaseUrl = parseSeedDatabaseEnvironment(process.env)
  const client = createWritingAppDatabase(databaseUrl)

  try {
    await seedApplicationDatabase(client)
  } finally {
    client.close()
  }
}

if (import.meta.main) await runSeedDatabase()
