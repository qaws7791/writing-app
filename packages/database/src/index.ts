export {
  migrateDatabase,
  openDb,
  readSqliteVersion,
  resetDatabaseFile,
  seedDatabase,
  type OpenedDb,
} from "./connection/index.js"
export {
  createDailyRecommendationRepository,
  createDraftRepository,
  createPromptRepository,
} from "./repository/index.js"
export {
  account,
  authSchema,
  dailyRecommendations,
  drafts,
  prompts,
  savedPrompts,
  schema,
  session,
  user,
  verification,
} from "./schema/index.js"
export type { DbClient, DbSchema } from "./types/index.js"
