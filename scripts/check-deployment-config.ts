import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

type JsonObject = Record<string, unknown>

const applicationServices = ["web", "api", "admin", "admin-api"] as const
const expectedServices = [
  ...applicationServices,
  "caddy",
  "cloudflared",
  "litestream",
  "database-restore",
  "database-migrate",
  "database-check",
  "database-backup",
] as const

const expectedNetworks = {
  admin: ["admin"],
  "admin-api": ["admin"],
  api: ["learner"],
  caddy: ["admin", "edge", "learner"],
  cloudflared: ["edge"],
  litestream: ["backup"],
  web: ["learner"],
} as const

interface CommandResult {
  readonly stderr: string
  readonly stdout: string
  readonly success: boolean
}

interface DeploymentFixture extends Disposable {
  readonly caddyEnvironmentPath: string
  readonly caddyfilePath: string
  readonly composeEnvironmentPath: string
  readonly litestreamEnvironmentPath: string
  readonly litestreamPath: string
}

export function validateComposeContract(input: unknown): readonly string[] {
  if (!isJsonObject(input) || !isJsonObject(input.services)) {
    return ["Compose 출력에 services 객체가 없습니다."]
  }

  const services = input.services
  const errors: string[] = []

  for (const serviceName of expectedServices) {
    if (!isJsonObject(services[serviceName])) {
      errors.push(`Compose service ${serviceName}이(가) 없습니다.`)
    }
  }

  for (const [serviceName, value] of Object.entries(services)) {
    if (!isJsonObject(value)) continue
    if (Array.isArray(value.ports) && value.ports.length > 0) {
      errors.push(`${serviceName}: host port를 공개하면 안 됩니다.`)
    }
  }

  for (const serviceName of applicationServices) {
    const service = services[serviceName]
    if (!isJsonObject(service)) continue
    if (service.init !== true) {
      errors.push(`${serviceName}: init이 true여야 합니다.`)
    }
    if (!hasHealthcheck(service)) {
      errors.push(`${serviceName}: healthcheck가 필요합니다.`)
    }
  }

  for (const [serviceName, networks] of Object.entries(expectedNetworks)) {
    const service = services[serviceName]
    if (!isJsonObject(service)) continue
    const actualNetworks = readObjectKeys(service.networks)
    if (!sameValues(actualNetworks, networks)) {
      errors.push(
        `${serviceName}: network는 ${networks.join(", ")}만 사용해야 합니다.`
      )
    }
  }

  for (const serviceName of ["api", "admin-api", "litestream"] as const) {
    const service = services[serviceName]
    if (
      isJsonObject(service) &&
      !hasVolumeTarget(service, "/var/lib/writing-app")
    ) {
      errors.push(`${serviceName}: 공유 SQLite volume이 필요합니다.`)
    }
  }

  return errors
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasHealthcheck(service: JsonObject): boolean {
  if (!isJsonObject(service.healthcheck)) return false
  const test = service.healthcheck.test
  return Array.isArray(test) && test.length > 0
}

function hasVolumeTarget(service: JsonObject, target: string): boolean {
  if (!Array.isArray(service.volumes)) return false
  return service.volumes.some(
    (volume) => isJsonObject(volume) && volume.target === target
  )
}

function readObjectKeys(value: unknown): readonly string[] {
  return isJsonObject(value) ? Object.keys(value).sort() : []
}

function sameValues(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === [...expected].sort()[index])
  )
}

function createDeploymentFixture(repositoryRoot: string): DeploymentFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "writing-app-deploy-"))
  const configDirectory = path.join(root, "config")
  const secretsDirectory = path.join(root, "secrets")
  const dataDirectory = path.join(root, "data")
  const backupDirectory = path.join(root, "backups")

  for (const directory of [
    configDirectory,
    secretsDirectory,
    dataDirectory,
    backupDirectory,
  ]) {
    fs.mkdirSync(directory)
  }

  for (const fileName of ["web.env", "api.env", "admin.env", "admin-api.env"]) {
    fs.writeFileSync(
      path.join(configDirectory, fileName),
      "NODE_ENV=production\n"
    )
  }

  const caddyEnvironmentPath = path.join(configDirectory, "caddy.env")
  const litestreamEnvironmentPath = path.join(configDirectory, "litestream.env")
  const caddyfilePath = path.join(configDirectory, "caddyfile")
  const litestreamPath = path.join(configDirectory, "litestream.yaml")

  fs.writeFileSync(
    caddyEnvironmentPath,
    [
      "WEB_HOST=app.example.test",
      "API_HOST=api.example.test",
      "ADMIN_HOST=admin.example.test",
      "ADMIN_API_HOST=admin-api.example.test",
      "",
    ].join("\n")
  )
  fs.writeFileSync(
    litestreamEnvironmentPath,
    [
      "LITESTREAM_BUCKET=writing-app-test",
      "LITESTREAM_PATH=production/api.sqlite",
      "LITESTREAM_ENDPOINT=https://example.invalid",
      "LITESTREAM_ACCESS_KEY_ID=test-access-key",
      "LITESTREAM_SECRET_ACCESS_KEY=test-secret-key",
      "",
    ].join("\n")
  )
  fs.copyFileSync(
    path.join(repositoryRoot, "deploy", "caddy", "caddyfile"),
    caddyfilePath
  )
  fs.copyFileSync(
    path.join(repositoryRoot, "deploy", "litestream", "litestream.yaml"),
    litestreamPath
  )
  fs.writeFileSync(
    path.join(secretsDirectory, "cloudflare-tunnel-token"),
    "fixture-token\n"
  )

  const composeEnvironmentPath = path.join(root, "compose.env")
  const digest = "a".repeat(64)
  fs.writeFileSync(
    composeEnvironmentPath,
    [
      `WEB_IMAGE=example.invalid/writing-app-web@sha256:${digest}`,
      `API_IMAGE=example.invalid/writing-app-api@sha256:${digest}`,
      `ADMIN_IMAGE=example.invalid/writing-app-admin@sha256:${digest}`,
      `ADMIN_API_IMAGE=example.invalid/writing-app-admin-api@sha256:${digest}`,
      "CADDY_IMAGE=caddy:2.11.4-alpine",
      "CLOUDFLARED_IMAGE=cloudflare/cloudflared:2026.6.0",
      "LITESTREAM_IMAGE=litestream/litestream:0.5.11",
      `CONFIG_DIRECTORY=${toDockerPath(configDirectory)}`,
      `SECRETS_DIRECTORY=${toDockerPath(secretsDirectory)}`,
      `DATA_DIRECTORY=${toDockerPath(dataDirectory)}`,
      `BACKUP_DIRECTORY=${toDockerPath(backupDirectory)}`,
      "",
    ].join("\n")
  )

  return {
    caddyEnvironmentPath,
    caddyfilePath,
    composeEnvironmentPath,
    litestreamEnvironmentPath,
    litestreamPath,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}

function toDockerPath(filePath: string): string {
  return filePath.replaceAll("\\", "/")
}

function runCommand(command: string, args: readonly string[]): CommandResult {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
  })

  if (result.error !== undefined) {
    return {
      stderr: result.error.message,
      stdout: "",
      success: false,
    }
  }

  return {
    stderr: result.stderr,
    stdout: result.stdout,
    success: result.status === 0,
  }
}

function requireSuccessfulCommand(
  label: string,
  command: string,
  args: readonly string[]
): CommandResult {
  const result = runCommand(command, args)
  if (result.success) return result

  const detail = result.stderr.trim()
  throw new Error(
    detail.length > 0
      ? `${label}에 실패했습니다.\n${detail}`
      : `${label}에 실패했습니다.`
  )
}

function validateContainerConfigs(fixture: DeploymentFixture): void {
  requireSuccessfulCommand("Caddy 설정 검증", "docker", [
    "run",
    "--rm",
    "--env-file",
    fixture.caddyEnvironmentPath,
    "--mount",
    `type=bind,source=${fixture.caddyfilePath},target=/etc/caddy/caddyfile,readonly`,
    "caddy:2.11.4-alpine",
    "caddy",
    "validate",
    "--config",
    "/etc/caddy/caddyfile",
    "--adapter",
    "caddyfile",
  ])

  requireSuccessfulCommand("Litestream 설정 검증", "docker", [
    "run",
    "--rm",
    "--env-file",
    fixture.litestreamEnvironmentPath,
    "--mount",
    `type=bind,source=${fixture.litestreamPath},target=/etc/litestream.yaml,readonly`,
    "litestream/litestream:0.5.11",
    "databases",
    "-config",
    "/etc/litestream.yaml",
  ])
}

function runDeploymentConfigCheck(): void {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const composePath = path.join(
    repositoryRoot,
    "deploy",
    "compose",
    "compose.yaml"
  )

  using fixture = createDeploymentFixture(repositoryRoot)
  const composeResult = requireSuccessfulCommand(
    "Compose 설정 해석",
    "docker",
    [
      "compose",
      "--profile",
      "operations",
      "--env-file",
      fixture.composeEnvironmentPath,
      "-f",
      composePath,
      "config",
      "--format",
      "json",
    ]
  )

  let composeConfig: unknown
  try {
    composeConfig = JSON.parse(composeResult.stdout) as unknown
  } catch {
    throw new Error("Compose JSON 출력을 해석하지 못했습니다.")
  }

  const errors = validateComposeContract(composeConfig)
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `- ${error}`).join("\n"))
  }

  const skipContainerValidation = process.argv.includes(
    "--skip-container-validation"
  )
  if (!skipContainerValidation) {
    validateContainerConfigs(fixture)
  }

  console.log(
    skipContainerValidation
      ? "Compose 배포 계약 검증을 통과했습니다. 컨테이너 설정 검증은 생략했습니다."
      : "Compose, Caddy, Litestream 배포 설정 검증을 통과했습니다."
  )
}

if (import.meta.main) {
  try {
    runDeploymentConfigCheck()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
