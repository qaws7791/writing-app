import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  readToolchainContract,
  validateToolchainRuntime,
} from "#scripts/check-toolchain"

const localEnvironmentFiles = [
  {
    examplePath: "apps/api/.env.example",
    path: "apps/api/.env",
    prepare: (template: string, credentials: LocalCredentials) =>
      replaceEnvironmentValue(
        replaceEnvironmentValue(
          replaceEnvironmentValue(
            replaceEnvironmentValue(
              replaceEnvironmentValue(
                template,
                "BETTER_AUTH_SECRET",
                credentials.learnerAuthSecret
              ),
              "CURSOR_SIGNING_SECRET",
              credentials.cursorSigningSecret
            ),
            "ADMIN_BETTER_AUTH_SECRET",
            credentials.adminAuthSecret
          ),
          "ADMIN_SEED_PASSWORD",
          credentials.adminSeedPassword
        ),
        "ADMIN_SEED_RESET_PASSWORD",
        "false"
      ),
  },
  {
    examplePath: "apps/web/.env.example",
    path: "apps/web/.env",
    prepare: (template: string) => template,
  },
  {
    examplePath: "apps/admin/.env.example",
    path: "apps/admin/.env",
    prepare: (template: string) => template,
  },
] as const

export interface LocalCredentials {
  readonly adminAuthSecret: string
  readonly adminSeedPassword: string
  readonly cursorSigningSecret: string
  readonly learnerAuthSecret: string
}

export type LocalEnvironmentFileResult =
  | {
      readonly kind: "created"
      readonly path: string
    }
  | {
      readonly kind: "preserved"
      readonly path: string
    }

export type LocalOnboardingCheck =
  | {
      readonly detail: string
      readonly kind: "failure"
      readonly label: string
    }
  | {
      readonly detail: string
      readonly kind: "pass"
      readonly label: string
    }
  | {
      readonly detail: string
      readonly kind: "warning"
      readonly label: string
    }

export interface CreateLocalEnvironmentOptions {
  readonly createCredentials?: () => LocalCredentials
  readonly repositoryRoot: string
}

export interface InspectLocalOnboardingOptions {
  readonly bunVersion: string
  readonly nodeVersion: string
  readonly repositoryRoot: string
  readonly requireDatabase?: boolean
}

export function createLocalCredentials(): LocalCredentials {
  return {
    adminAuthSecret: randomBytes(32).toString("base64url"),
    adminSeedPassword: `${randomBytes(24).toString("base64url")}Aa1!`,
    cursorSigningSecret: randomBytes(32).toString("base64url"),
    learnerAuthSecret: randomBytes(32).toString("base64url"),
  }
}

export function createLocalEnvironmentFiles({
  createCredentials = createLocalCredentials,
  repositoryRoot,
}: CreateLocalEnvironmentOptions): readonly LocalEnvironmentFileResult[] {
  const missingFiles = localEnvironmentFiles.filter(
    (file) => !existsSync(path.join(repositoryRoot, file.path))
  )
  const credentials = missingFiles.length > 0 ? createCredentials() : undefined

  if (
    credentials !== undefined &&
    (credentials.adminAuthSecret === credentials.learnerAuthSecret ||
      credentials.cursorSigningSecret === credentials.learnerAuthSecret)
  ) {
    throw new Error("인증과 cursor 서명 비밀값은 서로 달라야 합니다.")
  }

  return localEnvironmentFiles.map((file) => {
    const targetPath = path.join(repositoryRoot, file.path)
    if (existsSync(targetPath)) {
      return { kind: "preserved", path: file.path }
    }

    if (credentials === undefined) {
      throw new Error("로컬 credential 생성 결과가 없습니다.")
    }

    const examplePath = path.join(repositoryRoot, file.examplePath)
    if (!existsSync(examplePath)) {
      throw new Error(`${file.examplePath} 파일이 없습니다.`)
    }

    const content = file.prepare(readFileSync(examplePath, "utf8"), credentials)
    mkdirSync(path.dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, content, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    })

    return { kind: "created", path: file.path }
  })
}

export function inspectLocalOnboarding({
  bunVersion,
  nodeVersion,
  repositoryRoot,
  requireDatabase = true,
}: InspectLocalOnboardingOptions): readonly LocalOnboardingCheck[] {
  const checks: LocalOnboardingCheck[] = []
  checks.push(...inspectToolchain(repositoryRoot, bunVersion, nodeVersion))

  if (existsSync(path.join(repositoryRoot, "node_modules"))) {
    checks.push({
      detail: "node_modules 디렉터리가 있습니다.",
      kind: "pass",
      label: "의존성",
    })
  } else {
    checks.push({
      detail: "bun install --frozen-lockfile을 실행하세요.",
      kind: "failure",
      label: "의존성",
    })
  }

  const environments = new Map<string, ReadonlyMap<string, string>>()
  for (const file of localEnvironmentFiles) {
    const absolutePath = path.join(repositoryRoot, file.path)
    if (!existsSync(absolutePath)) {
      checks.push({
        detail: `${file.examplePath}에서 ${file.path}을 준비하세요.`,
        kind: "failure",
        label: file.path,
      })
      continue
    }

    environments.set(file.path, parseEnvironmentFile(absolutePath))
    checks.push({
      detail: "환경 파일이 있습니다.",
      kind: "pass",
      label: file.path,
    })
  }

  checks.push(...inspectAuthSecrets(environments))
  checks.push(...inspectTestAuthentication(environments))
  checks.push(...inspectDatabase(repositoryRoot, environments, requireDatabase))

  return checks
}

export function printLocalOnboardingChecks(
  checks: readonly LocalOnboardingCheck[]
): void {
  const symbols = {
    failure: "✗",
    pass: "✓",
    warning: "!",
  } as const

  for (const check of checks) {
    console.log(`${symbols[check.kind]} ${check.label}: ${check.detail}`)
  }
}

export function hasLocalOnboardingFailures(
  checks: readonly LocalOnboardingCheck[]
): boolean {
  return checks.some((check) => check.kind === "failure")
}

function inspectToolchain(
  repositoryRoot: string,
  bunVersion: string,
  nodeVersion: string
): readonly LocalOnboardingCheck[] {
  const manifestPath = path.join(repositoryRoot, "package.json")
  if (!existsSync(manifestPath)) {
    return [
      {
        detail: "루트 package.json이 없습니다.",
        kind: "failure",
        label: "도구 버전",
      },
    ]
  }

  const contract = readToolchainContract(
    JSON.parse(readFileSync(manifestPath, "utf8")) as unknown
  )
  if (contract.kind === "invalid") {
    return contract.errors.map((detail) => ({
      detail,
      kind: "failure" as const,
      label: "도구 버전",
    }))
  }

  const errors = validateToolchainRuntime(contract.contract, {
    bunVersion,
    nodeVersion,
  })
  if (errors.length > 0) {
    return errors.map((detail) => ({
      detail,
      kind: "failure" as const,
      label: "도구 버전",
    }))
  }

  return [
    {
      detail: `Bun ${bunVersion}, Node.js ${nodeVersion}`,
      kind: "pass",
      label: "도구 버전",
    },
  ]
}

function inspectAuthSecrets(
  environments: ReadonlyMap<string, ReadonlyMap<string, string>>
): readonly LocalOnboardingCheck[] {
  const learnerSecret = environments
    .get("apps/api/.env")
    ?.get("BETTER_AUTH_SECRET")
  const adminSecret = environments
    .get("apps/api/.env")
    ?.get("ADMIN_BETTER_AUTH_SECRET")
  const cursorSecret = environments
    .get("apps/api/.env")
    ?.get("CURSOR_SIGNING_SECRET")

  if (
    learnerSecret === undefined ||
    adminSecret === undefined ||
    cursorSecret === undefined
  ) {
    return []
  }

  const checks: LocalOnboardingCheck[] = []
  checks.push(inspectSecret("학습자 인증 비밀값", learnerSecret))
  checks.push(inspectSecret("관리자 인증 비밀값", adminSecret))
  checks.push(inspectSecret("cursor 서명 비밀값", cursorSecret))
  checks.push(
    learnerSecret === adminSecret
      ? {
          detail: "학습자와 관리자 인증 비밀값이 같습니다.",
          kind: "failure",
          label: "인증 비밀값 분리",
        }
      : {
          detail: "학습자와 관리자 인증 비밀값이 분리되어 있습니다.",
          kind: "pass",
          label: "인증 비밀값 분리",
        }
  )
  checks.push(
    learnerSecret === cursorSecret
      ? {
          detail: "학습자 인증과 cursor 서명 비밀값이 같습니다.",
          kind: "failure",
          label: "cursor 비밀값 분리",
        }
      : {
          detail: "학습자 인증과 cursor 서명 비밀값이 분리되어 있습니다.",
          kind: "pass",
          label: "cursor 비밀값 분리",
        }
  )

  return checks
}

function inspectSecret(label: string, value: string): LocalOnboardingCheck {
  const placeholder = /change|example|placeholder|replace/iu.test(value)
  if (value.length < 32 || placeholder) {
    return {
      detail: "32자 이상의 placeholder가 아닌 값을 사용하세요.",
      kind: "failure",
      label,
    }
  }

  return {
    detail: "최소 길이와 placeholder 검사를 통과했습니다.",
    kind: "pass",
    label,
  }
}

function inspectTestAuthentication(
  environments: ReadonlyMap<string, ReadonlyMap<string, string>>
): readonly LocalOnboardingCheck[] {
  const apiValue = environments.get("apps/api/.env")?.get("ENABLE_TEST_AUTH")
  const webValue = environments.get("apps/web/.env")?.get("ENABLE_TEST_AUTH")

  if (apiValue === undefined || webValue === undefined) {
    return []
  }

  if (apiValue !== webValue) {
    return [
      {
        detail: "apps/api와 apps/web의 ENABLE_TEST_AUTH 값을 일치시키세요.",
        kind: "failure",
        label: "테스트 인증",
      },
    ]
  }

  return [
    apiValue === "true"
      ? {
          detail: "학습자 테스트 로그인이 활성화되어 있습니다.",
          kind: "pass",
          label: "테스트 인증",
        }
      : {
          detail: "학습자 테스트 로그인이 비활성화되어 있습니다.",
          kind: "warning",
          label: "테스트 인증",
        },
  ]
}

function inspectDatabase(
  repositoryRoot: string,
  environments: ReadonlyMap<string, ReadonlyMap<string, string>>,
  requireDatabase: boolean
): readonly LocalOnboardingCheck[] {
  const databaseUrl = environments.get("apps/api/.env")?.get("DATABASE_URL")

  if (databaseUrl === undefined) {
    return []
  }

  const databasePath = resolveLocalDatabasePath(repositoryRoot, databaseUrl)

  if (databasePath === null) {
    return [
      {
        detail: "로컬 setup은 file-backed SQLite DATABASE_URL이 필요합니다.",
        kind: "failure",
        label: "로컬 데이터베이스",
      },
    ]
  }

  if (existsSync(databasePath)) {
    return [
      {
        detail: `${path.relative(repositoryRoot, databasePath).replaceAll(path.sep, "/")} 파일이 있습니다.`,
        kind: "pass",
        label: "로컬 데이터베이스",
      },
    ]
  }

  return [
    requireDatabase
      ? {
          detail: "bun run dev:admin:setup을 실행하세요.",
          kind: "failure",
          label: "로컬 데이터베이스",
        }
      : {
          detail: "setup이 migration과 seed를 실행하면 생성됩니다.",
          kind: "warning",
          label: "로컬 데이터베이스",
        },
  ]
}

function resolveLocalDatabasePath(
  repositoryRoot: string,
  databaseUrl: string
): string | null {
  if (
    databaseUrl === ":memory:" ||
    /^[a-z][a-z\d+.-]*:\/\//iu.test(databaseUrl)
  ) {
    return null
  }

  const filePath = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl
  return path.resolve(repositoryRoot, filePath)
}

function parseEnvironmentFile(filePath: string): ReadonlyMap<string, string> {
  const values = new Map<string, string>()

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith("#")) continue

    const separator = line.indexOf("=")
    if (separator < 1) continue

    const key = line.slice(0, separator).trim()
    const rawValue = line.slice(separator + 1).trim()
    values.set(key, unwrapEnvironmentValue(rawValue))
  }

  return values
}

function unwrapEnvironmentValue(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function replaceEnvironmentValue(
  template: string,
  key: string,
  value: string
): string {
  const pattern = new RegExp(`^${key}=.*$`, "mu")
  if (!pattern.test(template)) {
    throw new Error(`환경 변수 예시에 ${key}가 없습니다.`)
  }

  return template.replace(pattern, `${key}=${value}`)
}
