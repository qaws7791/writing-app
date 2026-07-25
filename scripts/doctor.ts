import { existsSync } from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const requiredEnvironmentFiles = [
  "apps/api/.env",
  "apps/web/.env",
  "apps/admin/.env",
] as const

for (const file of requiredEnvironmentFiles) {
  if (!existsSync(path.join(repositoryRoot, file))) {
    throw new Error(`${file}이 없습니다. bun run setup을 실행하세요.`)
  }
}

const inspection = Bun.spawn(
  ["bun", "--filter", "@workspace/api", "db:inspect"],
  {
    cwd: repositoryRoot,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  }
)
if ((await inspection.exited) !== 0) {
  throw new Error("로컬 DB schema 또는 무결성 진단에 실패했습니다.")
}

console.log(`✓ Bun ${Bun.version}, Node.js ${process.versions.node}`)
console.log("로컬 개발 환경 진단을 통과했습니다.")
