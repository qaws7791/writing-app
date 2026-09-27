CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`id_token` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `admin_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`id_token` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `admin_auth_rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_learner_read_models` (
  `user_id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  `status` text NOT NULL,
  `created_at` integer NOT NULL,
  `completed_lessons` integer DEFAULT 0 NOT NULL,
  `last_active` text,
  `streak_days_at_last_activity` integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `admin_learner_read_models_status_check` CHECK (`status` IN ('active','suspended','deleted')),
  CONSTRAINT `admin_learner_read_models_completed_lessons_check` CHECK (`completed_lessons` >= 0),
  CONSTRAINT `admin_learner_read_models_streak_days_check` CHECK (`streak_days_at_last_activity` >= 0)
);
--> statement-breakpoint
CREATE TABLE `admin_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `admin_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`category` text NOT NULL,
	`client_ip` text,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`outcome` text NOT NULL,
	`request_id` text NOT NULL,
	`retention_until` integer NOT NULL,
	`target_id` text NOT NULL,
	`target_type` text NOT NULL,
	CONSTRAINT `audit_events_category_check` CHECK(`category` IN ('privacy-access', 'identity-mutation', 'content-mutation')),
	CONSTRAINT `audit_events_action_check` CHECK(`action` IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore', 'writing-task.create', 'writing-task.draft.save', 'writing-task.publish')),
	CONSTRAINT `audit_events_outcome_check` CHECK(`outcome` IN ('started', 'succeeded', 'failed')),
	CONSTRAINT `audit_events_target_type_check` CHECK(`target_type` IN ('learner', 'course', 'writing-task')),
	CONSTRAINT `audit_events_target_action_check` CHECK((`target_type` = 'learner' AND `action` IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (`target_type` = 'course' AND `action` IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore')) OR (`target_type` = 'writing-task' AND `action` IN ('writing-task.create', 'writing-task.draft.save', 'writing-task.publish'))),
	CONSTRAINT `audit_events_category_action_check` CHECK((`category` = 'privacy-access' AND `action` = 'learner.detail.read') OR (`category` = 'identity-mutation' AND `action` IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (`category` = 'content-mutation' AND `action` IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore', 'writing-task.create', 'writing-task.draft.save', 'writing-task.publish'))),
	CONSTRAINT `audit_events_identifier_check` CHECK(length(`id`) BETWEEN 1 AND 200 AND `id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`actor_id`) BETWEEN 1 AND 200 AND `actor_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`target_id`) BETWEEN 1 AND 200 AND `target_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`request_id`) BETWEEN 1 AND 200 AND `request_id` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `audit_events_retention_check` CHECK((`category` IN ('privacy-access', 'content-mutation') AND `retention_until` = `created_at` + 31536000000) OR (`category` = 'identity-mutation' AND `retention_until` = `created_at` + 94608000000)),
	CONSTRAINT `audit_events_client_ip_check` CHECK(`client_ip` IS NULL OR (length(`client_ip`) BETWEEN 2 AND 45 AND `client_ip` NOT GLOB '*[^0-9A-Fa-f:.]*'))
);
--> statement-breakpoint
CREATE TABLE `auth_rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_assets` (
	`alt_text` text NOT NULL,
	`byte_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`orphaned_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`,`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`course_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "content_assets_kind_check" CHECK("content_assets"."kind" IN ('course-cover', 'reading-illustration')),
	CONSTRAINT "content_assets_content_type_check" CHECK("content_assets"."content_type" IN ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT "content_assets_byte_size_check" CHECK("content_assets"."byte_size" > 0 AND "content_assets"."byte_size" <= 5242880),
	CONSTRAINT "content_assets_alt_text_check" CHECK(length(trim("content_assets"."alt_text")) > 0 AND length("content_assets"."alt_text") <= 500),
	CONSTRAINT "content_assets_status_check" CHECK("content_assets"."status" IN ('active', 'orphaned')),
	CONSTRAINT "content_assets_orphaned_at_check" CHECK(("content_assets"."status" = 'active' AND "content_assets"."orphaned_at" IS NULL) OR ("content_assets"."status" = 'orphaned' AND "content_assets"."orphaned_at" IS NOT NULL)),
	CONSTRAINT "content_assets_updated_at_check" CHECK("content_assets"."updated_at" >= "content_assets"."created_at")
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `course_curriculum_version_title_fts`
USING fts5(`title`, content='course_curriculum_version_title_search_documents', content_rowid='rowid', tokenize='trigram');
--> statement-breakpoint
CREATE TABLE `course_curriculum_version_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `curriculum_version_id` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  FOREIGN KEY (`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_curriculum_versions` (
	`category` text NOT NULL,
	`course_id` text NOT NULL,
	`cover_asset_id` text,
	`created_at` integer NOT NULL,
	`description` text NOT NULL,
	`edit_version` integer DEFAULT 0 NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`published_at` integer,
	`revision` integer NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`updated_at` integer NOT NULL,
	`visual_key` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cover_asset_id`) REFERENCES `content_assets`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "course_curriculum_versions_status_check" CHECK("course_curriculum_versions"."status" IN ('draft', 'published')),
	CONSTRAINT "course_curriculum_versions_revision_check" CHECK("course_curriculum_versions"."revision" > 0),
	CONSTRAINT "course_curriculum_versions_edit_version_check" CHECK("course_curriculum_versions"."edit_version" >= 0),
	CONSTRAINT "course_curriculum_versions_published_at_check" CHECK(("course_curriculum_versions"."status" = 'published' AND "course_curriculum_versions"."published_at" IS NOT NULL) OR ("course_curriculum_versions"."status" = 'draft' AND "course_curriculum_versions"."published_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE `course_unit_versions` (
	`curriculum_version_id` text NOT NULL,
	`id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`title` text NOT NULL,
	PRIMARY KEY(`curriculum_version_id`, `id`),
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "course_unit_versions_status_check" CHECK("course_unit_versions"."status" IN ('active', 'archived')),
	CONSTRAINT "course_unit_versions_sort_order_check" CHECK("course_unit_versions"."sort_order" > 0)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`published_curriculum_version_id` text,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`published_curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "courses_status_check" CHECK("courses"."status" IN ('active', 'archived')),
	CONSTRAINT "courses_sort_order_check" CHECK("courses"."sort_order" > 0)
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `identity_admin_learner_fts`
USING fts5(`email`, `display_name`, content='identity_admin_learner_search_documents', content_rowid='rowid', tokenize='trigram');
--> statement-breakpoint
CREATE TABLE `identity_admin_learner_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL UNIQUE,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learner_activity_days` (
	`activity_date` text NOT NULL,
	`completed_lessons` integer DEFAULT 0 NOT NULL,
	`first_activity_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`saved_answers` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `activity_date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learner_activity_days_completed_lessons_check" CHECK("learner_activity_days"."completed_lessons" >= 0),
	CONSTRAINT "learner_activity_days_saved_answers_check" CHECK("learner_activity_days"."saved_answers" >= 0)
);
--> statement-breakpoint
CREATE TABLE `learner_course_progress` (
	`completed_at` integer,
	`course_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`last_activity_at` integer NOT NULL,
	`started_at` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `course_id`),
	FOREIGN KEY (`course_id`,`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`course_id`,`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learner_course_progress_status_check" CHECK("learner_course_progress"."status" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
CREATE TABLE `learner_lesson_answers` (
	`answer_json` text NOT NULL,
	`answered_at` integer NOT NULL,
	`course_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`step_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `step_id`),
	FOREIGN KEY (`user_id`,`course_id`,`curriculum_version_id`) REFERENCES `learner_course_progress`(`user_id`,`course_id`,`curriculum_version_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`,`step_id`) REFERENCES `lesson_step_versions`(`curriculum_version_id`,`lesson_id`,`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `learner_lesson_progress` (
	`completed_at` integer,
	`course_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`current_step_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL, `completed_step_ids_json` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `lesson_id`),
	FOREIGN KEY (`user_id`,`course_id`,`curriculum_version_id`) REFERENCES `learner_course_progress`(`user_id`,`course_id`,`curriculum_version_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`) REFERENCES `lesson_versions`(`curriculum_version_id`,`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`,`current_step_id`) REFERENCES `lesson_step_versions`(`curriculum_version_id`,`lesson_id`,`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learner_lesson_progress_status_check" CHECK("learner_lesson_progress"."status" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`deleted_at` integer,
	`display_name` text,
	`status` text DEFAULT 'active' NOT NULL,
	`user_id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learner_profiles_status_check" CHECK("learner_profiles"."status" IN ('active', 'suspended', 'deleted')),
	CONSTRAINT "learner_profiles_version_check" CHECK("learner_profiles"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE `learner_reporting_summaries` (
  `completed_lessons` integer DEFAULT 0 NOT NULL,
  `last_active` text,
  `streak_days_at_last_activity` integer DEFAULT 0 NOT NULL,
  `user_id` text PRIMARY KEY NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `learner_reporting_summaries_completed_lessons_check` CHECK (`completed_lessons` >= 0),
  CONSTRAINT `learner_reporting_summaries_streak_days_check` CHECK (`streak_days_at_last_activity` >= 0)
);
--> statement-breakpoint
CREATE TABLE `learner_step_drafts` (
	`answer_json` text NOT NULL,
	`course_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`step_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `course_id`, `curriculum_version_id`, `lesson_id`, `step_id`),
	FOREIGN KEY (`user_id`,`course_id`,`curriculum_version_id`) REFERENCES `learner_course_progress`(`user_id`,`course_id`,`curriculum_version_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`,`step_id`) REFERENCES `lesson_step_versions`(`curriculum_version_id`,`lesson_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learner_step_drafts_answer_json_size_check" CHECK(length(CAST("learner_step_drafts"."answer_json" AS BLOB)) <= 65536),
	CONSTRAINT "learner_step_drafts_version_check" CHECK("learner_step_drafts"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE `lesson_step_versions` (
	`content_json` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`curriculum_version_id`, `id`),
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`) REFERENCES `lesson_versions`(`curriculum_version_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_step_versions_status_check" CHECK("lesson_step_versions"."status" IN ('active', 'archived')),
	CONSTRAINT "lesson_step_versions_sort_order_check" CHECK("lesson_step_versions"."sort_order" > 0)
);
--> statement-breakpoint
CREATE TABLE `lesson_versions` (
	`category` text,
	`curriculum_version_id` text NOT NULL,
	`description` text,
	`estimated_minutes` integer NOT NULL,
	`id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`summary_json` text NOT NULL,
	`title` text NOT NULL,
	`unit_id` text NOT NULL,
	PRIMARY KEY(`curriculum_version_id`, `id`),
	FOREIGN KEY (`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`unit_id`) REFERENCES `course_unit_versions`(`curriculum_version_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_versions_status_check" CHECK("lesson_versions"."status" IN ('active', 'archived')),
	CONSTRAINT "lesson_versions_sort_order_check" CHECK("lesson_versions"."sort_order" > 0),
	CONSTRAINT "lesson_versions_estimated_minutes_check" CHECK("lesson_versions"."estimated_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE `operations_reporting_checkpoint` (
  `id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
  `source_changed_at` integer NOT NULL,
  `reconciled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations_reporting_daily_metrics` (
  `date_key` text PRIMARY KEY NOT NULL,
  `signups` integer DEFAULT 0 NOT NULL CHECK (`signups` >= 0),
  `first_starts` integer DEFAULT 0 NOT NULL CHECK (`first_starts` >= 0),
  `completions` integer DEFAULT 0 NOT NULL CHECK (`completions` >= 0),
  `returned_learners` integer DEFAULT 0 NOT NULL CHECK (`returned_learners` >= 0),
  `created_writings` integer DEFAULT 0 NOT NULL CHECK (`created_writings` >= 0),
  `check_succeeded_writings` integer DEFAULT 0 NOT NULL CHECK (`check_succeeded_writings` >= 0),
  `revised_after_check_writings` integer DEFAULT 0 NOT NULL CHECK (`revised_after_check_writings` >= 0)
);
--> statement-breakpoint
CREATE TABLE `operations_reporting_learner_activations` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `signup_date` text NOT NULL,
  `first_start_date` text,
  `returned_within_7_days` integer DEFAULT 0 NOT NULL CHECK (`returned_within_7_days` IN (0, 1))
);
--> statement-breakpoint
CREATE TABLE `operations_reporting_lesson_metrics` (
  `course_id` text NOT NULL,
  `curriculum_version_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `started` integer DEFAULT 0 NOT NULL CHECK (`started` >= 0),
  `completed` integer DEFAULT 0 NOT NULL CHECK (`completed` >= 0),
  PRIMARY KEY (`course_id`,`curriculum_version_id`,`lesson_id`)
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `operations_reporting_lesson_title_fts`
USING fts5(`title`, content='operations_reporting_lesson_title_search_documents', content_rowid='rowid', tokenize='trigram');
--> statement-breakpoint
CREATE TABLE `operations_reporting_lesson_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `curriculum_version_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `title` text NOT NULL,
  UNIQUE (`curriculum_version_id`,`lesson_id`),
  FOREIGN KEY (`curriculum_version_id`,`lesson_id`) REFERENCES `lesson_versions`(`curriculum_version_id`,`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `writing_ai_notices` (
	`user_id` text PRIMARY KEY NOT NULL,
	`acknowledged_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE "writing_checks" (
	`id` text PRIMARY KEY NOT NULL,
	`writing_id` text NOT NULL,
	`body_version` integer NOT NULL,
	`result_json` text NOT NULL,
	`succeeded_at` integer NOT NULL,
	FOREIGN KEY (`writing_id`) REFERENCES "writings"(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "writing_checks_body_version_check" CHECK("writing_checks"."body_version" >= 0),
	CONSTRAINT "writing_checks_result_check" CHECK(json_valid("writing_checks"."result_json") AND json_type("writing_checks"."result_json") = 'object')
);
--> statement-breakpoint
CREATE TABLE "writing_events" (
	`user_id` text NOT NULL,
	`writing_id` text NOT NULL,
	`event_type` text NOT NULL,
	`recorded_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `writing_id`, `event_type`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writing_events_type_check" CHECK("writing_events"."event_type" IN ('writing_created', 'check_succeeded', 'revised_after_check', 'writing_deleted'))
);
--> statement-breakpoint
CREATE TABLE `writing_task_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`title` text NOT NULL,
	`domain` text NOT NULL,
	`type_name` text NOT NULL,
	`difficulty` text NOT NULL,
	`situation` text NOT NULL,
	`audience` text NOT NULL,
	`min_chars` integer NOT NULL,
	`goal_chars` integer NOT NULL,
	`required_elements_json` text NOT NULL,
	`published_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `writing_tasks`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writing_task_publications_domain_check" CHECK("writing_task_publications"."domain" IN ('일상·실용문', '학업·논술문', '업무·비즈니스 문서', '창작·문학', '설득·의견문', '정보전달·설명문', '자기서사·기록', '관계·소통 문서', '공적·행정 문서', '디지털·뉴미디어')),
	CONSTRAINT "writing_task_publications_difficulty_check" CHECK("writing_task_publications"."difficulty" IN ('입문', '기본', '심화')),
	CONSTRAINT "writing_task_publications_chars_check" CHECK("writing_task_publications"."min_chars" > 0 AND "writing_task_publications"."goal_chars" >= "writing_task_publications"."min_chars"),
	CONSTRAINT "writing_task_publications_text_check" CHECK(length(trim("writing_task_publications"."title")) > 0 AND length(trim("writing_task_publications"."type_name")) > 0 AND length(trim("writing_task_publications"."situation")) > 0 AND length(trim("writing_task_publications"."audience")) > 0),
	CONSTRAINT "writing_task_publications_required_elements_check" CHECK(json_valid("writing_task_publications"."required_elements_json") AND json_type("writing_task_publications"."required_elements_json") = 'array' AND json_array_length("writing_task_publications"."required_elements_json") >= 1)
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `writing_task_title_fts`
USING fts5(`title`, content='writing_task_title_search_documents', content_rowid='rowid', tokenize='trigram');
--> statement-breakpoint
CREATE TABLE `writing_task_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `task_id` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `writing_tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `writing_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`domain` text DEFAULT '일상·실용문' NOT NULL,
	`type_name` text DEFAULT '' NOT NULL,
	`difficulty` text DEFAULT '입문' NOT NULL,
	`situation` text DEFAULT '' NOT NULL,
	`audience` text DEFAULT '' NOT NULL,
	`min_chars` integer DEFAULT 0 NOT NULL,
	`goal_chars` integer DEFAULT 0 NOT NULL,
	`required_elements_json` text DEFAULT '[]' NOT NULL,
	`edit_version` integer DEFAULT 0 NOT NULL,
	`latest_publication_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "writing_tasks_domain_check" CHECK("writing_tasks"."domain" IN ('일상·실용문', '학업·논술문', '업무·비즈니스 문서', '창작·문학', '설득·의견문', '정보전달·설명문', '자기서사·기록', '관계·소통 문서', '공적·행정 문서', '디지털·뉴미디어')),
	CONSTRAINT "writing_tasks_difficulty_check" CHECK("writing_tasks"."difficulty" IN ('입문', '기본', '심화')),
	CONSTRAINT "writing_tasks_edit_version_check" CHECK("writing_tasks"."edit_version" >= 0),
	CONSTRAINT "writing_tasks_chars_check" CHECK("writing_tasks"."min_chars" >= 0 AND "writing_tasks"."goal_chars" >= 0),
	CONSTRAINT "writing_tasks_required_elements_check" CHECK(json_valid("writing_tasks"."required_elements_json") AND json_type("writing_tasks"."required_elements_json") = 'array')
);
--> statement-breakpoint
CREATE TABLE "writings" (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`body` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`publication_id`) REFERENCES `writing_task_publications`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writings_version_check" CHECK("writings"."version" >= 0)
);
--> statement-breakpoint
CREATE INDEX `account_provider_idx` ON `account` (`account_id`,`provider_id`);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);
--> statement-breakpoint
CREATE INDEX `admin_account_provider_idx` ON `admin_account` (`account_id`,`provider_id`);
--> statement-breakpoint
CREATE INDEX `admin_account_user_idx` ON `admin_account` (`user_id`);
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_joined_idx`
ON `admin_learner_read_models` (`created_at` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_last_active_idx`
ON `admin_learner_read_models` (`last_active` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_lessons_idx`
ON `admin_learner_read_models` (`completed_lessons` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_status_joined_idx`
ON `admin_learner_read_models` (`status`,`created_at` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_status_last_active_idx`
ON `admin_learner_read_models` (`status`,`last_active` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_status_lessons_idx`
ON `admin_learner_read_models` (`status`,`completed_lessons` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_status_streak_idx`
ON `admin_learner_read_models` (`status`,`streak_days_at_last_activity` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `admin_learner_read_models_streak_idx`
ON `admin_learner_read_models` (`streak_days_at_last_activity` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
--> statement-breakpoint
CREATE INDEX `admin_session_expiry_idx` ON `admin_session` (`expires_at`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_session_token_unique` ON `admin_session` (`token`);
--> statement-breakpoint
CREATE INDEX `admin_session_user_idx` ON `admin_session` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_user_email_unique` ON `admin_user` (`email`);
--> statement-breakpoint
CREATE INDEX `admin_verification_expiry_idx` ON `admin_verification` (`expires_at`);
--> statement-breakpoint
CREATE INDEX `admin_verification_identifier_created_idx` ON `admin_verification` (`identifier`,`created_at`);
--> statement-breakpoint
CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`, `id`);
--> statement-breakpoint
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`, `id`);
--> statement-breakpoint
CREATE INDEX `content_assets_course_version_status_idx` ON `content_assets` (`course_id`,`curriculum_version_id`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_assets_object_key_idx` ON `content_assets` (`object_key`);
--> statement-breakpoint
CREATE INDEX `content_assets_orphan_purge_idx` ON `content_assets` (`orphaned_at`,`id`)
WHERE `status` = 'orphaned' AND `orphaned_at` IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `course_curriculum_versions_course_id_idx` ON `course_curriculum_versions` (`course_id`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_curriculum_versions_course_revision_idx` ON `course_curriculum_versions` (`course_id`,`revision`);
--> statement-breakpoint
CREATE INDEX `course_curriculum_versions_course_status_idx` ON `course_curriculum_versions` (`course_id`,`status`);
--> statement-breakpoint
CREATE INDEX `course_curriculum_versions_draft_category_idx` ON `course_curriculum_versions` (`category`,`course_id`)
WHERE `status` = 'draft';
--> statement-breakpoint
CREATE INDEX `course_curriculum_versions_published_category_idx` ON `course_curriculum_versions` (`category`,`id`)
WHERE `status` = 'published';
--> statement-breakpoint
CREATE UNIQUE INDEX `course_curriculum_versions_single_draft_idx` ON `course_curriculum_versions` (`course_id`) WHERE "course_curriculum_versions"."status" = 'draft';
--> statement-breakpoint
CREATE INDEX `course_unit_versions_active_curriculum_idx` ON `course_unit_versions` (`curriculum_version_id`)
WHERE `status` = 'active';
--> statement-breakpoint
CREATE UNIQUE INDEX `course_unit_versions_sort_order_idx` ON `course_unit_versions` (`curriculum_version_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `courses_sort_order_idx` ON `courses` (`sort_order`,`id`);
--> statement-breakpoint
CREATE INDEX `courses_status_sort_order_idx` ON `courses` (`status`,`sort_order`,`id`);
--> statement-breakpoint
CREATE INDEX `learner_course_progress_activity_idx` ON `learner_course_progress` (`user_id`,`last_activity_at` DESC,`course_id` ASC);
--> statement-breakpoint
CREATE INDEX `learner_course_progress_status_activity_idx` ON `learner_course_progress` (`user_id`,`status`,`last_activity_at` DESC,`course_id` ASC);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_course_progress_version_scope_idx` ON `learner_course_progress` (`user_id`,`course_id`,`curriculum_version_id`);
--> statement-breakpoint
CREATE INDEX `learner_lesson_answers_lesson_idx` ON `learner_lesson_answers` (`user_id`,`curriculum_version_id`,`lesson_id`);
--> statement-breakpoint
CREATE INDEX `learner_lesson_progress_user_course_idx` ON `learner_lesson_progress` (`user_id`,`course_id`);
--> statement-breakpoint
CREATE INDEX `learner_lesson_progress_user_lesson_idx` ON `learner_lesson_progress` (`user_id`,`lesson_id`);
--> statement-breakpoint
CREATE INDEX `learner_profiles_deleted_purge_idx` ON `learner_profiles` (`deleted_at`,`user_id`)
WHERE `status` = 'deleted' AND `deleted_at` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `learner_reporting_summaries_completed_lessons_idx` ON `learner_reporting_summaries` (`completed_lessons` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `learner_reporting_summaries_last_active_idx` ON `learner_reporting_summaries` (`last_active` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `learner_reporting_summaries_streak_idx` ON `learner_reporting_summaries` (`streak_days_at_last_activity` DESC,`user_id` ASC);
--> statement-breakpoint
CREATE INDEX `learner_step_drafts_lesson_idx` ON `learner_step_drafts` (`user_id`,`curriculum_version_id`,`lesson_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_step_versions_lesson_id_idx` ON `lesson_step_versions` (`curriculum_version_id`,`lesson_id`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_step_versions_lesson_sort_order_idx` ON `lesson_step_versions` (`curriculum_version_id`,`lesson_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `lesson_versions_active_curriculum_idx` ON `lesson_versions` (`curriculum_version_id`)
WHERE `status` = 'active';
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_versions_unit_sort_order_idx` ON `lesson_versions` (`curriculum_version_id`,`unit_id`,`sort_order`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_versions_version_id_idx` ON `lesson_versions` (`curriculum_version_id`,`id`);
--> statement-breakpoint
CREATE INDEX `session_expiry_idx` ON `session` (`expires_at`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
--> statement-breakpoint
CREATE INDEX `verification_expiry_idx` ON `verification` (`expires_at`);
--> statement-breakpoint
CREATE INDEX `verification_identifier_created_idx` ON `verification` (`identifier`,`created_at`);
--> statement-breakpoint
CREATE INDEX `writing_checks_succeeded_idx` ON `writing_checks` (`succeeded_at`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `writing_checks_writing_idx` ON `writing_checks` (`writing_id`);
--> statement-breakpoint
CREATE INDEX `writing_events_type_recorded_idx` ON `writing_events` (`event_type`,`recorded_at`);
--> statement-breakpoint
CREATE INDEX `writing_task_publications_domain_published_idx` ON `writing_task_publications` (`domain`,`published_at`,`task_id`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_task_publications_domain_type_published_idx` ON `writing_task_publications` (`domain`,`type_name`,`published_at`,`task_id`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_task_publications_published_idx` ON `writing_task_publications` (`published_at`,`task_id`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_task_publications_task_idx` ON `writing_task_publications` (`task_id`,`published_at`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_task_publications_type_published_idx` ON `writing_task_publications` (`type_name`,`published_at`,`task_id`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_tasks_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_tasks_draft_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`)
WHERE `latest_publication_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `writing_tasks_draft_updated_idx` ON `writing_tasks` (`updated_at`,`id`)
WHERE `latest_publication_id` IS NULL;
--> statement-breakpoint
CREATE INDEX `writing_tasks_latest_publication_idx` ON `writing_tasks` (`latest_publication_id`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_tasks_published_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`)
WHERE `latest_publication_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `writing_tasks_published_updated_idx` ON `writing_tasks` (`updated_at`,`id`)
WHERE `latest_publication_id` IS NOT NULL;
--> statement-breakpoint
CREATE INDEX `writing_tasks_updated_idx` ON `writing_tasks` (`updated_at`,`id`);
--> statement-breakpoint
CREATE INDEX `writings_publication_idx` ON `writings` (`publication_id`);
--> statement-breakpoint
CREATE INDEX `writings_user_updated_idx` ON `writings` (`user_id`,`updated_at`,`id`);
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_profile_ad`
AFTER DELETE ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = (SELECT `name` FROM `user` WHERE `id` = OLD.`user_id`),
    `status` = 'active'
  WHERE `user_id` = OLD.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_profile_ai`
AFTER INSERT ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = coalesce(
      NEW.`display_name`,
      (SELECT `name` FROM `user` WHERE `id` = NEW.`user_id`)
    ),
    `status` = NEW.`status`
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_profile_au`
AFTER UPDATE OF `display_name`, `status` ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = coalesce(
      NEW.`display_name`,
      (SELECT `name` FROM `user` WHERE `id` = NEW.`user_id`)
    ),
    `status` = NEW.`status`
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_summary_ai`
AFTER INSERT ON `learner_reporting_summaries`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `completed_lessons` = NEW.`completed_lessons`,
    `last_active` = NEW.`last_active`,
    `streak_days_at_last_activity` = NEW.`streak_days_at_last_activity`
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_summary_au`
AFTER UPDATE OF `completed_lessons`, `last_active`, `streak_days_at_last_activity`
ON `learner_reporting_summaries`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `completed_lessons` = NEW.`completed_lessons`,
    `last_active` = NEW.`last_active`,
    `streak_days_at_last_activity` = NEW.`streak_days_at_last_activity`
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_user_ai`
AFTER INSERT ON `user`
BEGIN
  INSERT INTO `admin_learner_read_models` (
    `user_id`,`email`,`display_name`,`status`,`created_at`
  ) VALUES (NEW.`id`,NEW.`email`,NEW.`name`,'active',NEW.`created_at`);
END;
--> statement-breakpoint
CREATE TRIGGER `admin_learner_read_models_user_au`
AFTER UPDATE OF `email`, `name` ON `user`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `email` = NEW.`email`,
    `display_name` = coalesce(
      (SELECT `display_name` FROM `learner_profiles` WHERE `user_id` = NEW.`id`),
      NEW.`name`
    )
  WHERE `user_id` = NEW.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER content_assets_published_delete_guard
BEFORE DELETE ON content_assets
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published content asset is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER content_assets_published_insert_guard
BEFORE INSERT ON content_assets
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published content asset is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER content_assets_published_update_guard
BEFORE UPDATE ON content_assets
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published content asset is immutable');
END;
--> statement-breakpoint
CREATE VIEW content_reporting_current_lessons AS
SELECT
  course.id AS course_id,
  curriculum.id AS curriculum_version_id,
  curriculum.title AS course_title,
  lesson.id AS lesson_id,
  lesson.title AS lesson_title
FROM courses AS course
INNER JOIN course_curriculum_versions AS curriculum
  ON curriculum.course_id = course.id
  AND curriculum.id = course.published_curriculum_version_id
  AND curriculum.status = 'published'
INNER JOIN course_unit_versions AS unit
  ON unit.curriculum_version_id = curriculum.id
  AND unit.status = 'active'
INNER JOIN lesson_versions AS lesson
  ON lesson.curriculum_version_id = curriculum.id
  AND lesson.unit_id = unit.id
  AND lesson.status = 'active'
WHERE course.status = 'active';
--> statement-breakpoint
CREATE TRIGGER `course_curriculum_version_title_search_ad`
AFTER DELETE ON `course_curriculum_versions`
BEGIN
  DELETE FROM `course_curriculum_version_title_search_documents`
  WHERE `curriculum_version_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `course_curriculum_version_title_search_ai`
AFTER INSERT ON `course_curriculum_versions`
BEGIN
  INSERT INTO `course_curriculum_version_title_search_documents` (`curriculum_version_id`,`title`)
  VALUES (NEW.`id`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `course_curriculum_version_title_search_au`
AFTER UPDATE OF `title` ON `course_curriculum_versions`
BEGIN
  UPDATE `course_curriculum_version_title_search_documents`
  SET `title` = NEW.`title`
  WHERE `curriculum_version_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER course_curriculum_versions_published_delete_guard
BEFORE DELETE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER course_curriculum_versions_published_update_guard
BEFORE UPDATE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `course_title_search_documents_ad`
AFTER DELETE ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`course_curriculum_version_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `course_title_search_documents_ai`
AFTER INSERT ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `course_title_search_documents_au`
AFTER UPDATE OF `title` ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`course_curriculum_version_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `course_curriculum_version_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER course_unit_versions_published_delete_guard
BEFORE DELETE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER course_unit_versions_published_insert_guard
BEFORE INSERT ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER course_unit_versions_published_update_guard
BEFORE UPDATE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER courses_published_version_insert_check
BEFORE INSERT ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;
--> statement-breakpoint
CREATE TRIGGER courses_published_version_update_check
BEFORE UPDATE OF published_curriculum_version_id ON courses
WHEN NEW.published_curriculum_version_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM course_curriculum_versions version
    WHERE version.id = NEW.published_curriculum_version_id
      AND version.course_id = NEW.id
      AND version.status = 'published'
  ) THEN RAISE(ABORT, 'published curriculum version must belong to the course and be published') END;
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_read_model_search_ad`
AFTER DELETE ON `admin_learner_read_models`
BEGIN
  DELETE FROM `identity_admin_learner_search_documents`
  WHERE `user_id` = OLD.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_read_model_search_ai`
AFTER INSERT ON `admin_learner_read_models`
BEGIN
  INSERT INTO `identity_admin_learner_search_documents` (`user_id`,`email`,`display_name`)
  VALUES (NEW.`user_id`,NEW.`email`,NEW.`display_name`);
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_read_model_search_au`
AFTER UPDATE OF `email`, `display_name` ON `admin_learner_read_models`
BEGIN
  UPDATE `identity_admin_learner_search_documents`
  SET `email` = NEW.`email`, `display_name` = NEW.`display_name`
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_search_documents_ad`
AFTER DELETE ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`identity_admin_learner_fts`,`rowid`,`email`,`display_name`)
  VALUES ('delete',OLD.`rowid`,OLD.`email`,OLD.`display_name`);
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_search_documents_ai`
AFTER INSERT ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`rowid`,`email`,`display_name`)
  VALUES (NEW.`rowid`,NEW.`email`,NEW.`display_name`);
END;
--> statement-breakpoint
CREATE TRIGGER `identity_admin_learner_search_documents_au`
AFTER UPDATE OF `email`, `display_name` ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`identity_admin_learner_fts`,`rowid`,`email`,`display_name`)
  VALUES ('delete',OLD.`rowid`,OLD.`email`,OLD.`display_name`);
  INSERT INTO `identity_admin_learner_fts` (`rowid`,`email`,`display_name`)
  VALUES (NEW.`rowid`,NEW.`email`,NEW.`display_name`);
END;
--> statement-breakpoint
CREATE VIEW `identity_reporting_admin_learners` AS
SELECT
  `user`.`id` AS `user_id`,
  `user`.`email` AS `email`,
  coalesce(`learner_profiles`.`display_name`, `user`.`name`) AS `display_name`,
  coalesce(`learner_profiles`.`status`, 'active') AS `status`,
  `user`.`created_at` AS `created_at`
FROM `user`
LEFT JOIN `learner_profiles`
  ON `learner_profiles`.`user_id` = `user`.`id`;
--> statement-breakpoint
CREATE VIEW identity_reporting_learners AS
SELECT
  user.id AS user_id,
  user.created_at AS created_at
FROM user
INNER JOIN learner_profiles
  ON learner_profiles.user_id = user.id
WHERE learner_profiles.status <> 'deleted';
--> statement-breakpoint
CREATE TRIGGER `learner_reporting_summaries_user_insert`
AFTER INSERT ON `user`
BEGIN
  INSERT INTO `learner_reporting_summaries` (`user_id`)
  VALUES (NEW.`id`)
  ON CONFLICT (`user_id`) DO NOTHING;
END;
--> statement-breakpoint
CREATE VIEW learning_reporting_activity_days AS
SELECT
  user_id,
  activity_date
FROM learner_activity_days;
--> statement-breakpoint
CREATE VIEW `learning_reporting_learner_summaries` AS
SELECT
  `user_id`,
  `completed_lessons`,
  `last_active`,
  `streak_days_at_last_activity`
FROM `learner_reporting_summaries`;
--> statement-breakpoint
CREATE VIEW learning_reporting_lesson_progress AS
SELECT
  user_id,
  course_id,
  curriculum_version_id,
  lesson_id,
  status,
  started_at,
  completed_at
FROM learner_lesson_progress;
--> statement-breakpoint
CREATE TRIGGER lesson_step_versions_published_delete_guard
BEFORE DELETE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER lesson_step_versions_published_insert_guard
BEFORE INSERT ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER lesson_step_versions_published_update_guard
BEFORE UPDATE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `lesson_version_title_search_ad` AFTER DELETE ON `lesson_versions`
BEGIN
  DELETE FROM `operations_reporting_lesson_title_search_documents` WHERE `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `lesson_version_title_search_ai` AFTER INSERT ON `lesson_versions`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_search_documents` (`curriculum_version_id`,`lesson_id`,`title`) VALUES (NEW.`curriculum_version_id`,NEW.`id`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `lesson_version_title_search_au` AFTER UPDATE OF `title` ON `lesson_versions`
BEGIN
  UPDATE `operations_reporting_lesson_title_search_documents` SET `title` = NEW.`title` WHERE `curriculum_version_id` = NEW.`curriculum_version_id` AND `lesson_id` = NEW.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER lesson_versions_published_delete_guard
BEFORE DELETE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER lesson_versions_published_insert_guard
BEFORE INSERT ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER lesson_versions_published_update_guard
BEFORE UPDATE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id IN (OLD.curriculum_version_id, NEW.curriculum_version_id)
    AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activation_daily_ad` AFTER DELETE ON `operations_reporting_learner_activations`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `signups` = `signups` - 1 WHERE `date_key` = OLD.`signup_date`;
  UPDATE `operations_reporting_daily_metrics` SET `first_starts` = `first_starts` - 1, `returned_learners` = `returned_learners` - OLD.`returned_within_7_days` WHERE `date_key` = OLD.`first_start_date` AND OLD.`first_start_date` IS NOT NULL;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activation_daily_ai` AFTER INSERT ON `operations_reporting_learner_activations`
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`signups`) VALUES (NEW.`signup_date`,1)
  ON CONFLICT (`date_key`) DO UPDATE SET `signups` = `signups` + 1;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`first_starts`,`returned_learners`)
  SELECT NEW.`first_start_date`,1,NEW.`returned_within_7_days` WHERE NEW.`first_start_date` IS NOT NULL
  ON CONFLICT (`date_key`) DO UPDATE SET `first_starts` = `first_starts` + 1, `returned_learners` = `returned_learners` + NEW.`returned_within_7_days`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activation_daily_au` AFTER UPDATE ON `operations_reporting_learner_activations`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `signups` = `signups` - 1 WHERE `date_key` = OLD.`signup_date`;
  UPDATE `operations_reporting_daily_metrics` SET `first_starts` = `first_starts` - 1, `returned_learners` = `returned_learners` - OLD.`returned_within_7_days` WHERE `date_key` = OLD.`first_start_date` AND OLD.`first_start_date` IS NOT NULL;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`signups`) VALUES (NEW.`signup_date`,1)
  ON CONFLICT (`date_key`) DO UPDATE SET `signups` = `signups` + 1;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`first_starts`,`returned_learners`)
  SELECT NEW.`first_start_date`,1,NEW.`returned_within_7_days` WHERE NEW.`first_start_date` IS NOT NULL
  ON CONFLICT (`date_key`) DO UPDATE SET `first_starts` = `first_starts` + 1, `returned_learners` = `returned_learners` + NEW.`returned_within_7_days`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activity_activation_ad` AFTER DELETE ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = OLD.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = OLD.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activity_activation_ai` AFTER INSERT ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = NEW.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_activity_activation_au` AFTER UPDATE OF `activity_date`,`user_id` ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = OLD.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = OLD.`user_id`;
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = NEW.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_profile_activation_ad` AFTER DELETE ON `learner_profiles`
BEGIN
  DELETE FROM `operations_reporting_learner_activations` WHERE `user_id` = OLD.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_profile_activation_ai` AFTER INSERT ON `learner_profiles`
WHEN NEW.`status` <> 'deleted'
BEGIN
  INSERT INTO `operations_reporting_learner_activations` (`user_id`,`signup_date`,`first_start_date`,`returned_within_7_days`)
  SELECT
    `user`.`id`,
    date(`user`.`created_at` / 1000, 'unixepoch', '+09:00'),
    (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  FROM `user`
  WHERE `id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_profile_rollups_au` AFTER UPDATE OF `status` ON `learner_profiles`
WHEN (OLD.`status` = 'deleted') <> (NEW.`status` = 'deleted')
BEGIN
  DELETE FROM `operations_reporting_learner_activations` WHERE `user_id` = NEW.`user_id` AND NEW.`status` = 'deleted';
  INSERT INTO `operations_reporting_learner_activations` (`user_id`,`signup_date`,`first_start_date`,`returned_within_7_days`)
  SELECT `user`.`id`,date(`user`.`created_at` / 1000, 'unixepoch', '+09:00'),date(min(`progress`.`started_at`) / 1000, 'unixepoch', '+09:00'),CASE WHEN EXISTS (
    SELECT 1 FROM `learner_activity_days` AS `activity`
    WHERE `activity`.`user_id` = NEW.`user_id`
      AND `activity`.`activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
      AND `activity`.`activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
  ) THEN 1 ELSE 0 END
  FROM `user` LEFT JOIN `learner_lesson_progress` AS `progress` ON `progress`.`user_id` = `user`.`id`
  WHERE `user`.`id` = NEW.`user_id` AND NEW.`status` <> 'deleted' GROUP BY `user`.`id`
  ON CONFLICT (`user_id`) DO UPDATE SET `signup_date` = excluded.`signup_date`, `first_start_date` = excluded.`first_start_date`;
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `status` = 'completed' AND date(`completed_at` / 1000, 'unixepoch', '+09:00') = `date_key`);
  UPDATE `operations_reporting_daily_metrics` SET
    `created_writings` = `created_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'writing_created' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`),
    `check_succeeded_writings` = `check_succeeded_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'check_succeeded' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`),
    `revised_after_check_writings` = `revised_after_check_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'revised_after_check' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`);
  UPDATE `operations_reporting_lesson_metrics` SET
    `started` = `started` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `course_id` = `operations_reporting_lesson_metrics`.`course_id` AND `curriculum_version_id` = `operations_reporting_lesson_metrics`.`curriculum_version_id` AND `lesson_id` = `operations_reporting_lesson_metrics`.`lesson_id`),
    `completed` = `completed` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `status` = 'completed' AND `course_id` = `operations_reporting_lesson_metrics`.`course_id` AND `curriculum_version_id` = `operations_reporting_lesson_metrics`.`curriculum_version_id` AND `lesson_id` = `operations_reporting_lesson_metrics`.`lesson_id`);
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_activation_ad` AFTER DELETE ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = OLD.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = OLD.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_activation_ai` AFTER INSERT ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_activation_au` AFTER UPDATE OF `started_at`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = OLD.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = OLD.`user_id`;
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_daily_ad` AFTER DELETE ON `learner_lesson_progress`
WHEN OLD.`status` = 'completed' AND OLD.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` - 1 WHERE `date_key` = date(OLD.`completed_at` / 1000, 'unixepoch', '+09:00');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_daily_ai` AFTER INSERT ON `learner_lesson_progress`
WHEN NEW.`status` = 'completed' AND NEW.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`completions`) VALUES (date(NEW.`completed_at` / 1000, 'unixepoch', '+09:00'),1)
  ON CONFLICT (`date_key`) DO UPDATE SET `completions` = `completions` + 1;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_daily_au` AFTER UPDATE OF `status`,`completed_at`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` - 1 WHERE OLD.`status` = 'completed' AND OLD.`completed_at` IS NOT NULL AND `date_key` = date(OLD.`completed_at` / 1000, 'unixepoch', '+09:00') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`completions`)
  SELECT date(NEW.`completed_at` / 1000, 'unixepoch', '+09:00'),1 WHERE NEW.`status` = 'completed' AND NEW.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`date_key`) DO UPDATE SET `completions` = `completions` + 1;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_lesson_ad` AFTER DELETE ON `learner_lesson_progress`
WHEN EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_lesson_metrics` SET `started` = `started` - 1, `completed` = `completed` - (OLD.`status` = 'completed') WHERE `course_id` = OLD.`course_id` AND `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`lesson_id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_lesson_ai` AFTER INSERT ON `learner_lesson_progress`
WHEN EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_lesson_metrics` (`course_id`,`curriculum_version_id`,`lesson_id`,`started`,`completed`) VALUES (NEW.`course_id`,NEW.`curriculum_version_id`,NEW.`lesson_id`,1,NEW.`status` = 'completed')
  ON CONFLICT (`course_id`,`curriculum_version_id`,`lesson_id`) DO UPDATE SET `started` = `started` + 1, `completed` = `completed` + (NEW.`status` = 'completed');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_progress_lesson_au` AFTER UPDATE OF `course_id`,`curriculum_version_id`,`lesson_id`,`status`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_lesson_metrics` SET `started` = `started` - 1, `completed` = `completed` - (OLD.`status` = 'completed') WHERE `course_id` = OLD.`course_id` AND `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`lesson_id` AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_lesson_metrics` (`course_id`,`curriculum_version_id`,`lesson_id`,`started`,`completed`)
  SELECT NEW.`course_id`,NEW.`curriculum_version_id`,NEW.`lesson_id`,1,NEW.`status` = 'completed' WHERE EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`course_id`,`curriculum_version_id`,`lesson_id`) DO UPDATE SET `started` = `started` + 1, `completed` = `completed` + (NEW.`status` = 'completed');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_activity_ad` AFTER DELETE ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_activity_ai` AFTER INSERT ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_activity_au` AFTER UPDATE ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_profile_ad` AFTER DELETE ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_profile_ai` AFTER INSERT ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_profile_au` AFTER UPDATE OF `status` ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_progress_ad` AFTER DELETE ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_progress_ai` AFTER INSERT ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_progress_au` AFTER UPDATE ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_writing_ad` AFTER DELETE ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_writing_ai` AFTER INSERT ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_checkpoint_writing_au` AFTER UPDATE ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_lesson_title_search_documents_ad` AFTER DELETE ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`operations_reporting_lesson_title_fts`,`rowid`,`title`) VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_lesson_title_search_documents_ai` AFTER INSERT ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`rowid`,`title`) VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `operations_reporting_lesson_title_search_documents_au` AFTER UPDATE OF `title` ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`operations_reporting_lesson_title_fts`,`rowid`,`title`) VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `operations_reporting_lesson_title_fts` (`rowid`,`title`) VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `operations_user_activation_au` AFTER UPDATE OF `created_at` ON `user`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET `signup_date` = date(NEW.`created_at` / 1000, 'unixepoch', '+09:00')
  WHERE `user_id` = NEW.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `operations_writing_daily_ad` AFTER DELETE ON `writing_events`
WHEN OLD.`event_type` IN ('writing_created','check_succeeded','revised_after_check') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `created_writings` = `created_writings` - (OLD.`event_type` = 'writing_created'), `check_succeeded_writings` = `check_succeeded_writings` - (OLD.`event_type` = 'check_succeeded'), `revised_after_check_writings` = `revised_after_check_writings` - (OLD.`event_type` = 'revised_after_check') WHERE `date_key` = date(OLD.`recorded_at` / 1000, 'unixepoch', '+09:00');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_writing_daily_ai` AFTER INSERT ON `writing_events`
WHEN NEW.`event_type` IN ('writing_created','check_succeeded','revised_after_check') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`created_writings`,`check_succeeded_writings`,`revised_after_check_writings`)
  VALUES (date(NEW.`recorded_at` / 1000, 'unixepoch', '+09:00'), NEW.`event_type` = 'writing_created', NEW.`event_type` = 'check_succeeded', NEW.`event_type` = 'revised_after_check')
  ON CONFLICT (`date_key`) DO UPDATE SET `created_writings` = `created_writings` + (NEW.`event_type` = 'writing_created'), `check_succeeded_writings` = `check_succeeded_writings` + (NEW.`event_type` = 'check_succeeded'), `revised_after_check_writings` = `revised_after_check_writings` + (NEW.`event_type` = 'revised_after_check');
END;
--> statement-breakpoint
CREATE TRIGGER `operations_writing_daily_au` AFTER UPDATE OF `event_type`,`recorded_at`,`user_id` ON `writing_events`
BEGIN
  UPDATE `operations_reporting_daily_metrics`
  SET
    `created_writings` = `created_writings` - (OLD.`event_type` = 'writing_created'),
    `check_succeeded_writings` = `check_succeeded_writings` - (OLD.`event_type` = 'check_succeeded'),
    `revised_after_check_writings` = `revised_after_check_writings` - (OLD.`event_type` = 'revised_after_check')
  WHERE OLD.`event_type` IN ('writing_created','check_succeeded','revised_after_check')
    AND `date_key` = date(OLD.`recorded_at` / 1000, 'unixepoch', '+09:00')
    AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`created_writings`,`check_succeeded_writings`,`revised_after_check_writings`)
  SELECT
    date(NEW.`recorded_at` / 1000, 'unixepoch', '+09:00'),
    NEW.`event_type` = 'writing_created',
    NEW.`event_type` = 'check_succeeded',
    NEW.`event_type` = 'revised_after_check'
  WHERE NEW.`event_type` IN ('writing_created','check_succeeded','revised_after_check')
    AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`date_key`) DO UPDATE SET
    `created_writings` = `created_writings` + (NEW.`event_type` = 'writing_created'),
    `check_succeeded_writings` = `check_succeeded_writings` + (NEW.`event_type` = 'check_succeeded'),
    `revised_after_check_writings` = `revised_after_check_writings` + (NEW.`event_type` = 'revised_after_check');
END;
--> statement-breakpoint
CREATE VIEW `writing_reporting_events` AS
SELECT user_id, writing_id, event_type, recorded_at
FROM writing_events;
--> statement-breakpoint
CREATE TRIGGER `writing_task_title_search_ad`
AFTER DELETE ON `writing_tasks`
BEGIN
  DELETE FROM `writing_task_title_search_documents`
  WHERE `task_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `writing_task_title_search_ai`
AFTER INSERT ON `writing_tasks`
BEGIN
  INSERT INTO `writing_task_title_search_documents` (`task_id`,`title`)
  VALUES (NEW.`id`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `writing_task_title_search_au`
AFTER UPDATE OF `title` ON `writing_tasks`
BEGIN
  UPDATE `writing_task_title_search_documents`
  SET `title` = NEW.`title`
  WHERE `task_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `writing_title_search_documents_ad`
AFTER DELETE ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`writing_task_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `writing_title_search_documents_ai`
AFTER INSERT ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TRIGGER `writing_title_search_documents_au`
AFTER UPDATE OF `title` ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`writing_task_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `writing_task_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;
--> statement-breakpoint
CREATE TABLE batch_precondition (id INTEGER PRIMARY KEY, valid INTEGER NOT NULL CONSTRAINT batch_precondition_valid CHECK(valid = 1));
--> statement-breakpoint
INSERT INTO operations_reporting_checkpoint (id,source_changed_at,reconciled_at) VALUES (1, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000);
