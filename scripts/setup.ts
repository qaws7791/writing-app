import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const environmentFiles = [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env"],
  ["apps/admin/.env.example", "apps/admin/.env"],
] as const

for (const [examplePath, targetPath] of environmentFiles) {
  const target = path.join(repositoryRoot, targetPath)
  if (existsSync(target)) {
    console.log(`- 보존: ${targetPath}`)
    continue
  }

  let content = readFileSync(path.join(repositoryRoot, examplePath), "utf8")
  if (targetPath === "apps/api/.env") {
    content = replaceEnvironmentValue(
      content,
      "LEARNER_AUTH_SECRET",
      createSecret()
    )
    content = replaceEnvironmentValue(
      content,
      "ADMIN_AUTH_SECRET",
      createSecret()
    )
    content = replaceEnvironmentValue(
      content,
      "CURSOR_SIGNING_SECRET",
      createSecret()
    )
    content = replaceEnvironmentValue(
      content,
      "ADMIN_SEED_PASSWORD",
      `${createSecret()}Aa1!`
    )
    content = replaceEnvironmentValue(
      content,
      "ADMIN_SEED_RESET_PASSWORD",
      "false"
    )
  }

  writeFileSync(target, content, { encoding: "utf8", flag: "wx", mode: 0o600 })
  console.log(`- 생성: ${targetPath}`)
}

mkdirSync(path.join(repositoryRoot, "data"), { recursive: true })
await run(["bun", "install", "--frozen-lockfile"])
await run(["bun", "run", "dev:admin:setup"])
await run(["bun", "run", "doctor"])

console.log("로컬 준비가 완료되었습니다. bun run dev를 실행하세요.")

function createSecret(): string {
  return randomBytes(32).toString("base64url")
}

function replaceEnvironmentValue(
  content: string,
  name: string,
  value: string
): string {
  const pattern = new RegExp(`^${name}=.*$`, "mu")
  if (!pattern.test(content)) throw new Error(`${name} 예시가 없습니다.`)
  return content.replace(pattern, `${name}=${value}`)
}

async function run(command: readonly string[]): Promise<void> {
  console.log(`\n> ${command.join(" ")}`)
  const child = Bun.spawn([...command], {
    cwd: repositoryRoot,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  if ((await child.exited) !== 0) {
    throw new Error(`${command.join(" ")} 명령이 실패했습니다.`)
  }
}
