import { spawnSync } from "node:child_process"
import path from "node:path"

export function formatGeneratedFile(filePath: string) {
  const command = path.resolve(
    import.meta.dirname,
    "../../../node_modules/.bin/oxfmt.exe"
  )

  const result = spawnSync(command, [filePath], {
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`Failed to format generated file: ${filePath}`)
  }
}
