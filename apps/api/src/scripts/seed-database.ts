import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

import { seedApplicationDatabase } from "@/db/seed"

if (process.argv.includes("--force")) {
  throw new Error(
    "seed는 database를 reset하지 않습니다. db:reset을 별도로 실행하세요."
  )
}

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const client = createWritingAppDatabase(databaseUrl)

try {
  await seedApplicationDatabase(client)
} finally {
  client.close()
}
