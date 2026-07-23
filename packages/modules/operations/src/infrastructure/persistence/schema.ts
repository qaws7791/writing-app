import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { adminAuthUsers } from "@workspace/auth/schema"

const aiMessageRoles = ["assistant", "user"] as const

export const operationsAiConversations = sqliteTable(
  "admin_ai_chat_conversations",
  {
    adminId: text("admin_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("admin_ai_chat_conversations_admin_updated_idx").on(
      table.adminId,
      table.updatedAt
    ),
  ]
)

export const operationsAiMessages = sqliteTable(
  "admin_ai_chat_messages",
  {
    content: text("content").notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => operationsAiConversations.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    role: text("role", { enum: aiMessageRoles }).notNull(),
  },
  (table) => [
    index("admin_ai_chat_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
)

export const operationsAiQuotaCounters = sqliteTable(
  "operations_ai_quota_counters",
  {
    count: integer("count").notNull(),
    key: text("key").primaryKey().notNull(),
    resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("operations_ai_quota_reset_idx").on(table.resetAt)]
)
