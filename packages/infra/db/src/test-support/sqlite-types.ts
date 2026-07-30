import type { createInMemoryWritingAppDatabase } from "#db/client"

export type WritingAppSqlite = ReturnType<
  typeof createInMemoryWritingAppDatabase
>["sqlite"]
