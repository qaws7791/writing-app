import path from "node:path"

const databaseUrl = readRequiredEnvironment("E2E_DATABASE_URL")
const setupScripts = [
  "apps/api/src/scripts/setup-e2e-content-database.ts",
  "apps/api/src/scripts/setup-e2e-database.ts",
] as const

for (const setupScript of setupScripts) {
  const setup = Bun.spawn(["bun", setupScript], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      NODE_ENV: "test",
    },
    stderr: "inherit",
    stdout: "inherit",
  })

  if ((await setup.exited) !== 0) {
    throw new Error(`E2E fixture를 준비하지 못했습니다: ${setupScript}`)
  }
}

Bun.serve({
  fetch: () => new Response("ready"),
  hostname: "127.0.0.1",
  port: 4199,
})

function readRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(`${name}이 없어 E2E fixture를 준비할 수 없습니다.`)
  }

  return path.resolve(value)
}
