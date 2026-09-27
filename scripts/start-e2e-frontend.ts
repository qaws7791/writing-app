import type { Unstable_RawConfig } from "wrangler"
import path from "node:path"
import { writeFile } from "node:fs/promises"
import { e2eRuntime, readRequiredE2eEnvironment } from "#e2e/runtime"

const app = process.argv[2]
if (app !== "web" && app !== "admin")
  throw new Error("web 또는 admin이 필요합니다.")
const runRoot = path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT"))
const appRoot = path.resolve(import.meta.dir, "../apps", app)
const preview = process.env["E2E_RUNTIME"] === "preview"
const sourcePath = path.join(
  appRoot,
  preview ? "dist/server/wrangler.json" : "wrangler.jsonc"
)
const config = Bun.JSONC.parse(
  await Bun.file(sourcePath).text()
) as Unstable_RawConfig
if (config.main === undefined) throw new Error("Worker entry가 없습니다.")
config.main = path.resolve(path.dirname(sourcePath), config.main)
if (config.assets?.directory)
  config.assets.directory = path.resolve(
    path.dirname(sourcePath),
    config.assets.directory
  )
config.name = "writing-app-" + app + "-e2e"
config.services = [{ binding: "API", service: "writing-app-api-e2e" }]
config.vars = {
  ...config.vars,
  WEB_ORIGIN: e2eRuntime.learnerOrigin,
  ADMIN_ORIGIN: e2eRuntime.adminOrigin,
}
delete config.env
const configPath = path.join(runRoot, app + ".json")
await writeFile(configPath, JSON.stringify(config))
const origin = new URL(
  app === "web" ? e2eRuntime.learnerOrigin : e2eRuntime.adminOrigin
)
const command = preview
  ? [
      "node",
      path.resolve(appRoot, "../../node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--local",
      "--config",
      configPath,
      "--port",
      origin.port,
      "--ip",
      origin.hostname,
    ]
  : [
      "node",
      path.resolve(appRoot, "node_modules/next/dist/bin/next"),
      "dev",
      "--hostname",
      origin.hostname,
      "--port",
      origin.port,
    ]
const child = Bun.spawn(command, {
  cwd: appRoot,
  env: {
    ...process.env,
    CLOUDFLARE_CONFIG: configPath,
    API_BASE_URL: e2eRuntime.apiOrigin,
    WEB_ORIGIN: e2eRuntime.learnerOrigin,
    ADMIN_ORIGIN: e2eRuntime.adminOrigin,
    CONTENT_ASSET_PUBLIC_BASE_URL: e2eRuntime.apiOrigin + "/assets/content",
    CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: e2eRuntime.apiOrigin,
  },
  stdin: "ignore",
  stdout: "inherit",
  stderr: "inherit",
})
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => child.kill(signal))
process.exitCode = await child.exited
