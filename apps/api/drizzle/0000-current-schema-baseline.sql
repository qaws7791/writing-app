CREATE TABLE `ai_feedback_attempts` (
	`answer_text` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`input_token_count` integer,
	`latency_ms` integer,
	`lesson_id` text NOT NULL,
	`model` text NOT NULL,
	`output_token_count` integer,
	`prompt_policy_version` text NOT NULL,
	`quota_date` text NOT NULL,
	`result_json` text,
	`failure_code` text,
	`status` text NOT NULL,
	`step_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`course_id`,`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`course_id`,`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`,`step_id`) REFERENCES `lesson_step_versions`(`curriculum_version_id`,`lesson_id`,`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "ai_feedback_attempts_status_check" CHECK("ai_feedback_attempts"."status" IN ('pending', 'succeeded', 'failed', 'expired')),
	CONSTRAINT "ai_feedback_attempts_attempt_number_check" CHECK("ai_feedback_attempts"."attempt_number" > 0),
	CONSTRAINT "ai_feedback_attempts_usage_count_check" CHECK(("ai_feedback_attempts"."input_token_count" IS NULL AND "ai_feedback_attempts"."output_token_count" IS NULL) OR ("ai_feedback_attempts"."input_token_count" >= 0 AND "ai_feedback_attempts"."output_token_count" >= 0)),
	CONSTRAINT "ai_feedback_attempts_latency_check" CHECK("ai_feedback_attempts"."latency_ms" IS NULL OR "ai_feedback_attempts"."latency_ms" >= 0),
	CONSTRAINT "ai_feedback_attempts_failure_code_check" CHECK(("ai_feedback_attempts"."status" IN ('pending', 'succeeded') AND "ai_feedback_attempts"."failure_code" IS NULL) OR ("ai_feedback_attempts"."status" = 'failed' AND "ai_feedback_attempts"."failure_code" IN ('persistence-failed', 'provider-response-invalid', 'provider-timeout', 'provider-unavailable', 'request-aborted')) OR ("ai_feedback_attempts"."status" = 'expired' AND "ai_feedback_attempts"."failure_code" = 'pending-expired'))
);

CREATE UNIQUE INDEX `ai_feedback_attempts_idempotency_idx` ON `ai_feedback_attempts` (`user_id`,`curriculum_version_id`,`lesson_id`,`step_id`,`idempotency_key`);
CREATE UNIQUE INDEX `ai_feedback_attempts_active_slot_idx` ON `ai_feedback_attempts` (`user_id`,`curriculum_version_id`,`lesson_id`,`step_id`,`attempt_number`) WHERE "ai_feedback_attempts"."status" IN ('pending', 'succeeded');
CREATE UNIQUE INDEX `ai_feedback_attempts_pending_idx` ON `ai_feedback_attempts` (`user_id`,`curriculum_version_id`,`lesson_id`,`step_id`) WHERE "ai_feedback_attempts"."status" = 'pending';
CREATE INDEX `ai_feedback_attempts_expiry_idx` ON `ai_feedback_attempts` (`status`,`expires_at`);
CREATE INDEX `ai_feedback_attempts_daily_status_idx` ON `ai_feedback_attempts` (`quota_date`,`status`,`user_id`);
CREATE TABLE `ai_feedback_global_daily_counters` (
	`quota_date` text PRIMARY KEY NOT NULL,
	`request_count` integer NOT NULL,
	`success_count` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "ai_feedback_global_daily_counters_count_check" CHECK("ai_feedback_global_daily_counters"."request_count" >= 0 AND "ai_feedback_global_daily_counters"."success_count" >= 0 AND "ai_feedback_global_daily_counters"."success_count" <= "ai_feedback_global_daily_counters"."request_count")
);

CREATE TABLE `ai_feedback_user_daily_counters` (
	`quota_date` text NOT NULL,
	`request_count` integer NOT NULL,
	`success_count` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `quota_date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "ai_feedback_user_daily_counters_count_check" CHECK("ai_feedback_user_daily_counters"."request_count" >= 0 AND "ai_feedback_user_daily_counters"."success_count" >= 0 AND "ai_feedback_user_daily_counters"."success_count" <= "ai_feedback_user_daily_counters"."request_count")
);

CREATE INDEX `ai_feedback_user_daily_counters_date_idx` ON `ai_feedback_user_daily_counters` (`quota_date`);
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

CREATE TABLE `admin_auth_rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);

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

CREATE UNIQUE INDEX `admin_session_token_unique` ON `admin_session` (`token`);
CREATE TABLE `admin_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `admin_user_email_unique` ON `admin_user` (`email`);
CREATE TABLE `admin_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);

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

CREATE TABLE `auth_rate_limit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);

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

CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);

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

CREATE UNIQUE INDEX `content_assets_object_key_idx` ON `content_assets` (`object_key`);
CREATE INDEX `content_assets_course_version_status_idx` ON `content_assets` (`course_id`,`curriculum_version_id`,`status`);
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

CREATE UNIQUE INDEX `course_curriculum_versions_course_revision_idx` ON `course_curriculum_versions` (`course_id`,`revision`);
CREATE UNIQUE INDEX `course_curriculum_versions_course_id_idx` ON `course_curriculum_versions` (`course_id`,`id`);
CREATE UNIQUE INDEX `course_curriculum_versions_single_draft_idx` ON `course_curriculum_versions` (`course_id`) WHERE "course_curriculum_versions"."status" = 'draft';
CREATE INDEX `course_curriculum_versions_course_status_idx` ON `course_curriculum_versions` (`course_id`,`status`);
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

CREATE UNIQUE INDEX `course_unit_versions_sort_order_idx` ON `course_unit_versions` (`curriculum_version_id`,`sort_order`);
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

CREATE UNIQUE INDEX `lesson_step_versions_lesson_sort_order_idx` ON `lesson_step_versions` (`curriculum_version_id`,`lesson_id`,`sort_order`);
CREATE UNIQUE INDEX `lesson_step_versions_lesson_id_idx` ON `lesson_step_versions` (`curriculum_version_id`,`lesson_id`,`id`);
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

CREATE UNIQUE INDEX `lesson_versions_unit_sort_order_idx` ON `lesson_versions` (`curriculum_version_id`,`unit_id`,`sort_order`);
CREATE UNIQUE INDEX `lesson_versions_version_id_idx` ON `lesson_versions` (`curriculum_version_id`,`id`);
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

CREATE UNIQUE INDEX `learner_course_progress_version_scope_idx` ON `learner_course_progress` (`user_id`,`course_id`,`curriculum_version_id`);
CREATE INDEX `learner_course_progress_activity_idx` ON `learner_course_progress` (`user_id`,`last_activity_at`,`course_id`);
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

CREATE INDEX `learner_lesson_answers_lesson_idx` ON `learner_lesson_answers` (`user_id`,`curriculum_version_id`,`lesson_id`);
CREATE TABLE `learner_lesson_progress` (
	`completed_at` integer,
	`course_id` text NOT NULL,
	`curriculum_version_id` text NOT NULL,
	`current_step_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `curriculum_version_id`, `lesson_id`),
	FOREIGN KEY (`user_id`,`course_id`,`curriculum_version_id`) REFERENCES `learner_course_progress`(`user_id`,`course_id`,`curriculum_version_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`) REFERENCES `lesson_versions`(`curriculum_version_id`,`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`curriculum_version_id`,`lesson_id`,`current_step_id`) REFERENCES `lesson_step_versions`(`curriculum_version_id`,`lesson_id`,`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learner_lesson_progress_status_check" CHECK("learner_lesson_progress"."status" IN ('in_progress', 'completed'))
);

CREATE INDEX `learner_lesson_progress_user_course_idx` ON `learner_lesson_progress` (`user_id`,`course_id`);
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

CREATE INDEX `learner_step_drafts_lesson_idx` ON `learner_step_drafts` (`user_id`,`curriculum_version_id`,`lesson_id`);
CREATE TABLE `audit_events` (
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
	CONSTRAINT "audit_events_category_check" CHECK("audit_events"."category" IN ('privacy-access', 'identity-mutation', 'content-mutation')),
	CONSTRAINT "audit_events_action_check" CHECK("audit_events"."action" IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.publish', 'course.archive')),
	CONSTRAINT "audit_events_outcome_check" CHECK("audit_events"."outcome" IN ('started', 'succeeded', 'failed')),
	CONSTRAINT "audit_events_target_type_check" CHECK("audit_events"."target_type" IN ('learner', 'course')),
	CONSTRAINT "audit_events_target_action_check" CHECK(("audit_events"."target_type" = 'learner' AND "audit_events"."action" IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR ("audit_events"."target_type" = 'course' AND "audit_events"."action" IN ('course.publish', 'course.archive'))),
	CONSTRAINT "audit_events_category_action_check" CHECK(("audit_events"."category" = 'privacy-access' AND "audit_events"."action" = 'learner.detail.read') OR ("audit_events"."category" = 'identity-mutation' AND "audit_events"."action" IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR ("audit_events"."category" = 'content-mutation' AND "audit_events"."action" IN ('course.publish', 'course.archive'))),
	CONSTRAINT "audit_events_identifier_check" CHECK(length("audit_events"."id") BETWEEN 1 AND 200 AND "audit_events"."id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events"."actor_id") BETWEEN 1 AND 200 AND "audit_events"."actor_id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events"."target_id") BETWEEN 1 AND 200 AND "audit_events"."target_id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events"."request_id") BETWEEN 1 AND 200 AND "audit_events"."request_id" NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT "audit_events_retention_check" CHECK(("audit_events"."category" IN ('privacy-access', 'content-mutation') AND "audit_events"."retention_until" = "audit_events"."created_at" + 31536000000) OR ("audit_events"."category" = 'identity-mutation' AND "audit_events"."retention_until" = "audit_events"."created_at" + 94608000000)),
	CONSTRAINT "audit_events_client_ip_check" CHECK("audit_events"."client_ip" IS NULL OR (length("audit_events"."client_ip") BETWEEN 2 AND 45 AND "audit_events"."client_ip" NOT GLOB '*[^0-9A-Fa-f:.]*'))
);

CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`,`id`);
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`,`id`);

CREATE TRIGGER course_curriculum_versions_published_delete_guard
BEFORE DELETE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;

CREATE TRIGGER course_curriculum_versions_published_update_guard
BEFORE UPDATE ON course_curriculum_versions
WHEN OLD.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'published curriculum version is immutable');
END;

CREATE TRIGGER course_unit_versions_published_delete_guard
BEFORE DELETE ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER course_unit_versions_published_insert_guard
BEFORE INSERT ON course_unit_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

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

CREATE TRIGGER lesson_step_versions_published_delete_guard
BEFORE DELETE ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER lesson_step_versions_published_insert_guard
BEFORE INSERT ON lesson_step_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

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

CREATE TRIGGER lesson_versions_published_delete_guard
BEFORE DELETE ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

CREATE TRIGGER lesson_versions_published_insert_guard
BEFORE INSERT ON lesson_versions
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published curriculum content is immutable');
END;

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

CREATE TRIGGER content_assets_published_insert_guard
BEFORE INSERT ON content_assets
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = NEW.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published content asset is immutable');
END;

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

CREATE TRIGGER content_assets_published_delete_guard
BEFORE DELETE ON content_assets
WHEN EXISTS (
  SELECT 1 FROM course_curriculum_versions
  WHERE id = OLD.curriculum_version_id AND status = 'published'
)
BEGIN
  SELECT RAISE(ABORT, 'published content asset is immutable');
END;
