import { spawnSync } from "node:child_process"
import path from "node:path"

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
