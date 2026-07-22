import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"
import { seedDatabase } from "@workspace/db/seeds/seed"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { seedLearnerIdentity } from "@workspace/identity/seed"
import { seedContentDatabase } from "@workspace/content/seed"
import { normalizeVersionedStepContentOrThrow } from "@workspace/content/normalization"
import { runContentSchemaMigration } from "@workspace/content/schema"

import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
await seedDatabase({
  allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
  databaseUrl,
  forceDatabaseReset: process.argv.includes("--force"),
  normalizeVersionedStepContent: normalizeVersionedStepContentOrThrow,
  nodeEnv: process.env["NODE_ENV"] ?? "",
  targetFingerprint: process.argv
    .find((argument) => argument.startsWith("--target-fingerprint="))
    ?.slice("--target-fingerprint=".length),
})

const client = createWritingAppDatabase(databaseUrl)
try {
  runContentSchemaMigration(client.sqlite)
  await seedContentDatabase(client.db)
  runApiIdentitySchemaMigration(client.sqlite)
  seedLearnerIdentity(client.db, {
    displayName: "글쓰기 탐험가",
    userId: userIdSchema.parse("user-1"),
  })
} finally {
  client.close()
}
