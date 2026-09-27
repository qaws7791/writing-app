DROP TRIGGER IF EXISTS `admin_mcp_access_tokens_validate_scopes`;
--> statement-breakpoint
DROP TABLE IF EXISTS `admin_mcp_access_token_events`;
--> statement-breakpoint
DROP TABLE IF EXISTS `admin_mcp_access_tokens`;
--> statement-breakpoint
DROP TABLE IF EXISTS `admin_mcp_change_approvals`;
--> statement-breakpoint
DROP TABLE IF EXISTS `content_mcp_automatic_change_receipts`;
--> statement-breakpoint
DROP TABLE IF EXISTS `content_mcp_change_receipts`;
--> statement-breakpoint
CREATE TABLE `audit_events_next` (
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
INSERT INTO `audit_events_next` (`action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`)
SELECT `action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`
FROM `audit_events`;
--> statement-breakpoint
DROP TABLE `audit_events`;
--> statement-breakpoint
ALTER TABLE `audit_events_next` RENAME TO `audit_events`;
--> statement-breakpoint
CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`, `id`);
--> statement-breakpoint
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`, `id`);
