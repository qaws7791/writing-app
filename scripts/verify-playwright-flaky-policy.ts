import { deepStrictEqual, equal, match, notEqual } from "node:assert/strict"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const playwrightOutput = path.join(repositoryRoot, "output", "playwright")
const policyResults = path.join(playwrightOutput, "flaky-policy-test-results")

await verifyRunnerOnlyGuard()

const [localConfiguration, ciConfiguration] = await Promise.all([
  loadConfiguration(false),
  loadConfiguration(true),
])

deepStrictEqual(localConfiguration, {
  failOnFlakyTests: false,
  retries: 0,
  trace: "on-first-retry",
  workers: 1,
})
deepStrictEqual(ciConfiguration, {
  failOnFlakyTests: true,
  retries: 1,
  trace: "on-first-retry",
  workers: 1,
})

await mkdir(playwrightOutput, { recursive: true })
await rm(policyResults, { force: true, recursive: true })

const fixtureDirectory = await mkdtemp(
  path.join(playwrightOutput, "flaky-policy-fixture-")
)

try {
  const fixtureConfig = path.join(fixtureDirectory, "playwright.config.ts")
  const fixtureSpec = path.join(fixtureDirectory, "flaky-policy.spec.ts")

  await writeFile(
    fixtureConfig,
    createFixtureConfig(ciConfiguration, fixtureDirectory),
    "utf8"
  )
  await writeFile(fixtureSpec, createFixtureSpec(), "utf8")

  const playwright = Bun.spawn({
    cmd: [
      process.execPath,
      "x",
      "playwright",
      "test",
      "--config",
      fixtureConfig,
    ],
    cwd: repositoryRoot,
    env: { ...process.env, CI: "true" },
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    playwright.exited,
    new Response(playwright.stdout).text(),
    new Response(playwright.stderr).text(),
  ])
  const output = `${stdout}${stderr}`

  process.stdout.write(output)

  equal(exitCode, 1, "flaky test를 포함한 CI 실행은 실패해야 합니다.")
  match(output, /CI flaky 정책 검증 fixture/u)
  match(output, /Expected:\s+1/u)
  match(output, /Received:\s+0/u)
  match(output, /1 flaky/u)

  const traceFiles = await findFiles(policyResults, "trace.zip")
  equal(traceFiles.length, 1, "첫 retry trace가 정확히 하나 생성되어야 합니다.")

  process.stdout.write(
    `Playwright flaky 정책 검증 통과: ${path.relative(repositoryRoot, traceFiles[0] ?? policyResults)}\n`
  )
} finally {
  await rm(fixtureDirectory, { force: true, recursive: true })
}

interface PlaywrightFlakyPolicy {
  readonly failOnFlakyTests: boolean | undefined
  readonly retries: number | undefined
  readonly trace: unknown
  readonly workers: number | string | undefined
}

async function verifyRunnerOnlyGuard(): Promise<void> {
  const environment = { ...process.env }
  delete environment["E2E_RUN_ROOT"]

  const evaluation = Bun.spawn({
    cmd: [
      process.execPath,
      "--eval",
      `await import(${JSON.stringify(playwrightConfigUrl())})`,
    ],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    evaluation.exited,
    new Response(evaluation.stdout).text(),
    new Response(evaluation.stderr).text(),
  ])

  notEqual(
    exitCode,
    0,
    "E2E runner guard 없이 Playwright 설정을 읽으면 안 됩니다."
  )
  match(`${stdout}${stderr}`, /E2E_RUN_ROOT이 없습니다/u)
}

async function loadConfiguration(
  isCi: boolean
): Promise<PlaywrightFlakyPolicy> {
  const marker = "playwright-flaky-policy:"
  const environment = {
    ...process.env,
    E2E_RUN_ROOT: path.join(playwrightOutput, "flaky-policy-config"),
  }
  delete environment["CI"]
  if (isCi) environment["CI"] = "true"

  const evaluation = Bun.spawn({
    cmd: [
      process.execPath,
      "--eval",
      `const config = (await import(${JSON.stringify(playwrightConfigUrl())})).default;
process.stdout.write(${JSON.stringify(marker)} + JSON.stringify({
  failOnFlakyTests: config.failOnFlakyTests,
  retries: config.retries,
  trace: config.use?.trace,
  workers: config.workers,
}));`,
    ],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    evaluation.exited,
    new Response(evaluation.stdout).text(),
    new Response(evaluation.stderr).text(),
  ])

  if (exitCode !== 0 || !stdout.startsWith(marker)) {
    throw new Error(`Playwright 설정 조회 실패\n${stdout}\n${stderr}`)
  }

  const policy = JSON.parse(stdout.slice(marker.length)) as unknown
  if (!isPlaywrightFlakyPolicy(policy)) {
    throw new Error(`Playwright flaky 정책 형식 오류: ${stdout}`)
  }

  return policy
}

function playwrightConfigUrl(): string {
  return pathToFileURL(path.join(repositoryRoot, "playwright.config.ts")).href
}

function createFixtureConfig(
  configuration: PlaywrightFlakyPolicy,
  fixtureDirectory: string
): string {
  return `import { defineConfig } from "@playwright/test"

export default defineConfig({
  failOnFlakyTests: ${JSON.stringify(configuration.failOnFlakyTests)},
  outputDir: ${JSON.stringify(policyResults)},
  reporter: [["list"]],
  retries: ${JSON.stringify(configuration.retries)},
  testDir: ${JSON.stringify(fixtureDirectory)},
  timeout: 10_000,
  use: {
    trace: ${JSON.stringify(configuration.trace)},
  },
  workers: ${JSON.stringify(configuration.workers)},
})
`
}

function isPlaywrightFlakyPolicy(
  value: unknown
): value is PlaywrightFlakyPolicy {
  if (typeof value !== "object" || value === null) return false

  const policy = value as Partial<PlaywrightFlakyPolicy>
  return (
    typeof policy.failOnFlakyTests === "boolean" &&
    typeof policy.retries === "number" &&
    typeof policy.trace === "string" &&
    (typeof policy.workers === "number" || typeof policy.workers === "string")
  )
}

function createFixtureSpec(): string {
  return `import { expect, test } from "@playwright/test"

test("CI flaky 정책 검증 fixture", async ({ page }, testInfo) => {
  await page.goto("data:text/html,<main>flaky policy</main>")
  await expect(page.getByText("flaky policy")).toBeVisible()
  expect(testInfo.retry).toBe(1)
})
`
}

async function findFiles(
  directory: string,
  fileName: string
): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findFiles(entryPath, fileName)))
    } else if (entry.name === fileName) {
      files.push(entryPath)
    }
  }

  return files
}
