import { spawnSync } from "node:child_process"
const scope = process.argv[2]
if (scope !== "full" && scope !== "production")
  throw new Error("full 또는 production이 필요합니다.")
const result = spawnSync(
  process.execPath,
  [
    "audit",
    ...(scope === "production" ? ["--prod"] : []),
    "--audit-level=high",
  ],
  { stdio: "inherit" }
)
if (result.error !== undefined) throw result.error
process.exitCode = result.status ?? 1
