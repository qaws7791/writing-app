-- 코스 보관 해제 감사 기록을 허용한다.
-- baseline의 check 제약이 `course.restore`를 빠뜨려 보관 해제 요청이 감사 기록 단계에서 실패했다.
-- SQLite는 check 제약을 변경할 수 없어 표를 다시 만들고 기존 기록을 옮긴다.
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
	CONSTRAINT "audit_events_category_check" CHECK("audit_events_next"."category" IN ('privacy-access', 'identity-mutation', 'content-mutation')),
	CONSTRAINT "audit_events_action_check" CHECK("audit_events_next"."action" IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.publish', 'course.archive', 'course.restore')),
	CONSTRAINT "audit_events_outcome_check" CHECK("audit_events_next"."outcome" IN ('started', 'succeeded', 'failed')),
	CONSTRAINT "audit_events_target_type_check" CHECK("audit_events_next"."target_type" IN ('learner', 'course')),
	CONSTRAINT "audit_events_target_action_check" CHECK(("audit_events_next"."target_type" = 'learner' AND "audit_events_next"."action" IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR ("audit_events_next"."target_type" = 'course' AND "audit_events_next"."action" IN ('course.publish', 'course.archive', 'course.restore'))),
	CONSTRAINT "audit_events_category_action_check" CHECK(("audit_events_next"."category" = 'privacy-access' AND "audit_events_next"."action" = 'learner.detail.read') OR ("audit_events_next"."category" = 'identity-mutation' AND "audit_events_next"."action" IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR ("audit_events_next"."category" = 'content-mutation' AND "audit_events_next"."action" IN ('course.publish', 'course.archive', 'course.restore'))),
	CONSTRAINT "audit_events_identifier_check" CHECK(length("audit_events_next"."id") BETWEEN 1 AND 200 AND "audit_events_next"."id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events_next"."actor_id") BETWEEN 1 AND 200 AND "audit_events_next"."actor_id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events_next"."target_id") BETWEEN 1 AND 200 AND "audit_events_next"."target_id" NOT GLOB '*[^A-Za-z0-9._:-]*' AND length("audit_events_next"."request_id") BETWEEN 1 AND 200 AND "audit_events_next"."request_id" NOT GLOB '*[^A-Za-z0-9._:-]*'),
	CONSTRAINT "audit_events_retention_check" CHECK(("audit_events_next"."category" IN ('privacy-access', 'content-mutation') AND "audit_events_next"."retention_until" = "audit_events_next"."created_at" + 31536000000) OR ("audit_events_next"."category" = 'identity-mutation' AND "audit_events_next"."retention_until" = "audit_events_next"."created_at" + 94608000000)),
	CONSTRAINT "audit_events_client_ip_check" CHECK("audit_events_next"."client_ip" IS NULL OR (length("audit_events_next"."client_ip") BETWEEN 2 AND 45 AND "audit_events_next"."client_ip" NOT GLOB '*[^0-9A-Fa-f:.]*'))
);
INSERT INTO `audit_events_next` (`action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`)
SELECT `action`, `actor_id`, `category`, `client_ip`, `created_at`, `id`, `outcome`, `request_id`, `retention_until`, `target_id`, `target_type`
FROM `audit_events`;
DROP TABLE `audit_events`;
ALTER TABLE `audit_events_next` RENAME TO `audit_events`;
CREATE INDEX `audit_events_query_idx` ON `audit_events` (`created_at`,`id`);
CREATE INDEX `audit_events_retention_purge_idx` ON `audit_events` (`retention_until`,`id`);
