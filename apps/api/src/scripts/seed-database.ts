import { getDefaultDatabaseUrl } from "@workspace/db/client"
import { seedDatabase } from "@workspace/db/seeds/seed"

await seedDatabase({
  allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
  databaseUrl: process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl(),
  forceDatabaseReset: process.argv.includes("--force"),
  nodeEnv: process.env["NODE_ENV"] ?? "",
  targetFingerprint: process.argv
    .find((argument) => argument.startsWith("--target-fingerprint="))
    ?.slice("--target-fingerprint=".length),
})
