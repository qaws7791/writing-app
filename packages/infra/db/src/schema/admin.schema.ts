import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { adminAuthUsers } from "@workspace/auth/schema"
const adminAiChatMessageRoleValues = ["assistant", "user"] as const

export const adminSettings = sqliteTable("admin_settings", {
  key: text("key").primaryKey().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  value: text("value").notNull(),
})

export const adminAiChatConversations = sqliteTable(
  "admin_ai_chat_conversations",
  {
    adminId: text("admin_id")
      .notNull()
      .references(() => adminAuthUsers.id, { onDelete: "cascade" }),
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

export const adminAiChatMessages = sqliteTable(
  "admin_ai_chat_messages",
  {
    content: text("content").notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => adminAiChatConversations.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    role: text("role", { enum: adminAiChatMessageRoleValues }).notNull(),
  },
  (table) => [
    index("admin_ai_chat_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
)
