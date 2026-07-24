import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { courseVisualKeyValues } from "@workspace/contracts/content/course"

import {
  readContainerImageLock,
  requireLockedContainerImageReference,
} from "./check-container-image-lock"
import { readImageReleaseManifest } from "./image-release-metadata"

type DeploymentServiceName = "admin" | "api" | "web"

interface DeploymentImageSpec {
  readonly buildArguments: readonly (readonly [name: string, value: string])[]
  readonly dockerfile: string
  readonly forbiddenPaths: readonly string[]
  readonly healthPath: string
  readonly healthPort: number
  readonly name: DeploymentServiceName
  readonly optimizedImagePath?: string
  readonly runtime: "bun" | "node"
  readonly runtimeArtifactPaths: readonly string[]
  readonly staticPaths: readonly string[]
  readonly staticResponses: readonly StaticResponseSpec[]
  readonly usesDatabase: boolean
}

interface StaticResponseSpec {
  readonly cacheControl: string
  readonly contentType: string
  readonly path: string
}

interface CommandResult {
  readonly stderr: string
  readonly stdout: string
  readonly success: boolean
}

interface ImageSmokeFixture extends Disposable {
  readonly dataDirectory: string
}

interface ComposeSmokeImageReferences {
  readonly admin: string
  readonly api: string
  readonly web: string
}

interface ComposeSmokeEnvironmentInput {
  readonly backupDirectory: string
  readonly caddyImage: string
  readonly configDirectory: string
  readonly dataDirectory: string
  readonly images: ComposeSmokeImageReferences
  readonly runId: string
}

interface ComposeSmokeFixture extends Disposable {
  readonly command: ComposeSmokeCommand
}

interface ComposeSmokeCommand {
  readonly composeEnvironmentPath: string
  readonly composePath: string
  readonly projectName: string
}

const expectedRuntimeUser = "10001:10001"
const runtimeSecretEnvironmentNames = [
  "ADMIN_ASSET_S3_ACCESS_KEY",
  "ADMIN_ASSET_S3_SECRET_KEY",
  "ADMIN_AUTH_SECRET",
  "CURSOR_SIGNING_SECRET",
  "DELETION_MARKER_S3_ACCESS_KEY",
  "DELETION_MARKER_S3_SECRET_KEY",
  "GOOGLE_CLIENT_SECRET",
  "LEARNER_AUTH_SECRET",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
] as const
const apiOnlyEnvironmentNames = [
  "ADMIN_ASSET_PUBLIC_BASE_URL",
  "ADMIN_ASSET_S3_ACCESS_KEY",
  "ADMIN_ASSET_S3_BUCKET",
  "ADMIN_ASSET_S3_ENDPOINT",
  "ADMIN_ASSET_S3_REGION",
  "ADMIN_ASSET_S3_SECRET_KEY",
  "ADMIN_AUTH_SECRET",
  "AI_FEEDBACK_GLOBAL_DAILY_REQUEST_LIMIT",
  "AI_FEEDBACK_GLOBAL_DAILY_SUCCESS_LIMIT",
  "AI_FEEDBACK_PENDING_TTL_MS",
  "AI_FEEDBACK_PROVIDER_TIMEOUT_MS",
  "AI_FEEDBACK_USER_DAILY_REQUEST_LIMIT",
  "AI_FEEDBACK_USER_DAILY_SUCCESS_LIMIT",
  "AUTH_EMAIL_FROM",
  "AUTH_EMAIL_REPLY_TO",
  "CURSOR_SIGNING_SECRET",
  "DELETION_MARKER_S3_ACCESS_KEY",
  "DELETION_MARKER_S3_BUCKET",
  "DELETION_MARKER_S3_ENDPOINT",
  "DELETION_MARKER_S3_PREFIX",
  "DELETION_MARKER_S3_REGION",
  "DELETION_MARKER_S3_SECRET_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "LEARNER_AUTH_SECRET",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
] as const
const courseThumbnailFileNames = courseVisualKeyValues.map(
  (visualKey) => `${visualKey}.png`
)

const composeSmokeRoutes = [
  {
    expectedResponse: { ok: true, service: "web" },
    host: "web.example.test",
    path: "/health",
  },
  {
    expectedResponse: {
      checks: { database: "ready" },
      impact: "none",
      ok: true,
    },
    host: "web.example.test",
    path: "/api/health",
  },
  {
    expectedResponse: { ok: true, service: "admin" },
    host: "admin.example.test",
    path: "/health",
  },
  {
    expectedResponse: {
      checks: { database: "ready" },
      impact: "none",
      ok: true,
      service: "api",
    },
    host: "admin.example.test",
    path: "/api/admin/health",
  },
] as const

const deploymentImageSpecs: readonly DeploymentImageSpec[] = [
  {
    buildArguments: [
      ["API_BASE_URL", "http://api:4000"],
      ["WEB_ORIGIN", "https://web.example.test"],
      [
        "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS",
        "https://staging-assets.example.test,https://assets.example.test",
      ],
    ],
    dockerfile: "deploy/docker/web.dockerfile",
    forbiddenPaths: [
      "/workspace/apps/admin",
      "/workspace/apps/api",
      "/workspace/packages/modules",
    ],
    healthPath: "/health",
    healthPort: 3000,
    name: "web",
    optimizedImagePath: "/course-thumbnails/expression.png",
    runtime: "node",
    runtimeArtifactPaths: [],
    staticPaths: [
      "/workspace/apps/web/.next/static",
      "/workspace/apps/web/public/course-thumbnails/vocabulary-basics.png",
    ],
    staticResponses: [],
    usesDatabase: false,
  },
  {
    buildArguments: [],
    dockerfile: "deploy/docker/api.dockerfile",
    runtimeArtifactPaths: [
      "/workspace/bin/api",
      "/workspace/bin/database-backup",
      "/workspace/bin/database-check",
      "/workspace/bin/database-integrity-check",
      "/workspace/bin/database-migrate",
      "/workspace/bin/database-seed",
      "/workspace/bin/deletion-marker-restore",
      "/workspace/bin/maintenance-daily",
      "/workspace/bin/owner-seed",
      "/workspace/node_modules/prismjs/package.json",
    ],
    forbiddenPaths: [
      "/workspace/apps",
      "/workspace/package.json",
      "/workspace/packages",
    ],
    healthPath: "/api/health",
    healthPort: 4000,
    name: "api",
    runtime: "bun",
    staticPaths: [],
    staticResponses: [],
    usesDatabase: true,
  },
  {
    buildArguments: [
      ["NEXT_PUBLIC_LEARNER_WEB_ORIGIN", "https://web.example.test"],
      ["API_BASE_URL", "http://api:4000"],
      ["ADMIN_ORIGIN", "https://admin.example.test"],
      [
        "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS",
        "https://staging-assets.example.test,https://assets.example.test",
      ],
    ],
    dockerfile: "deploy/docker/admin.dockerfile",
    forbiddenPaths: [
      "/workspace/apps/api",
      "/workspace/apps/web",
      "/workspace/packages/modules",
    ],
    healthPath: "/health",
    healthPort: 3001,
    name: "admin",
    optimizedImagePath: "/course-thumbnails/expression.png",
    runtime: "node",
    runtimeArtifactPaths: [],
    staticPaths: [
      "/workspace/apps/admin/.next/static",
      ...courseThumbnailFileNames.map(
        (fileName) =>
          `/workspace/apps/admin/public/course-thumbnails/${fileName}`
      ),
    ],
    staticResponses: courseThumbnailFileNames.map((fileName) => ({
      cacheControl: "public, max-age=31536000, immutable",
      contentType: "image/png",
      path: `/course-thumbnails/${fileName}`,
    })),
    usesDatabase: false,
  },
]

function createImageBuildArguments(
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

function createContainerRunArguments(
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

function isExpectedRuntimeUser(imageUser: string): boolean {
  return imageUser.trim() === expectedRuntimeUser
}

function createRuntimeEnvironment(
  spec: DeploymentImageSpec,
  learnerSecret: string,
  adminSecret: string
): readonly (readonly [name: string, value: string])[] {
  const publicEnvironment = [
    ["NODE_ENV", "production"],
    ["ENABLE_TEST_AUTH", "false"],
    ["WEB_ORIGIN", "https://web.example.test"],
    ["ADMIN_ORIGIN", "https://admin.example.test"],
    ["CONTENT_ASSET_PUBLIC_BASE_URL", "https://assets.example.test"],
    [
      "CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS",
      "https://staging-assets.example.test,https://assets.example.test",
    ],
  ] as const
  const apiEnvironment = [
    ...publicEnvironment,
    ["ADMIN_ASSET_PUBLIC_BASE_URL", "https://assets.example.test"],
    ["ADMIN_ASSET_S3_ACCESS_KEY", "asset-access-key"],
    ["ADMIN_ASSET_S3_BUCKET", "writing-app-assets"],
    ["ADMIN_ASSET_S3_ENDPOINT", "https://r2.example.test"],
    ["ADMIN_ASSET_S3_REGION", "auto"],
    ["ADMIN_ASSET_S3_SECRET_KEY", "asset-secret-key"],
    ["AI_FEEDBACK_GLOBAL_DAILY_REQUEST_LIMIT", "1000"],
    ["AI_FEEDBACK_GLOBAL_DAILY_SUCCESS_LIMIT", "500"],
    ["AI_FEEDBACK_PENDING_TTL_MS", "60000"],
    ["AI_FEEDBACK_PROVIDER_TIMEOUT_MS", "30000"],
    ["AI_FEEDBACK_USER_DAILY_REQUEST_LIMIT", "20"],
    ["AI_FEEDBACK_USER_DAILY_SUCCESS_LIMIT", "10"],
    ["AUTH_EMAIL_FROM", "Writing App <auth@example.test>"],
    ["AUTH_EMAIL_REPLY_TO", "support@example.test"],
    ["LEARNER_AUTH_SECRET", learnerSecret],
    ["CURSOR_SIGNING_SECRET", `${learnerSecret}-cursor-distinct`],
    ["DELETION_MARKER_S3_ACCESS_KEY", "marker-access-key"],
    ["DELETION_MARKER_S3_BUCKET", "writing-app-deletion-markers"],
    ["DELETION_MARKER_S3_ENDPOINT", "https://private-s3.example.test"],
    ["DELETION_MARKER_S3_PREFIX", "privacy/deletion-markers"],
    ["DELETION_MARKER_S3_REGION", "auto"],
    ["DELETION_MARKER_S3_SECRET_KEY", "marker-secret-key"],
    ["DEPLOYMENT_VERSION", "writing-app-smoke-api@sha256:test"],
    ["ADMIN_AUTH_SECRET", adminSecret],
    ["GOOGLE_CLIENT_ID", "google-smoke-client-id"],
    ["GOOGLE_CLIENT_SECRET", "google-smoke-client-secret"],
    ["OPENAI_API_KEY", "openai-smoke-api-key"],
    ["OPENAI_MODEL", "gpt-5.2"],
    ["RESEND_API_KEY", "resend-smoke-api-key"],
    ["LOG_PRETTY", "false"],
  ] as const

  switch (spec.name) {
    case "web":
      return [
        ...publicEnvironment,
        ["PORT", "3000"],
        ["API_BASE_URL", "http://api:4000"],
      ]
    case "admin":
      return [
        ...publicEnvironment,
        ["PORT", "3001"],
        ["NEXT_PUBLIC_LEARNER_WEB_ORIGIN", "https://web.example.test"],
        ["API_BASE_URL", "http://api:4000"],
      ]
    case "api":
      return [
        ...apiEnvironment,
        ["API_PORT", "4000"],
        ["DATABASE_URL", "file:/var/lib/writing-app/api.sqlite"],
      ]
  }
}

function createComposeCommandArguments(
  command: ComposeSmokeCommand,
  operation: readonly string[]
): readonly string[] {
  return [
    "compose",
    "--project-name",
    command.projectName,
    "--env-file",
    command.composeEnvironmentPath,
    "--file",
    command.composePath,
    ...operation,
  ]
}

function createComposeUpArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, [
    "up",
    "--detach",
    "--wait",
    "--wait-timeout",
    "90",
    "--no-build",
    "--pull",
    "never",
    "caddy",
  ])
}

function createComposeDownArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, [
    "down",
    "--remove-orphans",
    "--volumes",
  ])
}

function createCaddyRequestArguments(
  command: ComposeSmokeCommand,
  host: string,
  requestPath: string
): readonly string[] {
  return createComposeCommandArguments(command, [
    "exec",
    "-T",
    "caddy",
    "wget",
    "-q",
    "-O",
    "-",
    "--header",
    `Host: ${host}`,
    `http://127.0.0.1:8080${requestPath}`,
  ])
}

function createAdminSsrHealthCheckArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, [
    "exec",
    "-T",
    "admin",
    "node",
    "-e",
    createAdminSsrHealthCheckScript(),
  ])
}

function createAdminSsrHealthCheckScript(): string {
  return [
    "(async()=>{",
    "const baseUrl=process.env.API_BASE_URL;",
    "if(baseUrl!=='http://api:4000')throw new Error('unexpected API_BASE_URL');",
    "const response=await fetch(baseUrl+'/api/admin/health');",
    "const body=await response.json();",
    "if(!response.ok||body?.ok!==true||body?.service!=='api')throw new Error(`unexpected admin API response: ${JSON.stringify(body)}`);",
    "})().catch((error)=>{console.error(error);process.exit(1)})",
  ].join("")
}

export function validateComposeSmokeServices(
  serviceOutput: string
): readonly string[] {
  return validateServiceSet(
    serviceOutput,
    new Set(["api", "admin", "caddy", "web"]),
    "Compose smoke"
  )
}

export function validateComposeRuntimeServices(
  serviceOutput: string
): readonly string[] {
  return validateServiceSet(
    serviceOutput,
    new Set(["api", "admin", "caddy", "litestream", "web"]),
    "Compose runtime"
  )
}

function validateServiceSet(
  serviceOutput: string,
  expectedServices: ReadonlySet<string>,
  scope: string
): readonly string[] {
  const activeServices = new Set(
    serviceOutput
      .split(/\r?\n/u)
      .map((serviceName) => serviceName.trim())
      .filter((serviceName) => serviceName.length > 0)
  )
  const errors: string[] = []

  for (const serviceName of expectedServices) {
    if (!activeServices.has(serviceName)) {
      errors.push(`${serviceName}: ${scope}에 포함되어야 합니다.`)
    }
  }
  for (const serviceName of activeServices) {
    if (expectedServices.has(serviceName)) continue
    errors.push(`${serviceName}: ${scope} 외부 service입니다.`)
  }

  return errors
}

function createComposeSmokeFixture(input: {
  readonly adminSecret: string
  readonly caddyImage: string
  readonly dataDirectory: string
  readonly images: ComposeSmokeImageReferences
  readonly learnerSecret: string
  readonly projectName: string
  readonly repositoryRoot: string
  readonly runId: string
}): ComposeSmokeFixture {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "writing-app-compose-smoke-")
  )
  const configDirectory = path.join(root, "config")
  const backupDirectory = path.join(root, "backups")
  fs.mkdirSync(configDirectory)
  fs.mkdirSync(backupDirectory)

  for (const spec of deploymentImageSpecs) {
    writeEnvironmentFile(
      path.join(configDirectory, `${spec.name}.env`),
      createRuntimeEnvironment(spec, input.learnerSecret, input.adminSecret)
    )
  }
  writeEnvironmentFile(path.join(configDirectory, "caddy.env"), [
    ["WEB_HOST", "web.example.test"],
    ["ADMIN_HOST", "admin.example.test"],
  ])
  writeEnvironmentFile(path.join(configDirectory, "litestream.env"), [
    ["LITESTREAM_BUCKET", "writing-app-smoke"],
    ["LITESTREAM_PATH", "api.sqlite"],
    ["LITESTREAM_ENDPOINT", "https://example.invalid"],
    ["LITESTREAM_ACCESS_KEY_ID", "smoke-access-key"],
    ["LITESTREAM_SECRET_ACCESS_KEY", "smoke-secret-key"],
  ])
  fs.copyFileSync(
    path.join(input.repositoryRoot, "deploy", "caddy", "caddyfile"),
    path.join(configDirectory, "caddyfile")
  )
  fs.copyFileSync(
    path.join(input.repositoryRoot, "deploy", "litestream", "litestream.yaml"),
    path.join(configDirectory, "litestream.yaml")
  )

  const composeEnvironmentPath = path.join(root, "compose.env")
  fs.writeFileSync(
    composeEnvironmentPath,
    `${createComposeSmokeEnvironment({
      backupDirectory: toDockerPath(backupDirectory),
      caddyImage: input.caddyImage,
      configDirectory: toDockerPath(configDirectory),
      dataDirectory: input.dataDirectory,
      images: input.images,
      runId: input.runId,
    }).join("\n")}\n`
  )

  return {
    command: {
      composeEnvironmentPath,
      composePath: path.join(
        input.repositoryRoot,
        "deploy",
        "compose",
        "compose.yaml"
      ),
      projectName: input.projectName,
    },
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}

function createComposeSmokeEnvironment(
  input: ComposeSmokeEnvironmentInput
): readonly string[] {
  return [
    `WEB_IMAGE=${input.images.web}`,
    `API_IMAGE=${input.images.api}`,
    `ADMIN_IMAGE=${input.images.admin}`,
    `CADDY_IMAGE=${input.caddyImage}`,
    `LITESTREAM_IMAGE=writing-app-smoke-litestream-unused:${input.runId}`,
    `CONFIG_DIRECTORY=${input.configDirectory}`,
    `DATA_DIRECTORY=${input.dataDirectory}`,
    `BACKUP_DIRECTORY=${input.backupDirectory}`,
  ]
}

function writeEnvironmentFile(
  filePath: string,
  environment: readonly (readonly [name: string, value: string])[]
): void {
  fs.writeFileSync(
    filePath,
    `${environment.map(([name, value]) => `${name}=${value}`).join("\n")}\n`
  )
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

function assertImageRuntimeContract(imageReference: string): void {
  const result = runDocker(
    ["image", "inspect", "--format", "{{.Config.User}}", imageReference],
    { capture: true }
  )
  if (!isExpectedRuntimeUser(result.stdout)) {
    throw new Error(
      `${imageReference}: runtime user는 ${expectedRuntimeUser}여야 합니다.`
    )
  }

  const architecture = runDocker(
    ["image", "inspect", "--format", "{{.Architecture}}", imageReference],
    { capture: true }
  ).stdout.trim()
  if (architecture !== "amd64") {
    throw new Error(
      `${imageReference}: runtime architecture는 amd64여야 합니다.`
    )
  }

  const imageEnvironment = runDocker(
    ["image", "inspect", "--format", "{{json .Config.Env}}", imageReference],
    { capture: true }
  ).stdout
  const imageHistory = runDocker(
    ["history", "--no-trunc", "--format", "{{.CreatedBy}}", imageReference],
    { capture: true }
  ).stdout
  for (const name of runtimeSecretEnvironmentNames) {
    if (imageEnvironment.includes(`${name}=`) || imageHistory.includes(name)) {
      throw new Error(
        `${imageReference}: ${name}은 image config나 build history에 포함되면 안 됩니다.`
      )
    }
  }
}

function assertStaticPaths(
  spec: DeploymentImageSpec,
  imageReference: string
): void {
  const checks = spec.staticPaths.map((staticPath) =>
    staticPath.endsWith("/.next/static")
      ? `test -d '${staticPath}' && test -n "$(find '${staticPath}' -type f -print -quit)"`
      : `test -f '${staticPath}'`
  )
  checks.push(
    ...spec.runtimeArtifactPaths.map(
      (runtimeArtifactPath) => `test -f '${runtimeArtifactPath}'`
    )
  )
  checks.push(
    ...spec.forbiddenPaths.map(
      (forbiddenPath) => `test ! -e '${forbiddenPath}'`
    )
  )

  runDocker([
    "run",
    "--rm",
    "--entrypoint",
    "sh",
    imageReference,
    "-c",
    checks.join(" && "),
  ])
}

async function waitForContainerHealth(
  spec: DeploymentImageSpec,
  containerName: string
): Promise<void> {
  const runtime = spec.runtime === "node" ? "node" : "bun"
  const healthScript = createHealthRequestScript(spec)

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

function createHealthRequestScript(spec: DeploymentImageSpec): string {
  return [
    `const response=await fetch('http://127.0.0.1:${spec.healthPort}${spec.healthPath}');`,
    "if(!response.ok)process.exit(1);",
  ].join("")
}

function assertContainerUser(containerName: string): void {
  const result = runDocker(["exec", containerName, "id", "-u"], {
    capture: true,
  })
  if (result.stdout.trim() !== "10001") {
    throw new Error(`${containerName}: runtime UID가 10001이 아닙니다.`)
  }
}

function assertContainerIsolation(
  spec: DeploymentImageSpec,
  containerName: string,
  expectedEnvironment: readonly (readonly [name: string, value: string])[]
): void {
  const inspectionResult = runDocker(
    ["inspect", "--format", "{{json .}}", containerName],
    { capture: true }
  )
  let inspection: {
    readonly Config?: { readonly Env?: readonly string[] }
    readonly HostConfig?: {
      readonly NetworkMode?: string
      readonly PortBindings?: Readonly<Record<string, unknown>> | null
    }
    readonly Mounts?: readonly { readonly Destination?: string }[]
  }
  try {
    inspection = JSON.parse(inspectionResult.stdout) as typeof inspection
  } catch {
    throw new Error(
      `${containerName}: Docker inspect 출력을 해석하지 못했습니다.`
    )
  }

  const hostConfig = inspection.HostConfig
  if (hostConfig?.NetworkMode !== "none") {
    throw new Error(`${containerName}: network mode는 none이어야 합니다.`)
  }
  const portBindings = hostConfig?.PortBindings
  if (
    portBindings !== null &&
    portBindings !== undefined &&
    Object.keys(portBindings).length > 0
  ) {
    throw new Error(`${containerName}: host port binding이 있으면 안 됩니다.`)
  }

  const environmentNames = new Set(
    (inspection.Config?.Env ?? []).map((entry) => entry.split("=", 1)[0] ?? "")
  )
  for (const [name] of expectedEnvironment) {
    if (!environmentNames.has(name)) {
      throw new Error(`${containerName}: ${name} 환경 변수가 없습니다.`)
    }
  }
  if (spec.name !== "api") {
    for (const name of apiOnlyEnvironmentNames) {
      if (environmentNames.has(name)) {
        throw new Error(`${containerName}: ${name}은 API에만 전달해야 합니다.`)
      }
    }
  }

  const mountTargets = (inspection.Mounts ?? [])
    .map((mount) => mount.Destination)
    .filter((target): target is string => target !== undefined)
  const expectedMountTargets = spec.usesDatabase ? ["/var/lib/writing-app"] : []
  if (
    mountTargets.length !== expectedMountTargets.length ||
    mountTargets.some((target) => !expectedMountTargets.includes(target))
  ) {
    throw new Error(
      `${containerName}: 허용되지 않은 mount가 있거나 application DB mount가 없습니다.`
    )
  }
}

function assertStaticResponses(
  spec: DeploymentImageSpec,
  containerName: string
): void {
  if (spec.staticResponses.length === 0) return

  const runtime = spec.runtime === "node" ? "node" : "bun"
  const assertions = spec.staticResponses.map((staticResponse) => {
    const url = `http://127.0.0.1:${spec.healthPort}${staticResponse.path}`
    return [
      "{",
      `const response=await fetch(${JSON.stringify(url)});`,
      "if(!response.ok)throw new Error(`status=${response.status}`);",
      `if(response.headers.get('cache-control')!==${JSON.stringify(staticResponse.cacheControl)})throw new Error('cache-control mismatch');`,
      `if(response.headers.get('content-type')!==${JSON.stringify(staticResponse.contentType)})throw new Error('content-type mismatch');`,
      "}",
    ].join("")
  })
  const assertionScript = [
    "(async()=>{",
    ...assertions,
    "})().catch((error)=>{console.error(error);process.exit(1)})",
  ].join("")

  runDocker(["exec", containerName, runtime, "-e", assertionScript])
}

function createImageOptimizationRequestScript(
  spec: DeploymentImageSpec
): string {
  if (spec.optimizedImagePath === undefined) {
    throw new Error(`${spec.name}: image optimizer 검증 경로가 없습니다.`)
  }

  const origin = `http://127.0.0.1:${spec.healthPort}`
  const optimizedPath = `/_next/image?url=${encodeURIComponent(spec.optimizedImagePath)}&w=640&q=75`

  return [
    `const sourceResponse=await fetch(${JSON.stringify(`${origin}${spec.optimizedImagePath}`)});`,
    "if(!sourceResponse.ok)throw new Error(`source status=${sourceResponse.status}`);",
    `const optimizedResponse=await fetch(${JSON.stringify(`${origin}${optimizedPath}`)});`,
    "if(!optimizedResponse.ok)throw new Error(`optimizer status=${optimizedResponse.status}`);",
    "const source=Buffer.from(await sourceResponse.arrayBuffer());",
    "const optimized=Buffer.from(await optimizedResponse.arrayBuffer());",
    "if(optimized.length>=source.length)throw new Error(`optimizer did not reduce bytes: source=${source.length}, optimized=${optimized.length}`);",
    "if(optimized.equals(source))throw new Error('optimizer returned source bytes unchanged');",
    "if(!optimizedResponse.headers.get('content-type')?.startsWith('image/'))throw new Error('optimizer content-type mismatch');",
  ].join("")
}

function assertImageOptimization(
  spec: DeploymentImageSpec,
  containerName: string
): void {
  if (spec.optimizedImagePath === undefined) return

  runDocker([
    "exec",
    containerName,
    "node",
    "-e",
    createImageOptimizationRequestScript(spec),
  ])
}

function assertApiOperationExecutables(
  imageReference: string,
  dataDirectory: string
): void {
  const databaseUrl = "file:/var/lib/writing-app/api.sqlite"
  const mount = `type=bind,source=${dataDirectory},target=/var/lib/writing-app`
  runDocker([
    "run",
    "--rm",
    "--network",
    "none",
    "--mount",
    mount,
    "--env",
    `DATABASE_URL=${databaseUrl}`,
    "--entrypoint",
    "bun",
    imageReference,
    "/workspace/bin/database-integrity-check",
  ])
  runDocker([
    "run",
    "--rm",
    "--network",
    "none",
    "--mount",
    mount,
    "--env",
    `DATABASE_URL=${databaseUrl}`,
    "--entrypoint",
    "bun",
    imageReference,
    "/workspace/bin/database-migrate",
  ])
  runDocker([
    "run",
    "--rm",
    "--network",
    "none",
    "--mount",
    mount,
    "--entrypoint",
    "bun",
    imageReference,
    "/workspace/bin/database-backup",
    "--source=/var/lib/writing-app/api.sqlite",
    "--output=/var/lib/writing-app/image-smoke-backup.sqlite",
  ])
  runDocker([
    "run",
    "--rm",
    "--network",
    "none",
    "--mount",
    `${mount},readonly`,
    "--env",
    `DATABASE_URL=${databaseUrl}`,
    "--entrypoint",
    "bun",
    imageReference,
    "/workspace/bin/database-check",
  ])
}

function createComposeImageReferences(
  images: readonly {
    readonly imageReference: string
    readonly name: DeploymentServiceName
  }[]
): ComposeSmokeImageReferences {
  return {
    admin: findImageReference(images, "admin"),
    api: findImageReference(images, "api"),
    web: findImageReference(images, "web"),
  }
}

function findImageReference(
  images: readonly {
    readonly imageReference: string
    readonly name: DeploymentServiceName
  }[],
  name: DeploymentServiceName
): string {
  const image = images.find((candidate) => candidate.name === name)
  if (image === undefined) {
    throw new Error(`${name}: Compose smoke image를 찾지 못했습니다.`)
  }
  return image.imageReference
}

function assertComposeSmokeRoute(
  route: (typeof composeSmokeRoutes)[number],
  responseText: string
): void {
  let response: unknown
  try {
    response = JSON.parse(responseText) as unknown
  } catch {
    throw new Error(
      `${route.host}${route.path}: JSON 응답이 아닙니다. ${responseText.trim()}`
    )
  }

  if (JSON.stringify(response) !== JSON.stringify(route.expectedResponse)) {
    throw new Error(
      `${route.host}${route.path}: 예상 응답과 다릅니다. ${JSON.stringify(response)}`
    )
  }
}

function createComposeServiceListArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, ["ps", "--all", "--services"])
}

function createComposeRuntimeServiceListArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, ["config", "--services"])
}

function createComposeLogsArguments(
  command: ComposeSmokeCommand
): readonly string[] {
  return createComposeCommandArguments(command, [
    "logs",
    "--no-color",
    "api",
    "admin",
    "caddy",
    "web",
  ])
}

function runComposeTrafficSmoke(input: {
  readonly adminSecret: string
  readonly caddyImage: string
  readonly dataDirectory: string
  readonly images: ComposeSmokeImageReferences
  readonly learnerSecret: string
  readonly projectName: string
  readonly repositoryRoot: string
  readonly runId: string
}): void {
  using fixture = createComposeSmokeFixture(input)
  let smokeError: unknown
  let cleanupError: Error | undefined

  try {
    console.log("Caddy와 target API/Admin SSR Compose smoke를 시작합니다.")
    const runtimeServices = runDocker(
      createComposeRuntimeServiceListArguments(fixture.command),
      { capture: true }
    )
    const runtimeServiceErrors = validateComposeRuntimeServices(
      runtimeServices.stdout
    )
    if (runtimeServiceErrors.length > 0) {
      throw new Error(
        runtimeServiceErrors.map((error) => `- ${error}`).join("\n")
      )
    }

    runDocker(createComposeUpArguments(fixture.command))

    const serviceResult = runDocker(
      createComposeServiceListArguments(fixture.command),
      { capture: true }
    )
    const serviceErrors = validateComposeSmokeServices(serviceResult.stdout)
    if (serviceErrors.length > 0) {
      throw new Error(serviceErrors.map((error) => `- ${error}`).join("\n"))
    }

    for (const route of composeSmokeRoutes) {
      const response = runDocker(
        createCaddyRequestArguments(fixture.command, route.host, route.path),
        { capture: true }
      )
      assertComposeSmokeRoute(route, response.stdout)
    }
    runDocker(createAdminSsrHealthCheckArguments(fixture.command))
  } catch (error) {
    const logs = runDocker(createComposeLogsArguments(fixture.command), {
      capture: true,
      required: false,
    })
    const detail = error instanceof Error ? error.message : String(error)
    smokeError = new Error(
      `${detail}\nCompose smoke 로그:\n${logs.stdout}${logs.stderr}`
    )
  } finally {
    const cleanup = runDocker(createComposeDownArguments(fixture.command), {
      capture: true,
      required: false,
    })
    if (!cleanup.success) {
      cleanupError = new Error(
        `Compose smoke project 정리에 실패했습니다.\n${cleanup.stdout}${cleanup.stderr}`
      )
    }
  }

  if (smokeError !== undefined) throw smokeError
  if (cleanupError !== undefined) throw cleanupError

  console.log(
    "Caddy public Host와 단일 API namespace, Admin SSR upstream을 확인했습니다."
  )
}

async function runDeploymentImageTests(
  releasedManifestPath?: string
): Promise<void> {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const releasedManifest =
    releasedManifestPath === undefined
      ? undefined
      : readImageReleaseManifest(releasedManifestPath)
  const containerImageLock = readContainerImageLock(repositoryRoot)
  const caddyImageReference = requireLockedContainerImageReference(
    containerImageLock,
    "caddy"
  )
  const runId = `${process.pid}-${Date.now()}`
  const learnerSecret = createSmokeSecret()
  let adminSecret = createSmokeSecret()
  while (adminSecret === learnerSecret) adminSecret = createSmokeSecret()
  const ownedContainers = new Set<string>()
  const ownedImages = new Set<string>()
  const testedImages: {
    readonly imageReference: string
    readonly name: DeploymentServiceName
  }[] = []

  runDocker(["info", "--format", "{{.ServerVersion}}"])
  if (releasedManifest !== undefined) {
    console.log(
      `Release source revision ${releasedManifest.sourceRevision}의 digest image를 검증합니다.`
    )
  }

  using fixture = createImageSmokeFixture()
  try {
    for (const spec of deploymentImageSpecs) {
      const imageReference =
        releasedManifest?.images[spec.name] ??
        `writing-app-smoke-${spec.name}:${runId}`
      const containerName = `writing-app-smoke-${spec.name}-${runId}`
      ownedImages.add(imageReference)

      if (releasedManifest === undefined) {
        console.log(`${spec.name}: linux/amd64 image를 빌드합니다.`)
        runDocker(
          createImageBuildArguments(spec, imageReference, repositoryRoot)
        )
      } else {
        console.log(`${spec.name}: 검증된 digest image를 가져옵니다.`)
        runDocker(["pull", "--platform", "linux/amd64", imageReference])
      }
      testedImages.push({ imageReference, name: spec.name })
      assertImageRuntimeContract(imageReference)
      assertStaticPaths(spec, imageReference)
      if (spec.name === "api") {
        assertApiOperationExecutables(imageReference, fixture.dataDirectory)
      }

      const runtimeEnvironment = createRuntimeEnvironment(
        spec,
        learnerSecret,
        adminSecret
      )
      ownedContainers.add(containerName)
      runDocker(
        createContainerRunArguments(
          spec,
          imageReference,
          containerName,
          fixture.dataDirectory,
          runtimeEnvironment
        )
      )
      await waitForContainerHealth(spec, containerName)
      assertContainerUser(containerName)
      assertContainerIsolation(spec, containerName, runtimeEnvironment)
      assertStaticResponses(spec, containerName)
      assertImageOptimization(spec, containerName)
      runDocker(["rm", "--force", containerName])
      ownedContainers.delete(containerName)
      console.log(
        `${spec.name}: 비 root runtime과 /health 검증을 통과했습니다.`
      )
    }

    const caddySmokeImage = `writing-app-smoke-caddy:${runId}`
    ownedImages.add(caddySmokeImage)
    console.log("Caddy locked image를 Compose smoke local tag로 준비합니다.")
    runDocker(["pull", caddyImageReference])
    runDocker(["image", "tag", caddyImageReference, caddySmokeImage])
    runComposeTrafficSmoke({
      adminSecret,
      caddyImage: caddySmokeImage,
      dataDirectory: fixture.dataDirectory,
      images: createComposeImageReferences(testedImages),
      learnerSecret,
      projectName: `writing-app-smoke-${runId}`,
      repositoryRoot,
      runId,
    })
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

  console.log("세 production image smoke 검증을 통과했습니다.")
}

function createSmokeSecret(): string {
  return `0123456789abcdef${randomBytes(32).toString("hex")}`
}

function readReleasedManifestPath(
  arguments_: readonly string[]
): string | undefined {
  if (arguments_.length === 0) return undefined
  if (
    arguments_.length !== 2 ||
    arguments_[0] !== "released" ||
    arguments_[1] === undefined
  ) {
    throw new Error(
      "released <image-release-manifest.json> 형식으로 실행해야 합니다."
    )
  }
  return path.resolve(arguments_[1])
}

if (import.meta.main) {
  try {
    await runDeploymentImageTests(
      readReleasedManifestPath(process.argv.slice(2))
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
