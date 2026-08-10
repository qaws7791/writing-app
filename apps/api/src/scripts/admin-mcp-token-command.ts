import { getDefaultDatabaseUrl } from "@workspace/db/client"

export type AdminMcpTokenCommandEnvironment = Readonly<{
  ADMIN_MCP_TOKEN_EXPECTED_DATABASE_URL?: string
  ADMIN_MCP_TOKEN_MANAGEMENT_APPROVED?: string
  DATABASE_URL?: string
  NODE_ENV?: string
}>

export function resolveAdminMcpTokenDatabaseUrl(
  environment: AdminMcpTokenCommandEnvironment
): string {
  const databaseUrl = environment.DATABASE_URL ?? getDefaultDatabaseUrl()
  if (environment.NODE_ENV !== "production") return databaseUrl

  if (environment.DATABASE_URL === undefined) {
    throw new Error(
      "production 관리자 MCP token 관리에는 명시적인 DATABASE_URL이 필요합니다."
    )
  }
  if (environment.ADMIN_MCP_TOKEN_MANAGEMENT_APPROVED !== "true") {
    throw new Error(
      "production 관리자 MCP token 관리에는 ADMIN_MCP_TOKEN_MANAGEMENT_APPROVED=true가 필요합니다."
    )
  }
  if (environment.ADMIN_MCP_TOKEN_EXPECTED_DATABASE_URL !== databaseUrl) {
    throw new Error(
      "production 관리자 MCP token 관리 대상 DATABASE_URL 확인값이 일치하지 않습니다."
    )
  }
  return databaseUrl
}

export function parseRequiredIsoDate(
  value: string | undefined,
  name: string
): Date {
  if (value === undefined) throw new Error(`${name}을 명시해야 합니다.`)
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${name}은 UTC ISO 8601 형식이어야 합니다.`)
  }
  return parsed
}

export function readRequiredOption(
  values: ReadonlyMap<string, readonly string[]>,
  name: string
): string {
  const entries = values.get(name)
  if (entries?.length !== 1 || entries[0]?.trim() === "") {
    throw new Error(`${name}을 한 번 명시해야 합니다.`)
  }
  return entries[0] as string
}

export function parseNamedArguments(
  arguments_: readonly string[],
  allowedNames: ReadonlySet<string>
): ReadonlyMap<string, readonly string[]> {
  const values = new Map<string, string[]>()
  for (const argument of arguments_) {
    const separator = argument.indexOf("=")
    const name = separator < 0 ? argument : argument.slice(0, separator)
    const value = separator < 0 ? "" : argument.slice(separator + 1)
    if (!allowedNames.has(name)) {
      throw new Error(`지원하지 않는 관리자 MCP token 인자입니다: ${name}`)
    }
    values.set(name, [...(values.get(name) ?? []), value])
  }
  return values
}
