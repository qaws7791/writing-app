import type { WritingAppDatabase } from "#db/client"
import type { DatabaseStatement } from "#db/batch"

export type LearnerDataPurgePort = Readonly<{
  moduleName: string
  statements: (
    database: WritingAppDatabase,
    userIds: readonly string[]
  ) => readonly DatabaseStatement[]
}>
