import { afterEach, describe, expect, test } from "bun:test"
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  inspectLocalEnvironmentFiles,
  prepareLocalEnvironmentFiles,
} from "#scripts/local-environment"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const temporaryDirectories: string[] = []
const environmentFiles = ["apps/api", "apps/web", "apps/admin"] as const

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { force: true, recursive: true })
  }
})

describe("local environment preparation", () => {
  test("예시 placeholder와 누락 값만 보충하고 사용자 값을 보존한다", async () => {
    const fixtureRoot = await createFixtureRepository()

    const results = prepareLocalEnvironmentFiles(fixtureRoot)
    const apiEnvironment = await readFile(
      path.join(fixtureRoot, "apps/api/.env"),
      "utf8"
    )

    expect(results).toContainEqual({
      keys: [
        "ADMIN_SEED_PASSWORD",
        "ADMIN_SEED_RESET_PASSWORD",
        "API_PORT",
        "CURSOR_SIGNING_SECRET",
        "LEARNER_AUTH_SECRET",
      ],
      kind: "updated",
      path: "apps/api/.env",
    })
    expect(apiEnvironment).toMatch(/^ADMIN_AUTH_SECRET=custom-admin-secret$/mu)
    expect(apiEnvironment).toMatch(/^DATABASE_URL=file:custom.sqlite$/mu)
    expect(apiEnvironment).toMatch(/^ADMIN_SEED_RESET_PASSWORD=false$/mu)
    expect(apiEnvironment).toMatch(/^API_PORT=4000$/mu)
    expect(apiEnvironment).not.toContain("replace-with-32-byte-local")
    expect(apiEnvironment).not.toContain("replace-with-strong-local")
    expect(inspectLocalEnvironmentFiles(fixtureRoot)).toEqual([])
  })
})

async function createFixtureRepository(): Promise<string> {
  const fixtureRoot = await mkdtemp(
    path.join(tmpdir(), "writing-app-local-environment-")
  )
  temporaryDirectories.push(fixtureRoot)

  for (const directory of environmentFiles) {
    const targetDirectory = path.join(fixtureRoot, directory)
    await mkdir(targetDirectory, { recursive: true })
    await copyFile(
      path.join(repositoryRoot, directory, ".env.example"),
      path.join(targetDirectory, ".env.example")
    )
    if (directory !== "apps/api") {
      await copyFile(
        path.join(repositoryRoot, directory, ".env.example"),
        path.join(targetDirectory, ".env")
      )
    }
  }

  const apiExample = await readFile(
    path.join(repositoryRoot, "apps/api/.env.example"),
    "utf8"
  )
  const apiEnvironment = apiExample
    .replace(
      /^ADMIN_AUTH_SECRET=.*$/mu,
      "ADMIN_AUTH_SECRET=custom-admin-secret"
    )
    .replace(/^DATABASE_URL=.*$/mu, "DATABASE_URL=file:custom.sqlite")
    .replace(/^API_PORT=.*(?:\r?\n|$)/mu, "")
  await writeFile(
    path.join(fixtureRoot, "apps/api/.env"),
    apiEnvironment,
    "utf8"
  )

  return fixtureRoot
}
