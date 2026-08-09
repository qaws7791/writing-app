import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

for (const directory of [
  path.join(process.cwd(), ".next", "types"),
  path.join(process.cwd(), ".next", "dev", "types"),
]) {
  fs.rmSync(directory, { force: true, recursive: true })
}

const nextCliPath = path.join(process.cwd(), "node_modules/next/dist/bin/next")
const result = spawnSync(process.execPath, [nextCliPath, "typegen"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: "https://assets.example.test",
    CONTENT_ASSET_PUBLIC_BASE_URL: "https://assets.example.test",
  },
  stdio: "inherit",
})

if (result.error !== undefined) throw result.error
process.exitCode = result.status ?? 1
