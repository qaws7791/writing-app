import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import type {
  journeys,
  journeySessions,
  savedPrompts,
  steps,
  userJourneyProgress,
  userSessionProgress,
  writings,
  writingPrompts,
  writingVersions,
  schema,
  account,
  session,
  user,
  verification,
} from "../schema/index"

export type DbSchema = typeof schema
export type DbClient = PostgresJsDatabase<DbSchema>

export type AccountRow = InferSelectModel<typeof account>
export type JourneyInsert = InferInsertModel<typeof journeys>
export type JourneyRow = InferSelectModel<typeof journeys>
export type JourneySessionInsert = InferInsertModel<typeof journeySessions>
export type JourneySessionRow = InferSelectModel<typeof journeySessions>
export type SavedPromptInsert = InferInsertModel<typeof savedPrompts>
export type SavedPromptRow = InferSelectModel<typeof savedPrompts>
export type SessionRow = InferSelectModel<typeof session>
export type StepInsert = InferInsertModel<typeof steps>
export type StepRow = InferSelectModel<typeof steps>
export type UserJourneyProgressInsert = InferInsertModel<
  typeof userJourneyProgress
>
export type UserJourneyProgressRow = InferSelectModel<
  typeof userJourneyProgress
>
export type UserRow = InferSelectModel<typeof user>
export type UserSessionProgressInsert = InferInsertModel<
  typeof userSessionProgress
>
export type UserSessionProgressRow = InferSelectModel<
  typeof userSessionProgress
>
export type VerificationRow = InferSelectModel<typeof verification>
export type WritingInsert = InferInsertModel<typeof writings>
export type WritingRow = InferSelectModel<typeof writings>
export type WritingPromptInsert = InferInsertModel<typeof writingPrompts>
export type WritingPromptRow = InferSelectModel<typeof writingPrompts>
export type WritingVersionInsert = InferInsertModel<typeof writingVersions>
export type WritingVersionRow = InferSelectModel<typeof writingVersions>
