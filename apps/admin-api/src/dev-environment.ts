import { basename, isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url))

const databaseUrl = process.env["DATABASE_URL"]

if (databaseUrl?.startsWith("file:")) {
  const databasePath = databaseUrl.slice("file:".length)

  if (!isAbsolute(databasePath)) {
    const adminApiDirectory = fileURLToPath(new URL("..", import.meta.url))
    process.env["DATABASE_URL"] =
      `file:${resolve(adminApiDirectory, databasePath)}`
  }
}

const lifecycleFixture = process.env["ADMIN_DEV_LIFECYCLE_FIXTURE"]

if (lifecycleFixture !== undefined) {
  const packagesEnvDirectory = resolve(repositoryRoot, "packages", "env")
  const fixturePath = resolve(repositoryRoot, lifecycleFixture)
  const relativeFixturePath = relative(packagesEnvDirectory, fixturePath)

  if (
    relativeFixturePath.startsWith("..") ||
    isAbsolute(relativeFixturePath) ||
    basename(fixturePath) !== ".admin-dev-lifecycle-fixture.ts"
  ) {
    throw new Error(
      "ADMIN_DEV_LIFECYCLE_FIXTURE는 packages/env의 전용 fixture여야 합니다."
    )
  }

  await import(pathToFileURL(fixturePath).href)
  process.stdout.write("admin-dev-lifecycle.fixture-loaded\n")
}
