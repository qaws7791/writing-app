CREATE TABLE `admin_mcp_change_approvals_next` (
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`decided_at` integer,
	`execution_started_at` integer,
	`expected_course_status` text,
	`expected_user_status` text,
	`expires_at` integer NOT NULL,
	`failure_code` text,
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`input_digest` text NOT NULL,
	`oauth_client_id` text NOT NULL,
	`owner_admin_id` text NOT NULL,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`target_course_id` text,
	`target_edit_version` integer,
	`target_kind` text NOT NULL,
	`target_title` text,
	`target_user_id` text,
	`target_user_status` text,
	`tool_name` text NOT NULL,
	CONSTRAINT `admin_mcp_change_approvals_status_check` CHECK(`status` IN ('pending', 'approved', 'rejected', 'expired', 'executing', 'succeeded', 'failed')),
	CONSTRAINT `admin_mcp_change_approvals_tool_check` CHECK(`tool_name` IN ('admin_create_course_draft', 'admin_archive_course', 'admin_restore_course', 'admin_publish_course', 'admin_set_user_status', 'admin_delete_user')),
	CONSTRAINT `admin_mcp_change_approvals_target_check` CHECK((`target_kind` = 'course-create' AND `target_course_id` IS NOT NULL AND `target_edit_version` >= 0 AND `target_title` IS NOT NULL AND `expected_course_status` IS NULL AND `target_user_id` IS NULL AND `expected_user_status` IS NULL AND `target_user_status` IS NULL AND `tool_name` = 'admin_create_course_draft') OR (`target_kind` = 'course-lifecycle' AND `target_course_id` IS NOT NULL AND `target_edit_version` >= 0 AND `target_title` IS NOT NULL AND `target_user_id` IS NULL AND `expected_user_status` IS NULL AND `target_user_status` IS NULL AND ((`expected_course_status` = 'active' AND `tool_name` = 'admin_archive_course') OR (`expected_course_status` = 'archived' AND `tool_name` = 'admin_restore_course'))) OR (`target_kind` = 'course-publish' AND `target_course_id` IS NOT NULL AND `target_edit_version` >= 0 AND `target_title` IS NOT NULL AND `expected_course_status` IS NULL AND `target_user_id` IS NULL AND `expected_user_status` IS NULL AND `target_user_status` IS NULL AND `tool_name` = 'admin_publish_course') OR (`target_kind` = 'user-status' AND `target_course_id` IS NULL AND `target_edit_version` IS NULL AND `target_title` IS NULL AND `expected_course_status` IS NULL AND `target_user_id` IS NOT NULL AND `expected_user_status` IN ('active', 'suspended') AND `target_user_status` IN ('active', 'suspended') AND `expected_user_status` <> `target_user_status` AND `tool_name` = 'admin_set_user_status') OR (`target_kind` = 'user-delete' AND `target_course_id` IS NULL AND `target_edit_version` IS NULL AND `target_title` IS NULL AND `expected_course_status` IS NULL AND `target_user_id` IS NOT NULL AND `expected_user_status` IN ('active', 'suspended') AND `target_user_status` IS NULL AND `tool_name` = 'admin_delete_user')),
	CONSTRAINT `admin_mcp_change_approvals_identifier_check` CHECK(length(`id`) BETWEEN 1 AND 200 AND `id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`owner_admin_id`) BETWEEN 1 AND 200 AND `owner_admin_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND (`target_course_id` IS NULL OR (length(`target_course_id`) BETWEEN 1 AND 200 AND `target_course_id` NOT GLOB '*[^A-Za-z0-9._:-]*')) AND (`target_user_id` IS NULL OR (length(`target_user_id`) BETWEEN 1 AND 200 AND `target_user_id` NOT GLOB '*[^A-Za-z0-9._:-]*')) AND length(`request_id`) BETWEEN 1 AND 200 AND `request_id` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `admin_mcp_change_approvals_idempotency_check` CHECK(length(`idempotency_key`) BETWEEN 16 AND 128 AND `idempotency_key` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `admin_mcp_change_approvals_digest_check` CHECK(length(`input_digest`) = 64 AND `input_digest` NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT `admin_mcp_change_approvals_text_check` CHECK(length(`oauth_client_id`) BETWEEN 1 AND 200 AND (`target_title` IS NULL OR length(trim(`target_title`)) BETWEEN 1 AND 200)),
	CONSTRAINT `admin_mcp_change_approvals_time_check` CHECK(`expires_at` > `created_at` AND (`decided_at` IS NULL OR `decided_at` >= `created_at`) AND (`execution_started_at` IS NULL OR `execution_started_at` >= `created_at`) AND (`completed_at` IS NULL OR `completed_at` >= `created_at`)),
	CONSTRAINT `admin_mcp_change_approvals_state_time_check` CHECK((`status` = 'pending' AND `decided_at` IS NULL AND `execution_started_at` IS NULL AND `completed_at` IS NULL AND `failure_code` IS NULL) OR (`status` IN ('approved', 'rejected') AND `decided_at` IS NOT NULL AND `execution_started_at` IS NULL AND `completed_at` IS NULL AND `failure_code` IS NULL) OR (`status` = 'expired' AND `execution_started_at` IS NULL AND `completed_at` IS NOT NULL AND `failure_code` IS NULL) OR (`status` = 'executing' AND `decided_at` IS NOT NULL AND `execution_started_at` IS NOT NULL AND `completed_at` IS NULL AND `failure_code` IS NULL) OR (`status` = 'succeeded' AND `decided_at` IS NOT NULL AND `execution_started_at` IS NOT NULL AND `completed_at` IS NOT NULL AND `failure_code` IS NULL) OR (`status` = 'failed' AND `decided_at` IS NOT NULL AND `execution_started_at` IS NOT NULL AND `completed_at` IS NOT NULL AND length(`failure_code`) BETWEEN 1 AND 100))
);
INSERT INTO `admin_mcp_change_approvals_next` (`completed_at`, `created_at`, `decided_at`, `execution_started_at`, `expected_course_status`, `expected_user_status`, `expires_at`, `failure_code`, `id`, `idempotency_key`, `input_digest`, `oauth_client_id`, `owner_admin_id`, `request_id`, `status`, `target_course_id`, `target_edit_version`, `target_kind`, `target_title`, `target_user_id`, `target_user_status`, `tool_name`)
SELECT `completed_at`, `created_at`, `decided_at`, `execution_started_at`, `expected_course_status`, NULL, `expires_at`, `failure_code`, `id`, `idempotency_key`, `input_digest`, `oauth_client_id`, `owner_admin_id`, `request_id`, `status`, `target_course_id`, `target_edit_version`, `target_kind`, `target_title`, NULL, NULL, `tool_name`
FROM `admin_mcp_change_approvals`;
DROP TABLE `admin_mcp_change_approvals`;
ALTER TABLE `admin_mcp_change_approvals_next` RENAME TO `admin_mcp_change_approvals`;
CREATE UNIQUE INDEX `admin_mcp_change_approvals_idempotency_idx` ON `admin_mcp_change_approvals` (`owner_admin_id`, `oauth_client_id`, `tool_name`, `idempotency_key`);
CREATE INDEX `admin_mcp_change_approvals_owner_idx` ON `admin_mcp_change_approvals` (`owner_admin_id`, `created_at`, `id`);
CREATE INDEX `admin_mcp_change_approvals_expiry_idx` ON `admin_mcp_change_approvals` (`expires_at`, `id`);

CREATE TABLE `content_mcp_change_receipts_next` (
	`actor_id` text NOT NULL,
	`approval_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`execution_id` text NOT NULL,
	`input_digest` text NOT NULL,
	`oauth_client_id` text NOT NULL,
	`result_kind` text NOT NULL,
	`result_curriculum_version_id` text,
	`result_published_at` integer,
	`result_revision` integer,
	`target_course_id` text NOT NULL,
	`tool_name` text NOT NULL,
	CONSTRAINT `content_mcp_change_receipts_result_check` CHECK((((`tool_name` = 'admin_create_course_draft' AND `result_kind` = 'course-created') OR (`tool_name` = 'admin_archive_course' AND `result_kind` = 'course-archived') OR (`tool_name` = 'admin_restore_course' AND `result_kind` = 'course-restored')) AND `result_curriculum_version_id` IS NULL AND `result_published_at` IS NULL AND `result_revision` IS NULL) OR (`tool_name` = 'admin_publish_course' AND `result_kind` = 'course-published' AND `result_curriculum_version_id` IS NOT NULL AND `result_published_at` IS NOT NULL AND `result_revision` > 0)),
	CONSTRAINT `content_mcp_change_receipts_identifier_check` CHECK(length(`approval_id`) BETWEEN 1 AND 200 AND `approval_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`execution_id`) BETWEEN 1 AND 200 AND `execution_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`actor_id`) BETWEEN 1 AND 200 AND `actor_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`target_course_id`) BETWEEN 1 AND 200 AND `target_course_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND (`result_curriculum_version_id` IS NULL OR (length(`result_curriculum_version_id`) BETWEEN 1 AND 200 AND `result_curriculum_version_id` NOT GLOB '*[^A-Za-z0-9._:-]*'))),
	CONSTRAINT `content_mcp_change_receipts_digest_check` CHECK(length(`input_digest`) = 64 AND `input_digest` NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT `content_mcp_change_receipts_client_check` CHECK(length(`oauth_client_id`) BETWEEN 1 AND 200)
);
INSERT INTO `content_mcp_change_receipts_next` (`actor_id`, `approval_id`, `created_at`, `execution_id`, `input_digest`, `oauth_client_id`, `result_kind`, `result_curriculum_version_id`, `result_published_at`, `result_revision`, `target_course_id`, `tool_name`)
SELECT `actor_id`, `approval_id`, `created_at`, `approval_id`, `input_digest`, `oauth_client_id`, `result_kind`, NULL, NULL, NULL, `target_course_id`, `tool_name`
FROM `content_mcp_change_receipts`;
DROP TABLE `content_mcp_change_receipts`;
ALTER TABLE `content_mcp_change_receipts_next` RENAME TO `content_mcp_change_receipts`;
CREATE INDEX `content_mcp_change_receipts_course_idx` ON `content_mcp_change_receipts` (`target_course_id`, `created_at`);

CREATE TABLE `content_mcp_automatic_change_receipts` (
	`actor_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`execution_id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`input_digest` text NOT NULL,
	`oauth_client_id` text NOT NULL,
	`result_kind` text NOT NULL,
	`target_course_id` text NOT NULL,
	`tool_name` text NOT NULL,
	CONSTRAINT `content_mcp_automatic_change_receipts_result_check` CHECK((`tool_name` = 'admin_create_course_draft' AND `result_kind` = 'course-created') OR (`tool_name` = 'admin_save_course_draft' AND `result_kind` = 'course-draft-saved') OR (`tool_name` = 'admin_restore_course' AND `result_kind` = 'course-restored')),
	CONSTRAINT `content_mcp_automatic_change_receipts_identifier_check` CHECK(length(`execution_id`) BETWEEN 1 AND 200 AND `execution_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`actor_id`) BETWEEN 1 AND 200 AND `actor_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`target_course_id`) BETWEEN 1 AND 200 AND `target_course_id` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `content_mcp_automatic_change_receipts_idempotency_check` CHECK(length(`idempotency_key`) BETWEEN 16 AND 128 AND `idempotency_key` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `content_mcp_automatic_change_receipts_digest_check` CHECK(length(`input_digest`) = 64 AND `input_digest` NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT `content_mcp_automatic_change_receipts_client_check` CHECK(length(`oauth_client_id`) BETWEEN 1 AND 200)
);
CREATE UNIQUE INDEX `content_mcp_automatic_change_receipts_idempotency_idx` ON `content_mcp_automatic_change_receipts` (`actor_id`, `oauth_client_id`, `tool_name`, `idempotency_key`);
CREATE INDEX `content_mcp_automatic_change_receipts_course_idx` ON `content_mcp_automatic_change_receipts` (`target_course_id`, `created_at`);

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
	CONSTRAINT `audit_events_action_check` CHECK(`action` IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore')),
	CONSTRAINT `audit_events_outcome_check` CHECK(`outcome` IN ('started', 'succeeded', 'failed')),
	CONSTRAINT `audit_events_target_type_check` CHECK(`target_type` IN ('learner', 'course')),
	CONSTRAINT `audit_events_target_action_check` CHECK((`target_type` = 'learner' AND `action` IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (`target_type` = 'course' AND `action` IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore'))),
	CONSTRAINT `audit_events_category_action_check` CHECK((`category` = 'privacy-access' AND `action` = 'learner.detail.read') OR (`category` = 'identity-mutation' AND `action` IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (`category` = 'content-mutation' AND `action` IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore'))),
	CONSTRAINT `audit_events_identifier_check` CHECK(length(`id`) BETWEEN 1 AND 200 AND `id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`actor_id`) BETWEEN 1 AND 200 AND `actor_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`target_id`) BETWEEN 1 AND 200 AND `target_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(`request_id`) BETWEEN 1 AND 200 AND `request_id` NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT `audit_events_retention_check` CHECK((`category` IN ('privacy-access', 'content-mutation') AND `retention_until` = `created_at` + 31536000000) OR (`category` = 'identity-mutation' AND `retention_until` = `created_at` + 94608000000)),
	CONSTRAINT `audit_events_client_ip_check` CHECK(`client_ip` IS NULL OR (length(`client_ip`) BETWEEN 2 AND 45 AND `client_ip` NOT GLOB '*[^0-9A-Fa-f:.]*')),
	CONSTRAINT `audit_events_mcp_provenance_check` CHECK((`mcp_execution_id` IS NULL AND `mcp_approval_id` IS NULL AND `mcp_input_digest` IS NULL AND `mcp_oauth_client_id` IS NULL) OR (length(`mcp_execution_id`) BETWEEN 1 AND 200 AND `mcp_execution_id` NOT GLOB '*[^A-Za-z0-9._:-]*' AND (`mcp_approval_id` IS NULL OR (length(`mcp_approval_id`) BETWEEN 1 AND 200 AND `mcp_approval_id` NOT GLOB '*[^A-Za-z0-9._:-]*')) AND length(`mcp_input_digest`) = 64 AND `mcp_input_digest` NOT GLOB '*[^a-f0-9]*' AND length(`mcp_oauth_client_id`) BETWEEN 1 AND 200))
);
INSERT INTO `audit_events_next` (`action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `mcp_approval_id`, `mcp_execution_id`, `mcp_input_digest`, `mcp_oauth_client_id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`)
SELECT `action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `mcp_approval_id`, `mcp_approval_id`, `mcp_input_digest`, `mcp_oauth_client_id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`
FROM `audit_events`;
DROP TABLE `audit_events`;
ALTER TABLE `audit_events_next` RENAME TO `audit_events`;
CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`, `id`);
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`, `id`);
