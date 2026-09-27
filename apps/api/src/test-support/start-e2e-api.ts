import type { Unstable_RawConfig } from "wrangler"
import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import {
  e2eRuntimeOrigins,
  readRequiredE2eEnvironment,
} from "@workspace/env/e2e-runtime"

const runRoot = path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT"))
const stateRoot = path.join(runRoot, "state")
const apiRoot = path.resolve(import.meta.dir, "../..")
const wrangler = path.resolve(
  apiRoot,
  "../../node_modules/wrangler/bin/wrangler.js"
)
const config = Bun.JSONC.parse(
  await Bun.file(path.join(apiRoot, "wrangler.jsonc")).text()
) as Unstable_RawConfig
config.main = path.join(apiRoot, "src/worker.ts")
config.name = "writing-app-api-e2e"
delete config.env
delete config.secrets
config.vars = {
  ...config.vars,
  WEB_ORIGIN: e2eRuntimeOrigins.learnerOrigin,
  ADMIN_ORIGIN: e2eRuntimeOrigins.adminOrigin,
  ASSET_PUBLIC_BASE_URL: e2eRuntimeOrigins.apiOrigin + "/assets/content",
  LEARNER_AUTH_SECRET: "e2e-learner-auth-secret-at-least-32-characters",
  ADMIN_AUTH_SECRET: "e2e-admin-auth-secret-at-least-32-characters",
  CURSOR_SIGNING_SECRET: "e2e-cursor-secret-at-least-32-characters",
}
const databaseConfig = config.d1_databases?.[0]
if (databaseConfig === undefined) throw new Error("D1 binding이 없습니다.")
databaseConfig.migrations_dir = path.join(apiRoot, "migrations")
await mkdir(runRoot, { recursive: true })
const configPath = path.join(runRoot, "api.json")
await writeFile(configPath, JSON.stringify(config))
const migration = Bun.spawn(
  [
    "node",
    wrangler,
    "d1",
    "migrations",
    "apply",
    "DB",
    "--local",
    "--config",
    configPath,
    "--persist-to",
    stateRoot,
  ],
  { stdin: "ignore", stdout: "inherit", stderr: "inherit" }
)
if ((await migration.exited) !== 0) throw new Error("E2E D1 migration 실패")
const seed = Bun.spawn(
  [
    "node",
    path.join(apiRoot, "node_modules/tsx/dist/cli.mjs"),
    "--tsconfig",
    path.join(apiRoot, "tsconfig.json"),
    path.join(apiRoot, "src/test-support/seed-e2e-database.ts"),
  ],
  { stdin: "ignore", stdout: "inherit", stderr: "inherit" }
)
if ((await seed.exited) !== 0) throw new Error("E2E D1 seed 실패")
const child = Bun.spawn(
  [
    "node",
    wrangler,
    "dev",
    "--local",
    "--config",
    configPath,
    "--persist-to",
    stateRoot,
    "--port",
    new URL(e2eRuntimeOrigins.apiOrigin).port,
  ],
  { stdin: "ignore", stdout: "inherit", stderr: "inherit" }
)
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => child.kill(signal))
process.exitCode = await child.exited
