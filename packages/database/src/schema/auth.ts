import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", {
    mode: "boolean",
  }).notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
})

export const session = sqliteTable(
  "session",
  {
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    ipAddress: text("ipAddress"),
    token: text("token").notNull().unique(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = sqliteTable(
  "account",
  {
    accessToken: text("accessToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    accountId: text("accountId").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    idToken: text("idToken"),
    password: text("password"),
    providerId: text("providerId").notNull(),
    refreshToken: text("refreshToken"),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = sqliteTable(
  "verification",
  {
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export const authSchema = {
  account,
  session,
  user,
  verification,
} as const
