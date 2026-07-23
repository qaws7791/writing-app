import { existsSync } from "node:fs"
import path from "node:path"

export const removedDbInfrastructurePaths = [
  "packages/infra/db/drizzle.config.ts",
  "packages/infra/db/src/migrations",
  "packages/infra/db/src/schema",
  "packages/infra/db/src/seeds",
] as const

export function findReintroducedDbInfrastructurePaths(
  repositoryRoot: string
): readonly string[] {
  return removedDbInfrastructurePaths.filter((relativePath) =>
    existsSync(path.join(repositoryRoot, relativePath))
  )
}
