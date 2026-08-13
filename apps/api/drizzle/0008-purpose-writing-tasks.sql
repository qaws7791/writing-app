-- 집중형 쓰기를 목적 과제 쓰기로 교체한다. 기존 글 행은 이전하지 않는다.
DROP VIEW IF EXISTS `writing_reporting_events`;
DROP TABLE IF EXISTS `writing_events`;
DROP TABLE IF EXISTS `writings`;

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
CREATE INDEX `writing_tasks_updated_idx` ON `writing_tasks` (`updated_at`,`id`);

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
CREATE INDEX `writing_task_publications_task_idx` ON `writing_task_publications` (`task_id`,`published_at`,`id`);

CREATE TABLE `writings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'drafting' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`publication_id`) REFERENCES `writing_task_publications`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writings_status_check" CHECK("writings"."status" IN ('drafting', 'complete')),
	CONSTRAINT "writings_version_check" CHECK("writings"."version" >= 0),
	CONSTRAINT "writings_completed_at_check" CHECK(("writings"."status" = 'drafting' AND "writings"."completed_at" IS NULL) OR ("writings"."status" = 'complete' AND "writings"."completed_at" IS NOT NULL))
);
CREATE INDEX `writings_user_updated_idx` ON `writings` (`user_id`,`updated_at`,`id`);
CREATE INDEX `writings_publication_idx` ON `writings` (`publication_id`);

CREATE TABLE `writing_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`writing_id` text NOT NULL,
	`body_version` integer NOT NULL,
	`result_json` text NOT NULL,
	`succeeded_at` integer NOT NULL,
	FOREIGN KEY (`writing_id`) REFERENCES `writings`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "writing_checks_body_version_check" CHECK("writing_checks"."body_version" >= 0),
	CONSTRAINT "writing_checks_result_check" CHECK(json_valid("writing_checks"."result_json") AND json_type("writing_checks"."result_json") = 'object')
);
CREATE UNIQUE INDEX `writing_checks_writing_version_idx` ON `writing_checks` (`writing_id`,`body_version`);
CREATE INDEX `writing_checks_succeeded_idx` ON `writing_checks` (`succeeded_at`,`id`);

CREATE TABLE `writing_ai_notices` (
	`user_id` text PRIMARY KEY NOT NULL,
	`acknowledged_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);

CREATE TABLE `writing_events` (
	`user_id` text NOT NULL,
	`writing_id` text NOT NULL,
	`event_type` text NOT NULL,
	`recorded_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `writing_id`, `event_type`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writing_events_type_check" CHECK("writing_events"."event_type" IN ('writing_created', 'check_succeeded', 'revised_after_check', 'writing_completed', 'writing_deleted'))
);
CREATE INDEX `writing_events_type_recorded_idx` ON `writing_events` (`event_type`,`recorded_at`);

CREATE VIEW `writing_reporting_events` AS
SELECT user_id, writing_id, event_type, recorded_at
FROM writing_events;

CREATE TABLE `audit_events_next` (
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`category` text NOT NULL,
	`client_ip` text,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`mcp_approval_id` text,
	`mcp_execution_id` text,
	`mcp_input_digest` text,
	`mcp_oauth_client_id` text,
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
	CONSTRAINT `audit_events_client_ip_check` CHECK(`client_ip` IS NULL OR (length(`client_ip`) BETWEEN 2 AND 45 AND `client_ip` NOT GLOB '*[^0-9A-Fa-f:.]*')),
	CONSTRAINT `audit_events_mcp_provenance_check` CHECK((`mcp_execution_id` IS NULL AND `mcp_approval_id` IS NULL AND `mcp_input_digest` IS NULL AND `mcp_oauth_client_id` IS NULL) OR (length(`mcp_execution_id`) BETWEEN 1 AND 200 AND `mcp_execution_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND (`mcp_approval_id` IS NULL OR (length(`mcp_approval_id`) BETWEEN 1 AND 200 AND `mcp_approval_id` NOT GLOB '*[^A-Za-z0-9._:-]*')) AND length(`mcp_input_digest`) = 64 AND `mcp_input_digest` NOT GLOB '*[^a-f0-9]*' AND length(`mcp_oauth_client_id`) BETWEEN 1 AND 200))
);
INSERT INTO `audit_events_next` (`action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `mcp_approval_id`, `mcp_execution_id`, `mcp_input_digest`, `mcp_oauth_client_id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`)
SELECT `action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `mcp_approval_id`, `mcp_execution_id`, `mcp_input_digest`, `mcp_oauth_client_id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`
FROM `audit_events`;
DROP TABLE `audit_events`;
ALTER TABLE `audit_events_next` RENAME TO `audit_events`;
CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`, `id`);
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`, `id`);
