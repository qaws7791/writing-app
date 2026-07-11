import { isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const databaseUrl = process.env["DATABASE_URL"]

if (databaseUrl?.startsWith("file:")) {
  const databasePath = databaseUrl.slice("file:".length)

  if (!isAbsolute(databasePath)) {
    const adminApiDirectory = fileURLToPath(new URL("..", import.meta.url))
    process.env["DATABASE_URL"] =
      `file:${resolve(adminApiDirectory, databasePath)}`
  }
}
