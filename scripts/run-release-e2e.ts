import {
  releaseE2eProjects,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"
import { e2eRuntime } from "#e2e/runtime"

const releaseBuildEnvironment = {
  ...process.env,
  ADMIN_ORIGIN: e2eRuntime.adminOrigin,
  API_BASE_URL: e2eRuntime.apiOrigin,
  CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: e2eRuntime.assetOrigin,
  CONTENT_ASSET_PUBLIC_BASE_URL: `${e2eRuntime.assetOrigin}/content-assets`,
  NEXT_PUBLIC_LEARNER_WEB_ORIGIN: e2eRuntime.learnerOrigin,
  NODE_ENV: "test",
  WEB_ORIGIN: e2eRuntime.learnerOrigin,
}

for (const application of ["web", "admin"] as const) {
  await run(
    ["bun", "--filter", `@workspace/${application}`, "build"],
    releaseBuildEnvironment
  )
}

for (const project of releaseE2eProjects) {
  console.log(`격리된 Playwright release project 시작: ${project}`)
  await runReleaseProject(project)
}

function runReleaseProject(project: ReleaseE2eProject): Promise<void> {
  return run([
    "bun",
    "scripts/run-e2e.ts",
    "--runtime",
    "standalone",
    "--project",
    project,
  ])
}

async function run(
  command: readonly string[],
  environment: Readonly<NodeJS.ProcessEnv> = process.env
): Promise<void> {
  const child = Bun.spawn([...command], {
    cwd: process.cwd(),
    env: environment,
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  if ((await child.exited) !== 0) {
    throw new Error(`${command.join(" ")} 명령이 실패했습니다.`)
  }
}
