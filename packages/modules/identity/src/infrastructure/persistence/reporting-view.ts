import { integer, sqliteView, text } from "drizzle-orm/sqlite-core"

/** 삭제 상태가 아닌 학습자만 노출하는 리포팅 읽기 계약. */
export const identityReportingLearners = sqliteView(
  "identity_reporting_learners",
  {
    createdAt: integer("created_at").notNull(),
    userId: text("user_id").notNull(),
  }
).existing()
