import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { chromium } from "@playwright/test"
import { e2eCredentials, e2eRuntime } from "#e2e/runtime"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const runRoot = await mkdtemp(path.join(tmpdir(), "writing-app-lighthouse-"))
const databaseUrl = path.join(runRoot, "writing-app.sqlite")
const sharedEnvironment = {
  E2E_DATABASE_URL: databaseUrl,
  E2E_RUN_ROOT: runRoot,
}
const processes: Bun.Subprocess[] = []
let exitCode = 1

try {
  await start(
    ["bun", "e2e/fixture-server.ts"],
    sharedEnvironment,
    e2eRuntime.assetOrigin
  )
  await start(
    ["bun", "apps/api/src/test-support/start-e2e-api.ts"],
    {
      ...sharedEnvironment,
      ADMIN_AUTH_SECRET: "lighthouse-admin-auth-secret-must-have-32-characters",
      ADMIN_ORIGIN: e2eRuntime.adminOrigin,
      API_PORT: new URL(e2eRuntime.apiOrigin).port,
      DATABASE_URL: databaseUrl,
      LEARNER_AUTH_SECRET:
        "lighthouse-learner-auth-secret-must-have-32-characters",
      NODE_ENV: "test",
      WEB_ORIGIN: e2eRuntime.learnerOrigin,
    },
    `${e2eRuntime.apiOrigin}/api/health`
  )
  await start(
    ["node", "scripts/run-next-standalone.mjs", "web"],
    {
      ...sharedEnvironment,
      API_BASE_URL: e2eRuntime.apiOrigin,
      CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: "https://assets.example.test",
      CONTENT_ASSET_PUBLIC_BASE_URL:
        "https://assets.example.test/content-assets",
      HOSTNAME: "localhost",
      NODE_ENV: "production",
      PORT: new URL(e2eRuntime.learnerOrigin).port,
      WEB_ORIGIN: e2eRuntime.learnerOrigin,
    },
    e2eRuntime.learnerOrigin
  )

  const lighthouse = Bun.spawn(
    ["bunx", "lhci", "autorun", "--config=lighthouse-ci.config.cjs"],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        LIGHTHOUSE_AUTH_COOKIE: await createLearnerSessionCookie(),
        LIGHTHOUSE_CHROME_PATH: chromium.executablePath(),
      },
      stderr: "inherit",
      stdout: "inherit",
    }
  )
  exitCode = await lighthouse.exited
} finally {
  for (const childProcess of processes.reverse()) childProcess.kill()
  await Promise.allSettled(processes.map((childProcess) => childProcess.exited))
  await rm(runRoot, { force: true, recursive: true })
}

process.exit(exitCode)

async function start(
  command: readonly string[],
  environment: Readonly<Record<string, string>>,
  readinessUrl: string
): Promise<void> {
  const childProcess = Bun.spawn([...command], {
    cwd: repositoryRoot,
    env: { ...process.env, ...environment },
    stderr: "inherit",
    stdout: "inherit",
  })
  processes.push(childProcess)
  await waitFor(readinessUrl, childProcess)
}

async function waitFor(
  url: string,
  childProcess: Bun.Subprocess
): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const response = await fetch(url).catch(() => undefined)
    if (response?.ok) return
    if (childProcess.exitCode !== null) {
      throw new Error(`${url} 서버가 준비 전에 종료되었습니다.`)
    }
    await Bun.sleep(1_000)
  }
  throw new Error(`${url}이 준비되지 않았습니다.`)
}

async function createLearnerSessionCookie(): Promise<string> {
  const response = await fetch(
    new URL("/api/auth/sign-in/email", e2eRuntime.apiOrigin),
    {
      body: JSON.stringify({
        email: e2eCredentials.learnerEmail,
        password: e2eCredentials.learnerPassword,
      }),
      headers: {
        "Content-Type": "application/json",
        Origin: e2eRuntime.learnerOrigin,
        "X-Writing-App-Client-IP": "127.0.0.91",
      },
      method: "POST",
    }
  )
  if (!response.ok) throw new Error("Lighthouse 학습자 로그인에 실패했습니다.")

  const cookies = response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter((value): value is string => Boolean(value))
  if (cookies.length === 0) throw new Error("Lighthouse cookie가 없습니다.")
  return cookies.join("; ")
}
