import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import {
  account,
  aiRequests,
  dailyRecommendations,
  writings,
  prompts,
  savedPrompts,
  schema,
  session,
  user,
  verification,
  writingTransactions,
  writingVersions,
} from "../schema/index.js"

export type DbSchema = typeof schema
export type DbClient = BunSQLiteDatabase<DbSchema>

export type AccountRow = InferSelectModel<typeof account>
export type AIRequestInsert = InferInsertModel<typeof aiRequests>
export type AIRequestRow = InferSelectModel<typeof aiRequests>
export type DailyRecommendationInsert = InferInsertModel<
  typeof dailyRecommendations
>
export type DailyRecommendationRow = InferSelectModel<
  typeof dailyRecommendations
>
export type WritingInsert = InferInsertModel<typeof writings>
export type WritingRow = InferSelectModel<typeof writings>
export type PromptInsert = InferInsertModel<typeof prompts>
export type PromptRow = InferSelectModel<typeof prompts>
export type SavedPromptInsert = InferInsertModel<typeof savedPrompts>
export type SavedPromptRow = InferSelectModel<typeof savedPrompts>
export type SessionRow = InferSelectModel<typeof session>
export type UserRow = InferSelectModel<typeof user>
export type VerificationRow = InferSelectModel<typeof verification>
export type WritingTransactionInsert = InferInsertModel<
  typeof writingTransactions
>
export type WritingTransactionRow = InferSelectModel<typeof writingTransactions>
export type WritingVersionInsert = InferInsertModel<typeof writingVersions>
export type WritingVersionRow = InferSelectModel<typeof writingVersions>
