import path from "node:path"

const databaseUrl = path.resolve("data/e2e/writing-app.sqlite")
const setupScripts = [
  "packages/db/src/scripts/setup-e2e-database.ts",
  "apps/admin-api/src/scripts/setup-e2e-database.ts",
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
