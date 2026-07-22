import { getDefaultDatabaseUrl } from "@workspace/db/client"
import {
  inspectDatabaseResetTarget,
  resetSqliteDatabaseFiles,
} from "@workspace/db/destructive-operation-guard"

const databaseUrl = process.env["DATABASE_URL"] ?? getDefaultDatabaseUrl()
const target = inspectDatabaseResetTarget(databaseUrl)

if (target === null) {
  throw new Error("Cannot reset an in-memory database.")
}

if (process.argv.includes("--print-fingerprint")) {
  process.stdout.write(`${target.fingerprint}\n`)
} else {
  resetSqliteDatabaseFiles({
    allowDatabaseReset: process.env["ALLOW_DATABASE_RESET"] === "true",
    databaseUrl,
    forceDatabaseReset: process.argv.includes("--force"),
    nodeEnv: process.env["NODE_ENV"] ?? "",
    targetFingerprint:
      readArgument("--target-fingerprint=") ??
      process.env["DATABASE_RESET_TARGET_FINGERPRINT"],
  })
}

function readArgument(prefix: string): string | undefined {
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length)
}
