import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
import type { AdminId } from "@workspace/types/ids"

import { runApplicationMigrations } from "@/db/migrate"
import { createAdminMcpAccessTokenStore } from "@/mcp/admin/admin-mcp-access-token-store"
import {
  parseNamedArguments,
  parseRequiredIsoDate,
  readRequiredOption,
  resolveAdminMcpTokenDatabaseUrl,
} from "@/scripts/admin-mcp-token-command"

const issueArgumentNames = new Set([
  "--actor-admin-id",
  "--expires-at",
  "--owner-admin-id",
  "--scope",
])

export type IssueAdminMcpTokenOptions = Readonly<{
  actorAdminId: AdminId
  expiresAt: Date
  ownerAdminId: AdminId
  scopes: readonly string[]
}>

export function parseIssueAdminMcpTokenArguments(
  arguments_: readonly string[]
): IssueAdminMcpTokenOptions {
  const values = parseNamedArguments(arguments_, issueArgumentNames)
  const actorAdminId = parseAdminId(
    readRequiredOption(values, "--actor-admin-id"),
    "--actor-admin-id"
  )
  const ownerAdminId = parseAdminId(
    readRequiredOption(values, "--owner-admin-id"),
    "--owner-admin-id"
  )
  const expiresAt = parseRequiredIsoDate(
    readRequiredOption(values, "--expires-at"),
    "--expires-at"
  )
  const scopes = values.get("--scope") ?? []
  if (scopes.length === 0 || scopes.some((scope) => scope.trim() === "")) {
    throw new Error("--scope를 한 번 이상 명시해야 합니다.")
  }
  return { actorAdminId, expiresAt, ownerAdminId, scopes }
}

export async function issueAdminMcpToken(input: {
  readonly database: WritingAppDatabase
  readonly now: Date
  readonly options: IssueAdminMcpTokenOptions
}): Promise<string> {
  const result = await createAdminMcpAccessTokenStore(input.database).issue({
    actorAdminId: input.options.actorAdminId,
    createdAt: input.now,
    expiresAt: input.options.expiresAt,
    ownerAdminId: input.options.ownerAdminId,
    scopes: input.options.scopes,
  })
  if (result.kind !== "issued") {
    throw new Error(readIssueFailure(result.kind))
  }

  return JSON.stringify({
    credentialId: result.credentialId,
    expiresAt: result.expiresAt.toISOString(),
    ownerAdminId: result.ownerAdminId,
    scopes: result.scopes,
    token: result.token,
  })
}

function parseAdminId(value: string, name: string): AdminId {
  const result = adminIdSchema.safeParse(value)
  if (!result.success) throw new Error(`${name}이 올바르지 않습니다.`)
  return result.data
}

function readIssueFailure(
  kind: "actor-not-found" | "invalid-input" | "owner-not-found"
): string {
  if (kind === "actor-not-found") {
    return "token 발급 작업 관리자를 찾을 수 없습니다."
  }
  if (kind === "owner-not-found") {
    return "token 소유 관리자를 찾을 수 없습니다."
  }
  return "token 발급 입력이 올바르지 않습니다."
}

async function main(): Promise<void> {
  const options = parseIssueAdminMcpTokenArguments(process.argv.slice(2))
  const databaseUrl = resolveAdminMcpTokenDatabaseUrl(process.env)
  const client = createWritingAppDatabase(databaseUrl)
  try {
    runApplicationMigrations(client.sqlite)
    const output = await issueAdminMcpToken({
      database: client.db,
      now: new Date(),
      options,
    })
    process.stdout.write(`${output}\n`)
  } finally {
    client.close()
  }
}

if (import.meta.main) {
  await main().catch((cause: unknown) => {
    process.stderr.write(
      `${cause instanceof Error ? cause.message : "관리자 MCP token 발급에 실패했습니다."}\n`
    )
    process.exitCode = 1
  })
}
