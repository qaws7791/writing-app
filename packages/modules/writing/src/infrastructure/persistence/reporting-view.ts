import { integer, sqliteView, text } from "drizzle-orm/sqlite-core"

/** Operations가 원문 없이 읽는 쓰기 event projection입니다. */
export const writingReportingEvents = sqliteView("writing_reporting_events", {
  eventType: text("event_type").notNull(),
  recordedAt: integer("recorded_at").notNull(),
  userId: text("user_id").notNull(),
  writingId: text("writing_id").notNull(),
}).existing()
