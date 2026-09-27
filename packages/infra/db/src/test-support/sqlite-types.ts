import type { createInMemoryWritingAppDatabase } from "#db/test-support/d1-database"

export type WritingAppSqlite = Awaited<
  ReturnType<typeof createInMemoryWritingAppDatabase>
>["sqlite"]
