import { sql } from "drizzle-orm"
import { adminAuthUsers } from "@workspace/auth/schema"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

export const adminMcpAccessTokens = sqliteTable(
  "admin_mcp_access_tokens",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    credentialId: text("credential_id").primaryKey().notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ownerAdminId: text("owner_admin_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    scopesJson: text("scopes_json").notNull(),
    secretDigest: text("secret_digest").notNull(),
  },
  (table) => [
    check(
      "admin_mcp_access_tokens_credential_id_check",
      sql`length(${table.credentialId}) = 37 AND substr(${table.credentialId}, 1, 5) = 'wmcp_' AND substr(${table.credentialId}, 6) NOT GLOB '*[^a-f0-9]*'`
    ),
    check(
      "admin_mcp_access_tokens_digest_check",
      sql`length(${table.secretDigest}) = 64 AND ${table.secretDigest} NOT GLOB '*[^a-f0-9]*'`
    ),
    check(
      "admin_mcp_access_tokens_scopes_check",
      sql`json_valid(${table.scopesJson}) AND json_type(${table.scopesJson}) = 'array' AND json_array_length(${table.scopesJson}) BETWEEN 1 AND 32`
    ),
    check(
      "admin_mcp_access_tokens_time_check",
      sql`${table.expiresAt} > ${table.createdAt} AND (${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt})`
    ),
    index("admin_mcp_access_tokens_owner_idx").on(
      table.ownerAdminId,
      table.createdAt,
      table.credentialId
    ),
    index("admin_mcp_access_tokens_expiry_idx").on(
      table.expiresAt,
      table.credentialId
    ),
  ]
)

export const adminMcpAccessTokenEvents = sqliteTable(
  "admin_mcp_access_token_events",
  {
    action: text("action", { enum: ["issued", "revoked"] }).notNull(),
    actorAdminId: text("actor_admin_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    credentialId: text("credential_id")
      .notNull()
      .references(() => adminMcpAccessTokens.credentialId, {
        onDelete: "restrict",
      }),
    id: text("id").primaryKey().notNull(),
  },
  (table) => [
    check(
      "admin_mcp_access_token_events_action_check",
      sql`${table.action} IN ('issued', 'revoked')`
    ),
    check(
      "admin_mcp_access_token_events_id_check",
      sql`length(${table.id}) = 36 AND substr(${table.id}, 1, 4) = 'evt_' AND substr(${table.id}, 5) NOT GLOB '*[^a-f0-9]*'`
    ),
    index("admin_mcp_access_token_events_credential_idx").on(
      table.credentialId,
      table.createdAt,
      table.id
    ),
  ]
)
