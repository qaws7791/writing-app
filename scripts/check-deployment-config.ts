import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

type JsonObject = Record<string, unknown>

const applicationServices = ["web", "api", "admin"] as const
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
  api: ["admin", "learner"],
  caddy: ["admin", "edge", "learner"],
  cloudflared: ["edge"],
  "database-restore": ["backup"],
  litestream: ["backup"],
  web: ["learner"],
} as const

const requiredUnifiedApiEnvironment = [
  "ADMIN_ASSET_PUBLIC_BASE_URL",
  "ADMIN_ASSET_S3_ACCESS_KEY",
  "ADMIN_ASSET_S3_BUCKET",
  "ADMIN_ASSET_S3_ENDPOINT",
  "ADMIN_ASSET_S3_REGION",
  "ADMIN_ASSET_S3_SECRET_KEY",
  "ADMIN_AUTH_SECRET",
  "ADMIN_ORIGIN",
  "API_ALLOWED_HOSTS",
  "API_ORIGIN",
  "CURSOR_SIGNING_SECRET",
  "LEARNER_AUTH_SECRET",
] as const

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

  if (isJsonObject(services["admin-api"])) {
    errors.push("Compose에 제거된 admin-api service가 있으면 안 됩니다.")
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
    if (
      typeof service.image !== "string" ||
      !/^.+@sha256:[0-9a-f]{64}(?![\s\S])/u.test(service.image)
    ) {
      errors.push(`${serviceName}: immutable image digest가 필요합니다.`)
    }
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

  for (const serviceName of ["api", "litestream"] as const) {
    const service = services[serviceName]
    if (
      isJsonObject(service) &&
      !hasVolumeTarget(service, "/var/lib/writing-app")
    ) {
      errors.push(`${serviceName}: 공유 SQLite volume이 필요합니다.`)
    }
  }

  const apiService = services.api
  if (isJsonObject(apiService)) {
    errors.push(...validateUnifiedApiEnvironment(apiService))
    if (!healthcheckUsesConfiguredApiHost(apiService)) {
      errors.push("api: healthcheck는 configured API Host를 명시해야 합니다.")
    }
  }

  const adminService = services.admin
  if (
    isJsonObject(adminService) &&
    readEnvironmentValue(adminService, "API_BASE_URL") !== "http://api:4000"
  ) {
    errors.push("admin: 단일 API의 api:4000 upstream을 사용해야 합니다.")
  }

  const caddyService = services.caddy
  if (isJsonObject(caddyService) && hasDependency(caddyService, "admin-api")) {
    errors.push("caddy: 제거된 admin-api에 의존하면 안 됩니다.")
  }

  const litestreamService = services.litestream
  if (isJsonObject(litestreamService)) {
    errors.push(
      ...validateDatabaseRestoreService(
        services["database-restore"],
        litestreamService
      )
    )
  }

  if (isJsonObject(apiService)) {
    errors.push(
      ...validateApiOperationService(
        services["database-migrate"],
        apiService,
        "database-migrate",
        "command",
        ["bun", "/workspace/bin/database-migrate"]
      ),
      ...validateApiOperationService(
        services["database-backup"],
        apiService,
        "database-backup",
        "entrypoint",
        ["bun", "/workspace/bin/database-backup"]
      ),
      ...validateApiOperationService(
        services["database-check"],
        apiService,
        "database-check",
        "command",
        ["bun", "/workspace/bin/database-check"]
      )
    )
  }

  return errors
}

function validateDatabaseRestoreService(
  value: unknown,
  litestreamService: JsonObject
): readonly string[] {
  if (!isJsonObject(value)) return []

  const errors: string[] = []
  if (value.image !== litestreamService.image) {
    errors.push("database-restore: Litestream과 같은 image를 사용해야 합니다.")
  }
  if (value.restart !== "no") {
    errors.push("database-restore: 일회성 작업은 restart: no여야 합니다.")
  }
  if (!hasVolumeTarget(value, "/var/lib/writing-app")) {
    errors.push("database-restore: application DB volume이 필요합니다.")
  }
  if (!hasVolumeTarget(value, "/var/backups/writing-app")) {
    errors.push("database-restore: 격리 복구용 backup volume이 필요합니다.")
  }
  if (
    !sameStringArray(value.command, [
      "restore",
      "-config",
      "/etc/litestream.yaml",
      "-if-db-not-exists",
      "-if-replica-exists",
      "/var/lib/writing-app/api.sqlite",
    ])
  ) {
    errors.push(
      "database-restore: Litestream의 조건부 기본 복구 command를 유지해야 합니다."
    )
  }

  return errors
}

function validateApiOperationService(
  value: unknown,
  apiService: JsonObject,
  serviceName: "database-backup" | "database-check" | "database-migrate",
  executableField?: "command" | "entrypoint",
  executableCommand?: readonly string[]
): readonly string[] {
  if (!isJsonObject(value)) return []

  const errors: string[] = []
  if (value.image !== apiService.image) {
    errors.push(`${serviceName}: 통합 API와 같은 image를 사용해야 합니다.`)
  }
  if (value.network_mode !== "none") {
    errors.push(`${serviceName}: network_mode는 none이어야 합니다.`)
  }
  if (value.restart !== "no") {
    errors.push(`${serviceName}: 일회성 작업은 restart: no여야 합니다.`)
  }
  if (!hasVolumeTarget(value, "/var/lib/writing-app")) {
    errors.push(`${serviceName}: application DB volume이 필요합니다.`)
  }
  if (
    serviceName === "database-check" &&
    !hasReadOnlyVolumeTarget(value, "/var/lib/writing-app")
  ) {
    errors.push("database-check: application DB volume은 read-only여야 합니다.")
  }

  if (
    executableField !== undefined &&
    executableCommand !== undefined &&
    !sameStringArray(value[executableField], executableCommand)
  ) {
    errors.push(
      `${serviceName}: API image의 ${executableCommand.at(-1)}를 Bun으로 실행해야 합니다.`
    )
  }

  return errors
}

export function validateUnifiedApiCaddyContract(
  caddyfile: string
): readonly string[] {
  const errors: string[] = []
  const learnerWebHandler = readCaddyHandler(caddyfile, "@learner-web")
  const apiHandler = readCaddyHandler(caddyfile, "@api")
  const adminWebHandler = readCaddyHandler(caddyfile, "@admin-web")

  if (!hasLoopbackCaddyAdminEndpoint(caddyfile)) {
    errors.push("Caddy 관리 endpoint는 127.0.0.1:2019로 제한해야 합니다.")
  }

  if (!apiHandler.includes("reverse_proxy api:4000")) {
    errors.push("Caddy API upstream은 api:4000이어야 합니다.")
  }
  if (!learnerWebHandler.includes("reverse_proxy web:3000")) {
    errors.push("Caddy learner web upstream은 web:3000이어야 합니다.")
  }
  if (!adminWebHandler.includes("reverse_proxy admin:3001")) {
    errors.push("Caddy admin web upstream은 admin:3001이어야 합니다.")
  }
  if ((caddyfile.match(/\breverse_proxy\s+api:4000\b/gu) ?? []).length !== 1) {
    errors.push("Caddy topology는 단일 API handler만 둘 수 있습니다.")
  }
  if (/\breverse_proxy\s+(?!api:4000\b)[^\s]+/iu.test(apiHandler)) {
    errors.push(
      "Caddy API handler는 api:4000 외의 upstream을 포함하면 안 됩니다."
    )
  }
  if (/\bheader_up\s+Host\b/iu.test(apiHandler)) {
    errors.push(
      "Caddy API upstream은 public Host를 내부 Host로 덮어쓰면 안 됩니다."
    )
  }
  if (
    [learnerWebHandler, adminWebHandler].some((handler) =>
      /\bheader_up\s+Host\b/iu.test(handler)
    )
  ) {
    errors.push(
      "Caddy web upstream은 public Host를 내부 Host로 덮어쓰면 안 됩니다."
    )
  }

  return errors
}

function hasLoopbackCaddyAdminEndpoint(caddyfile: string): boolean {
  return /^\s*admin\s+127\.0\.0\.1:2019\s*$/mu.test(caddyfile)
}

function validateUnifiedApiEnvironment(service: JsonObject): readonly string[] {
  const errors: string[] = []
  for (const name of requiredUnifiedApiEnvironment) {
    const value = readEnvironmentValue(service, name)
    if (value === undefined || value.trim().length === 0) {
      errors.push(`api: ${name} 환경 변수가 필요합니다.`)
    }
  }

  const apiHosts = readAllowedHostnames(
    readEnvironmentValue(service, "API_ALLOWED_HOSTS")
  )
  if (apiHosts === undefined) {
    errors.push("api: Host allowlist authority가 유효해야 합니다.")
    return errors
  }
  if (!apiHosts.authorities.has("api:4000")) {
    errors.push("api: 내부 authority api:4000이 필요합니다.")
  }

  return errors
}

function readAllowedHostnames(value: string | undefined):
  | {
      readonly authorities: ReadonlySet<string>
      readonly hostnames: ReadonlySet<string>
    }
  | undefined {
  if (value === undefined || value.trim().length === 0) return undefined

  const authorities = value.split(",")
  const hostnames = new Set<string>()
  for (const authority of authorities) {
    try {
      const url = new URL(`http://${authority}/`)
      if (url.host.toLowerCase() !== authority.toLowerCase()) return undefined
      hostnames.add(url.hostname.toLowerCase())
    } catch {
      return undefined
    }
  }

  return {
    authorities: new Set(
      authorities.map((authority) => authority.toLowerCase())
    ),
    hostnames,
  }
}

function healthcheckUsesConfiguredApiHost(service: JsonObject): boolean {
  if (!isJsonObject(service.healthcheck)) return false
  const test = service.healthcheck.test
  return (
    Array.isArray(test) &&
    test.some(
      (entry) =>
        typeof entry === "string" &&
        entry.includes("Host") &&
        entry.includes("API_ORIGIN")
    )
  )
}

function readEnvironmentValue(
  service: JsonObject,
  name: string
): string | undefined {
  if (!isJsonObject(service.environment)) return undefined
  const value = service.environment[name]
  return typeof value === "string" ? value : undefined
}

function readCaddyHandler(caddyfile: string, matcher: string): string {
  const start = caddyfile.indexOf(`handle ${matcher} {`)
  if (start < 0) return ""
  const end = caddyfile.indexOf("\n\t}", start)
  return end < 0 ? "" : caddyfile.slice(start, end)
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

function hasReadOnlyVolumeTarget(service: JsonObject, target: string): boolean {
  if (!Array.isArray(service.volumes)) return false
  return service.volumes.some(
    (volume) =>
      isJsonObject(volume) &&
      volume.target === target &&
      volume.read_only === true
  )
}

function hasDependency(service: JsonObject, serviceName: string): boolean {
  return isJsonObject(service.depends_on) && serviceName in service.depends_on
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

function sameStringArray(value: unknown, expected: readonly string[]): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((entry, index) => entry === expected[index])
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

  const environmentFiles = new Map([
    ["web.env", ["NODE_ENV=production"]],
    [
      "api.env",
      [
        "NODE_ENV=production",
        "API_ORIGIN=https://api.example.test",
        "LEARNER_AUTH_SECRET=learner-fixture-secret",
        "CURSOR_SIGNING_SECRET=cursor-fixture-secret",
        "ADMIN_AUTH_SECRET=admin-fixture-secret",
        "ADMIN_ASSET_PUBLIC_BASE_URL=https://assets.example.test",
        "ADMIN_ASSET_S3_ACCESS_KEY=asset-access-key",
        "ADMIN_ASSET_S3_BUCKET=writing-app-assets",
        "ADMIN_ASSET_S3_ENDPOINT=https://r2.example.test",
        "ADMIN_ASSET_S3_REGION=auto",
        "ADMIN_ASSET_S3_SECRET_KEY=asset-secret-key",
        "WEB_ORIGIN=https://app.example.test",
        "ADMIN_ORIGIN=https://admin.example.test",
        "API_ALLOWED_HOSTS=api.example.test,api:4000",
      ],
    ],
    ["admin.env", ["NODE_ENV=production", "API_BASE_URL=http://api:4000"]],
  ] as const)
  for (const [fileName, lines] of environmentFiles) {
    fs.writeFileSync(
      path.join(configDirectory, fileName),
      `${lines.join("\n")}\n`
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
      "CADDY_IMAGE=caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648",
      "CLOUDFLARED_IMAGE=cloudflare/cloudflared:2026.6.0@sha256:ba461b8aa9c042156dbd39c38657fe7431bafa063220eab8d5330a523863da9f",
      "LITESTREAM_IMAGE=litestream/litestream:0.5.11@sha256:79e3bfce6ed758722916f816b028fffd9e0a971058f41b88e2779510cead1d8d",
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
  validateCaddyContainerConfig(
    fixture.caddyEnvironmentPath,
    fixture.caddyfilePath,
    "Caddy 설정 검증"
  )
  requireSuccessfulCommand("Litestream 설정 검증", "docker", [
    "run",
    "--rm",
    "--env-file",
    fixture.litestreamEnvironmentPath,
    "--mount",
    `type=bind,source=${fixture.litestreamPath},target=/etc/litestream.yaml,readonly`,
    "litestream/litestream:0.5.11@sha256:79e3bfce6ed758722916f816b028fffd9e0a971058f41b88e2779510cead1d8d",
    "databases",
    "-config",
    "/etc/litestream.yaml",
  ])
}

function validateCaddyContainerConfig(
  caddyEnvironmentPath: string,
  caddyfilePath: string,
  label: string
): void {
  requireSuccessfulCommand(label, "docker", [
    "run",
    "--rm",
    "--env-file",
    caddyEnvironmentPath,
    "--mount",
    `type=bind,source=${caddyfilePath},target=/etc/caddy/caddyfile,readonly`,
    "caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648",
    "caddy",
    "validate",
    "--config",
    "/etc/caddy/caddyfile",
    "--adapter",
    "caddyfile",
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
  const caddyErrors = validateUnifiedApiCaddyContract(
    fs.readFileSync(fixture.caddyfilePath, "utf8")
  )
  const deploymentErrors = [...errors, ...caddyErrors]
  if (deploymentErrors.length > 0) {
    throw new Error(deploymentErrors.map((error) => `- ${error}`).join("\n"))
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
