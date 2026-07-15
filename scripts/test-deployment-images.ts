import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export type DeploymentServiceName = "admin" | "admin-api" | "api" | "web"

export interface DeploymentImageSpec {
  readonly buildArguments: readonly (readonly [name: string, value: string])[]
  readonly dockerfile: string
  readonly healthPort: number
  readonly name: DeploymentServiceName
  readonly runtime: "bun" | "node"
  readonly staticPaths: readonly string[]
  readonly usesDatabase: boolean
}

interface CommandResult {
  readonly stderr: string
  readonly stdout: string
  readonly success: boolean
}

interface ImageSmokeFixture extends Disposable {
  readonly dataDirectory: string
}

const expectedRuntimeUser = "10001:10001"

export const deploymentImageSpecs: readonly DeploymentImageSpec[] = [
  {
    buildArguments: [
      ["NEXT_PUBLIC_API_BASE_URL", "https://api.example.test"],
      ["WEB_API_BASE_URL", "http://api:4000"],
      ["WEB_ORIGIN", "https://web.example.test"],
    ],
    dockerfile: "deploy/docker/web.dockerfile",
    healthPort: 3000,
    name: "web",
    runtime: "node",
    staticPaths: [
      "/workspace/apps/web/.next/static",
      "/workspace/apps/web/public/course-thumbnails/vocabulary-basics.png",
    ],
    usesDatabase: false,
  },
  {
    buildArguments: [],
    dockerfile: "deploy/docker/api.dockerfile",
    healthPort: 4000,
    name: "api",
    runtime: "bun",
    staticPaths: [],
    usesDatabase: true,
  },
  {
    buildArguments: [
      ["NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin-api.example.test"],
      ["NEXT_PUBLIC_LEARNER_WEB_ORIGIN", "https://web.example.test"],
      ["ADMIN_API_BASE_URL", "http://admin-api:4001"],
      ["ADMIN_ORIGIN", "https://admin.example.test"],
    ],
    dockerfile: "deploy/docker/admin.dockerfile",
    healthPort: 3001,
    name: "admin",
    runtime: "node",
    staticPaths: ["/workspace/apps/admin/.next/static"],
    usesDatabase: false,
  },
  {
    buildArguments: [],
    dockerfile: "deploy/docker/admin-api.dockerfile",
    healthPort: 4001,
    name: "admin-api",
    runtime: "bun",
    staticPaths: [],
    usesDatabase: true,
  },
]

export function createImageBuildArguments(
  spec: DeploymentImageSpec,
  imageReference: string,
  repositoryRoot: string
): readonly string[] {
  return [
    "buildx",
    "build",
    "--load",
    "--platform",
    "linux/amd64",
    "--file",
    path.join(repositoryRoot, spec.dockerfile),
    "--tag",
    imageReference,
    ...spec.buildArguments.flatMap(([name, value]) => [
      "--build-arg",
      `${name}=${value}`,
    ]),
    repositoryRoot,
  ]
}

export function createContainerRunArguments(
  spec: DeploymentImageSpec,
  imageReference: string,
  containerName: string,
  dataDirectory: string,
  environment: readonly (readonly [name: string, value: string])[]
): readonly string[] {
  return [
    "run",
    "--detach",
    "--init",
    "--name",
    containerName,
    "--network",
    "none",
    ...(spec.usesDatabase
      ? [
          "--mount",
          `type=bind,source=${dataDirectory},target=/var/lib/writing-app`,
        ]
      : []),
    ...environment.flatMap(([name, value]) => ["--env", `${name}=${value}`]),
    imageReference,
  ]
}

export function isExpectedRuntimeUser(imageUser: string): boolean {
  return imageUser.trim() === expectedRuntimeUser
}

export function createRuntimeEnvironment(
  spec: DeploymentImageSpec,
  learnerSecret: string,
  adminSecret: string
): readonly (readonly [name: string, value: string])[] {
  const publicEnvironment = [
    ["NODE_ENV", "production"],
    ["ENABLE_TEST_AUTH", "false"],
    ["WEB_ORIGIN", "https://web.example.test"],
    ["ADMIN_ORIGIN", "https://admin.example.test"],
  ] as const
  const apiEnvironment = [
    ...publicEnvironment,
    ["BETTER_AUTH_URL", "https://api.example.test"],
    ["ADMIN_BETTER_AUTH_URL", "https://admin-api.example.test"],
    ["BETTER_AUTH_SECRET", learnerSecret],
    ["ADMIN_BETTER_AUTH_SECRET", adminSecret],
    ["OPENAI_MODEL", "gpt-5.2"],
    ["LOG_PRETTY", "false"],
  ] as const

  switch (spec.name) {
    case "web":
      return [
        ...publicEnvironment,
        ["PORT", "3000"],
        ["NEXT_PUBLIC_API_BASE_URL", "https://api.example.test"],
        ["WEB_API_BASE_URL", "http://api:4000"],
      ]
    case "admin":
      return [
        ...publicEnvironment,
        ["PORT", "3001"],
        ["NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://admin-api.example.test"],
        ["NEXT_PUBLIC_LEARNER_WEB_ORIGIN", "https://web.example.test"],
        ["ADMIN_API_BASE_URL", "http://admin-api:4001"],
      ]
    case "api":
      return [
        ...apiEnvironment,
        ["API_PORT", "4000"],
        ["DATABASE_URL", "file:/var/lib/writing-app/api.sqlite"],
      ]
    case "admin-api":
      return [
        ...apiEnvironment,
        ["ADMIN_API_PORT", "4001"],
        ["DATABASE_URL", "file:/var/lib/writing-app/api.sqlite"],
      ]
  }
}

function createImageSmokeFixture(): ImageSmokeFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-images-"))
  const dataDirectory = path.join(root, "data")
  fs.mkdirSync(dataDirectory)
  fs.chmodSync(dataDirectory, 0o777)

  return {
    dataDirectory: toDockerPath(dataDirectory),
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}

function toDockerPath(filePath: string): string {
  return filePath.replaceAll("\\", "/")
}

function runDocker(
  args: readonly string[],
  options: { readonly capture?: boolean; readonly required?: boolean } = {}
): CommandResult {
  const capture = options.capture ?? false
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    env: { ...process.env, DOCKER_BUILDKIT: "1" },
    stdio: capture ? "pipe" : "inherit",
    windowsHide: true,
  })
  const commandResult = {
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    success: result.error === undefined && result.status === 0,
  }

  if (options.required !== false && !commandResult.success) {
    const detail =
      commandResult.stderr.trim() ||
      result.error?.message ||
      `docker 명령이 exit code ${result.status ?? "unknown"}로 실패했습니다.`
    throw new Error(detail)
  }

  return commandResult
}

function assertImageUser(imageReference: string): void {
  const result = runDocker(
    ["image", "inspect", "--format", "{{.Config.User}}", imageReference],
    { capture: true }
  )
  if (!isExpectedRuntimeUser(result.stdout)) {
    throw new Error(
      `${imageReference}: runtime user는 ${expectedRuntimeUser}여야 합니다.`
    )
  }
}

function assertStaticPaths(
  spec: DeploymentImageSpec,
  imageReference: string
): void {
  for (const staticPath of spec.staticPaths) {
    const check = staticPath.endsWith("/.next/static")
      ? `test -d '${staticPath}' && test -n "$(find '${staticPath}' -type f -print -quit)"`
      : `test -f '${staticPath}'`
    runDocker([
      "run",
      "--rm",
      "--entrypoint",
      "sh",
      imageReference,
      "-c",
      check,
    ])
  }
}

async function waitForContainerHealth(
  spec: DeploymentImageSpec,
  containerName: string
): Promise<void> {
  const runtime = spec.runtime === "node" ? "node" : "bun"
  const healthScript = [
    `const response=await fetch('http://127.0.0.1:${spec.healthPort}/health');`,
    "if(!response.ok)process.exit(1);",
  ].join("")

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = runDocker(
      ["exec", containerName, runtime, "-e", healthScript],
      { capture: true, required: false }
    )
    if (result.success) return

    const state = runDocker(
      ["inspect", "--format", "{{.State.Running}}", containerName],
      { capture: true, required: false }
    )
    if (state.success && state.stdout.trim() === "false") break
    await Bun.sleep(1_000)
  }

  const logs = runDocker(["logs", containerName], {
    capture: true,
    required: false,
  })
  throw new Error(
    `${spec.name}: /health가 준비되지 않았습니다.\n${logs.stdout}${logs.stderr}`
  )
}

function assertContainerUser(containerName: string): void {
  const result = runDocker(["exec", containerName, "id", "-u"], {
    capture: true,
  })
  if (result.stdout.trim() !== "10001") {
    throw new Error(`${containerName}: runtime UID가 10001이 아닙니다.`)
  }
}

async function runDeploymentImageTests(): Promise<void> {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const runId = `${process.pid}-${Date.now()}`
  const learnerSecret = createSmokeSecret()
  let adminSecret = createSmokeSecret()
  while (adminSecret === learnerSecret) adminSecret = createSmokeSecret()
  const ownedContainers = new Set<string>()
  const ownedImages = new Set<string>()

  runDocker(["info", "--format", "{{.ServerVersion}}"])

  using fixture = createImageSmokeFixture()
  try {
    for (const spec of deploymentImageSpecs) {
      const imageReference = `writing-app-smoke-${spec.name}:${runId}`
      const containerName = `writing-app-smoke-${spec.name}-${runId}`
      ownedImages.add(imageReference)

      console.log(`${spec.name}: linux/amd64 image를 빌드합니다.`)
      runDocker(createImageBuildArguments(spec, imageReference, repositoryRoot))
      assertImageUser(imageReference)
      assertStaticPaths(spec, imageReference)

      ownedContainers.add(containerName)
      runDocker(
        createContainerRunArguments(
          spec,
          imageReference,
          containerName,
          fixture.dataDirectory,
          createRuntimeEnvironment(spec, learnerSecret, adminSecret)
        )
      )
      await waitForContainerHealth(spec, containerName)
      assertContainerUser(containerName)
      runDocker(["rm", "--force", containerName])
      ownedContainers.delete(containerName)
      console.log(
        `${spec.name}: 비 root runtime과 /health 검증을 통과했습니다.`
      )
    }
  } finally {
    for (const containerName of ownedContainers) {
      runDocker(["rm", "--force", containerName], { required: false })
    }
    for (const imageReference of ownedImages) {
      runDocker(["image", "rm", "--force", imageReference], {
        required: false,
      })
    }
  }

  console.log("네 production image smoke 검증을 통과했습니다.")
}

function createSmokeSecret(): string {
  return `0123456789abcdef${randomBytes(32).toString("hex")}`
}

if (import.meta.main) {
  try {
    await runDeploymentImageTests()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
