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
  readRequiredOption,
  resolveAdminMcpTokenDatabaseUrl,
} from "@/scripts/admin-mcp-token-command"

const revokeArgumentNames = new Set(["--actor-admin-id", "--credential-id"])

export type RevokeAdminMcpTokenOptions = Readonly<{
  actorAdminId: AdminId
  credentialId: string
}>

export function parseRevokeAdminMcpTokenArguments(
  arguments_: readonly string[]
): RevokeAdminMcpTokenOptions {
  const values = parseNamedArguments(arguments_, revokeArgumentNames)
  const actorAdminId = adminIdSchema.safeParse(
    readRequiredOption(values, "--actor-admin-id")
  )
  if (!actorAdminId.success) {
    throw new Error("--actor-admin-id가 올바르지 않습니다.")
  }
  return {
    actorAdminId: actorAdminId.data,
    credentialId: readRequiredOption(values, "--credential-id"),
  }
}

export async function revokeAdminMcpToken(input: {
  readonly database: WritingAppDatabase
  readonly now: Date
  readonly options: RevokeAdminMcpTokenOptions
}): Promise<string> {
  const result = await createAdminMcpAccessTokenStore(input.database).revoke({
    actorAdminId: input.options.actorAdminId,
    credentialId: input.options.credentialId,
    revokedAt: input.now,
  })
  if (result.kind !== "revoked" && result.kind !== "already-revoked") {
    throw new Error(readRevokeFailure(result.kind))
  }
  return JSON.stringify({
    credentialId: input.options.credentialId,
    kind: result.kind,
  })
}

function readRevokeFailure(
  kind: "actor-not-found" | "invalid-input" | "not-found"
): string {
  if (kind === "actor-not-found") {
    return "token 폐기 작업 관리자를 찾을 수 없습니다."
  }
  if (kind === "not-found") return "폐기할 token을 찾을 수 없습니다."
  return "token 폐기 입력이 올바르지 않습니다."
}

async function main(): Promise<void> {
  const options = parseRevokeAdminMcpTokenArguments(process.argv.slice(2))
  const databaseUrl = resolveAdminMcpTokenDatabaseUrl(process.env)
  const client = createWritingAppDatabase(databaseUrl)
  try {
    runApplicationMigrations(client.sqlite)
    const output = await revokeAdminMcpToken({
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
      `${cause instanceof Error ? cause.message : "관리자 MCP token 폐기에 실패했습니다."}\n`
    )
    process.exitCode = 1
  })
}
