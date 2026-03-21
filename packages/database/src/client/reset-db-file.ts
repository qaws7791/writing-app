import { rmSync } from "node:fs"
import { resolve } from "node:path"

export function resetDatabaseFile(path: string): void {
  rmSync(resolve(path), {
    force: true,
  })
}
