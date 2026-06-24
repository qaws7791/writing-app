import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { adminAuthUsers } from "@workspace/db/schema/admin-auth.schema"
import {
  persistedContentStatuses,
  persistedContentStatusValues,
} from "@workspace/db/persisted-values"

const contentStatuses = persistedContentStatuses
const contentStatusValues = persistedContentStatusValues

const adminAiChatMessageRoleValues = ["assistant", "user"] as const

export const adminSettings = sqliteTable("admin_settings", {
  key: text("key").primaryKey().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  value: text("value").notNull(),
})

export const adminResourceDocuments = sqliteTable("admin_resource_documents", {
  authorId: text("author_id")
    .notNull()
    .references(() => adminAuthUsers.id, { onDelete: "cascade" }),
  contentJson: text("content_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  excerpt: text("excerpt").notNull(),
  id: text("id").primaryKey().notNull(),
  status: text("status", { enum: contentStatusValues })
    .notNull()
    .default(contentStatuses.active),
  title: text("title").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
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
  }
)

export const adminAiChatMessages = sqliteTable("admin_ai_chat_messages", {
  content: text("content").notNull(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => adminAiChatConversations.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  id: text("id").primaryKey().notNull(),
  role: text("role", { enum: adminAiChatMessageRoleValues }).notNull(),
})
