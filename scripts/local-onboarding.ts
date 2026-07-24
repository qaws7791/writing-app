import { randomBytes } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

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
                "LEARNER_AUTH_SECRET",
                credentials.learnerAuthSecret
              ),
              "CURSOR_SIGNING_SECRET",
              credentials.cursorSigningSecret
            ),
            "ADMIN_AUTH_SECRET",
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
  | {
      readonly addedKeys: readonly string[]
      readonly kind: "updated"
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

export interface LocalSetupEnvironment {
  readonly databaseUrl: string
  readonly processEnvironment: Readonly<NodeJS.ProcessEnv>
}

function createLocalCredentials(): LocalCredentials {
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
  const changesRequired = localEnvironmentFiles.some((file) =>
    environmentFileNeedsUpdate(repositoryRoot, file)
  )
  const credentials = changesRequired ? createCredentials() : undefined

  if (
    credentials !== undefined &&
    (credentials.adminAuthSecret === credentials.learnerAuthSecret ||
      credentials.adminAuthSecret === credentials.cursorSigningSecret ||
      credentials.cursorSigningSecret === credentials.learnerAuthSecret)
  ) {
    throw new Error("인증과 cursor 서명 비밀값은 서로 달라야 합니다.")
  }

  return localEnvironmentFiles.map((file) => {
    const targetPath = path.join(repositoryRoot, file.path)
    const examplePath = path.join(repositoryRoot, file.examplePath)
    if (!existsSync(examplePath)) {
      throw new Error(`${file.examplePath} 파일이 없습니다.`)
    }

    if (!existsSync(targetPath)) {
      if (credentials === undefined) {
        throw new Error("로컬 credential 생성 결과가 없습니다.")
      }

      const content = file.prepare(
        readFileSync(examplePath, "utf8"),
        credentials
      )
      mkdirSync(path.dirname(targetPath), { recursive: true })
      writeFileSync(targetPath, content, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      })

      return { kind: "created", path: file.path }
    }

    if (credentials === undefined) {
      return { kind: "preserved", path: file.path }
    }

    const template = file.prepare(
      readFileSync(examplePath, "utf8"),
      credentials
    )
    const reconciliation = reconcileEnvironmentFile(
      readFileSync(targetPath, "utf8"),
      template
    )
    if (reconciliation.addedKeys.length === 0) {
      return { kind: "preserved", path: file.path }
    }

    writeFileSync(targetPath, reconciliation.content, {
      encoding: "utf8",
      mode: 0o600,
    })

    return {
      addedKeys: reconciliation.addedKeys,
      kind: "updated",
      path: file.path,
    }
  })
}

export function createLocalSetupEnvironment(
  repositoryRoot: string,
  inheritedEnvironment: Readonly<NodeJS.ProcessEnv>
): LocalSetupEnvironment {
  const apiEnvironment = parseEnvironmentFile(
    path.join(repositoryRoot, "apps/api/.env")
  )
  const conflictingKeys = [...apiEnvironment.entries()]
    .filter(
      ([key, value]) =>
        inheritedEnvironment[key] !== undefined &&
        inheritedEnvironment[key] !== value
    )
    .map(([key]) => key)
    .sort()

  if (conflictingKeys.length > 0) {
    throw new Error(
      `로컬 setup 환경과 shell 환경이 충돌합니다: ${conflictingKeys.join(", ")}`
    )
  }

  const databaseUrl = apiEnvironment.get("DATABASE_URL")
  if (databaseUrl === undefined) {
    throw new Error(
      "로컬 setup은 file-backed SQLite DATABASE_URL이 필요합니다."
    )
  }
  if (databaseUrl.includes("$")) {
    throw new Error(
      "로컬 setup의 DATABASE_URL에는 환경 변수 보간을 사용할 수 없습니다."
    )
  }
  if (apiEnvironment.get("NODE_ENV") !== "development") {
    throw new Error(
      "로컬 setup은 NODE_ENV=development에서만 실행할 수 있습니다."
    )
  }
  if (apiEnvironment.get("ADMIN_SEED_RESET_PASSWORD") !== "false") {
    throw new Error(
      "로컬 setup은 ADMIN_SEED_RESET_PASSWORD=false가 필요합니다."
    )
  }

  return {
    databaseUrl,
    processEnvironment: {
      ...inheritedEnvironment,
      ...Object.fromEntries(apiEnvironment),
    },
  }
}

export function prepareLocalDatabaseDirectory(
  repositoryRoot: string,
  databaseUrl: string
): string {
  const databasePath = resolveLocalDatabasePath(repositoryRoot, databaseUrl)

  if (databasePath === null) {
    throw new Error(
      "로컬 setup은 file-backed SQLite DATABASE_URL이 필요합니다."
    )
  }

  mkdirSync(path.dirname(databasePath), { recursive: true })

  if (existsSync(databasePath) && !statSync(databasePath).isFile()) {
    throw new Error("DATABASE_URL 경로는 SQLite 파일이어야 합니다.")
  }

  return path.relative(repositoryRoot, path.dirname(databasePath)) || "."
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
  const examples = new Map<string, ReadonlyMap<string, string>>()
  for (const file of localEnvironmentFiles) {
    const absolutePath = path.join(repositoryRoot, file.path)
    const examplePath = path.join(repositoryRoot, file.examplePath)
    if (!existsSync(examplePath)) {
      checks.push({
        detail: `${file.examplePath} 파일이 없습니다.`,
        kind: "failure",
        label: file.examplePath,
      })
      continue
    }

    const example = parseEnvironmentContent(readFileSync(examplePath, "utf8"))
    examples.set(file.path, example)
    if (!existsSync(absolutePath)) {
      checks.push({
        detail: `${file.examplePath}에서 ${file.path}을 준비하세요.`,
        kind: "failure",
        label: file.path,
      })
      continue
    }

    const environment = parseEnvironmentFile(absolutePath)
    environments.set(file.path, environment)
    checks.push({
      detail: "환경 파일이 있습니다.",
      kind: "pass",
      label: file.path,
    })
    checks.push(
      inspectRequiredEnvironmentValues(file.path, environment, example)
    )
  }

  checks.push(...inspectLocalRuntimeContract(environments, examples))
  checks.push(...inspectAuthSecrets(environments))
  checks.push(...inspectLocalSetupSafety(environments))
  checks.push(...inspectDatabase(repositoryRoot, environments, requireDatabase))

  return checks
}

function inspectLocalSetupSafety(
  environments: ReadonlyMap<string, ReadonlyMap<string, string>>
): readonly LocalOnboardingCheck[] {
  const apiEnvironment = environments.get("apps/api/.env")
  if (apiEnvironment === undefined) return []

  const checks: LocalOnboardingCheck[] = []
  const nodeEnvironment = apiEnvironment.get("NODE_ENV")
  if (nodeEnvironment !== undefined) {
    checks.push(
      nodeEnvironment === "development"
        ? {
            detail: "로컬 개발 환경입니다.",
            kind: "pass",
            label: "로컬 setup 실행 환경",
          }
        : {
            detail: "NODE_ENV=development에서만 로컬 setup을 실행하세요.",
            kind: "failure",
            label: "로컬 setup 실행 환경",
          }
    )
  }

  const resetPassword = apiEnvironment.get("ADMIN_SEED_RESET_PASSWORD")
  if (resetPassword !== undefined) {
    checks.push(
      resetPassword === "false"
        ? {
            detail: "기존 관리자 credential을 보존합니다.",
            kind: "pass",
            label: "로컬 setup 관리자 seed",
          }
        : {
            detail:
              "ADMIN_SEED_RESET_PASSWORD=false에서만 로컬 setup을 실행하세요.",
            kind: "failure",
            label: "로컬 setup 관리자 seed",
          }
    )
  }

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
    ?.get("LEARNER_AUTH_SECRET")
  const adminSecret = environments
    .get("apps/api/.env")
    ?.get("ADMIN_AUTH_SECRET")
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
  checks.push(
    adminSecret === cursorSecret
      ? {
          detail: "관리자 인증과 cursor 서명 비밀값이 같습니다.",
          kind: "failure",
          label: "관리자 cursor 비밀값 분리",
        }
      : {
          detail: "관리자 인증과 cursor 서명 비밀값이 분리되어 있습니다.",
          kind: "pass",
          label: "관리자 cursor 비밀값 분리",
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

export function resolveLocalDatabasePath(
  repositoryRoot: string,
  databaseUrl: string
): string | null {
  if (databaseUrl.includes("$")) return null
  if (
    databaseUrl === ":memory:" ||
    (!databaseUrl.startsWith("file://") &&
      /^[a-z][a-z\d+.-]*:\/\//iu.test(databaseUrl))
  ) {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    try {
      return fileURLToPath(databaseUrl)
    } catch {
      return null
    }
  }

  const filePath = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl
  return path.resolve(repositoryRoot, filePath)
}

function parseEnvironmentFile(filePath: string): ReadonlyMap<string, string> {
  return parseEnvironmentContent(readFileSync(filePath, "utf8"))
}

function parseEnvironmentContent(content: string): ReadonlyMap<string, string> {
  const values = new Map<string, string>()

  for (const rawLine of content.split(/\r?\n/u)) {
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

function environmentFileNeedsUpdate(
  repositoryRoot: string,
  file: (typeof localEnvironmentFiles)[number]
): boolean {
  const targetPath = path.join(repositoryRoot, file.path)
  const examplePath = path.join(repositoryRoot, file.examplePath)
  if (!existsSync(targetPath)) return true
  if (!existsSync(examplePath)) {
    throw new Error(`${file.examplePath} 파일이 없습니다.`)
  }

  const environment = parseEnvironmentFile(targetPath)
  const example = parseEnvironmentFile(examplePath)
  return [...example.keys()].some(
    (key) => (environment.get(key)?.trim().length ?? 0) === 0
  )
}

function reconcileEnvironmentFile(
  content: string,
  template: string
): {
  readonly addedKeys: readonly string[]
  readonly content: string
} {
  const currentValues = parseEnvironmentContent(content)
  const templateValues = parseEnvironmentContent(template)
  const addedKeys = [...templateValues.keys()].filter(
    (key) => (currentValues.get(key)?.trim().length ?? 0) === 0
  )
  const absentKeys = addedKeys.filter((key) => !currentValues.has(key))
  const emptyKeys = addedKeys.filter((key) => currentValues.has(key))
  let nextContent = content
  for (const key of emptyKeys) {
    const desiredValue = templateValues.get(key)
    if (desiredValue === undefined) {
      throw new Error(`환경 변수 예시에 ${key}가 없습니다.`)
    }
    nextContent = replaceEnvironmentValue(nextContent, key, desiredValue)
  }
  if (absentKeys.length > 0) {
    const separator = nextContent.endsWith("\n") ? "" : "\n"
    const additions = absentKeys
      .map((key) => `${key}=${templateValues.get(key) ?? ""}`)
      .join("\n")
    nextContent = `${nextContent}${separator}${additions}\n`
  }

  return { addedKeys, content: nextContent }
}

function inspectRequiredEnvironmentValues(
  filePath: string,
  environment: ReadonlyMap<string, string>,
  example: ReadonlyMap<string, string>
): LocalOnboardingCheck {
  const missingKeys = [...example.keys()].filter(
    (key) => (environment.get(key)?.trim().length ?? 0) === 0
  )

  if (missingKeys.length > 0) {
    return {
      detail: `필수 환경 변수가 없거나 비어 있습니다: ${missingKeys.join(", ")}`,
      kind: "failure",
      label: `${filePath} 필수 환경 변수`,
    }
  }

  return {
    detail: `${example.size}개 필수 환경 변수가 채워져 있습니다.`,
    kind: "pass",
    label: `${filePath} 필수 환경 변수`,
  }
}

function inspectLocalRuntimeContract(
  environments: ReadonlyMap<string, ReadonlyMap<string, string>>,
  examples: ReadonlyMap<string, ReadonlyMap<string, string>>
): readonly LocalOnboardingCheck[] {
  const contractKeys = new Map<string, readonly string[]>([
    ["apps/api/.env", ["ADMIN_ORIGIN", "WEB_ORIGIN"]],
    ["apps/web/.env", ["API_BASE_URL", "WEB_ORIGIN"]],
    [
      "apps/admin/.env",
      ["API_BASE_URL", "ADMIN_ORIGIN", "NEXT_PUBLIC_LEARNER_WEB_ORIGIN"],
    ],
  ])
  const mismatches: string[] = []

  for (const [filePath, keys] of contractKeys) {
    const environment = environments.get(filePath)
    const example = examples.get(filePath)
    if (environment === undefined || example === undefined) continue

    for (const key of keys) {
      if (environment.get(key) !== example.get(key)) {
        mismatches.push(`${filePath}:${key}`)
      }
    }
  }

  return [
    mismatches.length > 0
      ? {
          detail: `로컬 표준값과 다릅니다: ${mismatches.join(", ")}`,
          kind: "failure",
          label: "로컬 런타임 계약",
        }
      : {
          detail:
            "관리자·학습자 origin과 내부 API 주소가 로컬 표준과 일치합니다.",
          kind: "pass",
          label: "로컬 런타임 계약",
        },
  ]
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
