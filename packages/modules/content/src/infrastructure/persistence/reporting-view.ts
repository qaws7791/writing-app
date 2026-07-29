import { sqliteView, text } from "drizzle-orm/sqlite-core"

/** 현재 활성 코스의 최신 published 레슨만 노출하는 리포팅 읽기 계약. */
export const contentReportingCurrentLessons = sqliteView(
  "content_reporting_current_lessons",
  {
    courseId: text("course_id").notNull(),
    courseTitle: text("course_title").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    lessonTitle: text("lesson_title").notNull(),
  }
).existing()
