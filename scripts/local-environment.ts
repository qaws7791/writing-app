import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const environmentFiles = [
  {
    examplePath: "apps/api/.env.example",
    targetPath: "apps/api/.env",
  },
  {
    examplePath: "apps/web/.env.example",
    targetPath: "apps/web/.env",
  },
  {
    examplePath: "apps/admin/.env.example",
    targetPath: "apps/admin/.env",
  },
] as const

const generatedApiKeys = [
  "LEARNER_AUTH_SECRET",
  "ADMIN_AUTH_SECRET",
  "CURSOR_SIGNING_SECRET",
  "ADMIN_SEED_PASSWORD",
] as const

type EnvironmentFileResult =
  | Readonly<{ kind: "created" | "preserved"; path: string }>
  | Readonly<{ keys: readonly string[]; kind: "updated"; path: string }>

type ParsedEnvironment = Readonly<{
  duplicateKeys: readonly string[]
  values: ReadonlyMap<string, string>
}>

export function prepareLocalEnvironmentFiles(
  repositoryRoot: string
): readonly EnvironmentFileResult[] {
  return environmentFiles.map(({ examplePath, targetPath }) => {
    const example = readRequiredFile(repositoryRoot, examplePath)
    const preparedExample =
      targetPath === "apps/api/.env" ? prepareApiExample(example) : example
    const target = path.join(repositoryRoot, targetPath)

    if (!existsSync(target)) {
      writeFileSync(target, preparedExample, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      })
      return { kind: "created", path: targetPath }
    }

    const current = readFileSync(target, "utf8")
    const reconciliation = reconcileEnvironmentFile({
      current,
      example,
      preparedExample,
      repairKnownPlaceholders: targetPath === "apps/api/.env",
    })
    if (reconciliation.keys.length === 0) {
      return { kind: "preserved", path: targetPath }
    }

    writeFileSync(target, reconciliation.content, {
      encoding: "utf8",
      mode: 0o600,
    })
    return {
      keys: reconciliation.keys,
      kind: "updated",
      path: targetPath,
    }
  })
}

export function inspectLocalEnvironmentFiles(
  repositoryRoot: string
): readonly string[] {
  const issues: string[] = []

  for (const { examplePath, targetPath } of environmentFiles) {
    const target = path.join(repositoryRoot, targetPath)
    if (!existsSync(target)) {
      issues.push(`${targetPath}이 없습니다.`)
      continue
    }

    const example = parseEnvironment(
      readRequiredFile(repositoryRoot, examplePath)
    )
    const current = parseEnvironment(readFileSync(target, "utf8"))
    if (current.duplicateKeys.length > 0) {
      issues.push(
        `${targetPath}에 중복 환경 변수가 있습니다: ${current.duplicateKeys.join(", ")}`
      )
    }

    const missingKeys = [...example.values.keys()].filter(
      (key) => (current.values.get(key)?.trim().length ?? 0) === 0
    )
    if (missingKeys.length > 0) {
      issues.push(
        `${targetPath}에 필수 환경 변수가 없습니다: ${missingKeys.join(", ")}`
      )
    }

    if (targetPath === "apps/api/.env") {
      const placeholders = generatedApiKeys.filter(
        (key) => current.values.get(key) === example.values.get(key)
      )
      if (placeholders.length > 0) {
        issues.push(
          `${targetPath}에 예시 placeholder가 남아 있습니다: ${placeholders.join(", ")}`
        )
      }

      const secrets = generatedApiKeys
        .slice(0, 3)
        .map((key) => current.values.get(key))
        .filter((value): value is string => value !== undefined)
      if (secrets.length === 3 && new Set(secrets).size !== secrets.length) {
        issues.push(
          "학습자·관리자 인증과 cursor 서명 secret은 서로 달라야 합니다."
        )
      }
    }
  }

  return issues
}

export function readLocalApiEnvironment(
  repositoryRoot: string
): Readonly<Record<string, string>> {
  const targetPath = path.join(repositoryRoot, "apps/api/.env")
  const parsed = parseEnvironment(readFileSync(targetPath, "utf8"))
  if (parsed.duplicateKeys.length > 0) {
    throw new Error(
      `apps/api/.env에 중복 환경 변수가 있습니다: ${parsed.duplicateKeys.join(", ")}`
    )
  }
  return Object.fromEntries(parsed.values)
}

export function applyEnvironmentOverrides(
  base: Readonly<Record<string, string>>,
  overrides: Readonly<Record<string, string | undefined>>
): Readonly<Record<string, string>> {
  const environment = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) environment[key] = value
  }
  return environment
}

function prepareApiExample(example: string): string {
  return replaceEnvironmentValue(
    replaceEnvironmentValue(
      replaceEnvironmentValue(
        replaceEnvironmentValue(
          replaceEnvironmentValue(
            example,
            "LEARNER_AUTH_SECRET",
            createSecret()
          ),
          "ADMIN_AUTH_SECRET",
          createSecret()
        ),
        "CURSOR_SIGNING_SECRET",
        createSecret()
      ),
      "ADMIN_SEED_PASSWORD",
      `${createSecret()}Aa1!`
    ),
    "ADMIN_SEED_RESET_PASSWORD",
    "false"
  )
}

function reconcileEnvironmentFile(input: {
  readonly current: string
  readonly example: string
  readonly preparedExample: string
  readonly repairKnownPlaceholders: boolean
}): Readonly<{ content: string; keys: readonly string[] }> {
  const current = parseEnvironment(input.current)
  if (current.duplicateKeys.length > 0) {
    throw new Error(
      `중복 환경 변수를 자동 수정할 수 없습니다: ${current.duplicateKeys.join(", ")}`
    )
  }

  const example = parseEnvironment(input.example).values
  const prepared = parseEnvironment(input.preparedExample).values
  const keys = [...example.keys()].filter((key) => {
    const value = current.values.get(key)
    if (value === undefined || value.trim() === "") return true
    return (
      input.repairKnownPlaceholders &&
      generatedApiKeys.some((generatedKey) => generatedKey === key) &&
      value === example.get(key)
    )
  })

  if (
    input.repairKnownPlaceholders &&
    keys.includes("ADMIN_SEED_PASSWORD") &&
    !keys.includes("ADMIN_SEED_RESET_PASSWORD")
  ) {
    keys.push("ADMIN_SEED_RESET_PASSWORD")
  }

  let content = input.current
  for (const key of keys) {
    const value = prepared.get(key)
    if (value === undefined) {
      throw new Error(`환경 변수 예시에 ${key}가 없습니다.`)
    }
    content = current.values.has(key)
      ? replaceEnvironmentValue(content, key, value)
      : appendEnvironmentValue(content, key, value)
  }

  return { content, keys: [...keys].sort() }
}

function parseEnvironment(content: string): ParsedEnvironment {
  const values = new Map<string, string>()
  const duplicateKeys = new Set<string>()

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (line === "" || line.startsWith("#")) continue
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line)
    if (match === null) continue

    const key = match[1]
    const value = unwrapEnvironmentValue(match[2].trim())
    if (values.has(key)) duplicateKeys.add(key)
    values.set(key, value)
  }

  return { duplicateKeys: [...duplicateKeys].sort(), values }
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
  content: string,
  name: string,
  value: string
): string {
  const pattern = new RegExp(`^${name}=.*$`, "mu")
  if (!pattern.test(content)) {
    throw new Error(`${name} 환경 변수 줄이 없습니다.`)
  }
  return content.replace(pattern, `${name}=${value}`)
}

function appendEnvironmentValue(
  content: string,
  name: string,
  value: string
): string {
  const separator = content.endsWith("\n") ? "" : "\n"
  return `${content}${separator}${name}=${value}\n`
}

function readRequiredFile(repositoryRoot: string, filePath: string): string {
  const absolutePath = path.join(repositoryRoot, filePath)
  if (!existsSync(absolutePath)) {
    throw new Error(`${filePath}이 없습니다.`)
  }
  return readFileSync(absolutePath, "utf8")
}

function createSecret(): string {
  return randomBytes(32).toString("base64url")
}
