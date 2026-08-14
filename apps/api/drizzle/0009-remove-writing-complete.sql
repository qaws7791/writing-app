DROP VIEW IF EXISTS `writing_reporting_events`;
--> statement-breakpoint
CREATE TABLE `writings_next` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`body` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`publication_id`) REFERENCES `writing_task_publications`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writings_version_check" CHECK("writings_next"."version" >= 0)
);
--> statement-breakpoint
INSERT INTO `writings_next` (`id`, `user_id`, `publication_id`, `body`, `version`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `publication_id`, `body`, `version`, `created_at`, `updated_at`
FROM `writings`;
--> statement-breakpoint
CREATE TABLE `writing_checks_next` (
	`id` text PRIMARY KEY NOT NULL,
	`writing_id` text NOT NULL,
	`body_version` integer NOT NULL,
	`result_json` text NOT NULL,
	`succeeded_at` integer NOT NULL,
	FOREIGN KEY (`writing_id`) REFERENCES `writings_next`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "writing_checks_body_version_check" CHECK("writing_checks_next"."body_version" >= 0),
	CONSTRAINT "writing_checks_result_check" CHECK(json_valid("writing_checks_next"."result_json") AND json_type("writing_checks_next"."result_json") = 'object')
);
--> statement-breakpoint
INSERT INTO `writing_checks_next` (`id`, `writing_id`, `body_version`, `result_json`, `succeeded_at`)
SELECT `id`, `writing_id`, `body_version`, `result_json`, `succeeded_at`
FROM `writing_checks`
WHERE `id` IN (
	SELECT `id`
	FROM `writing_checks` AS candidate
	WHERE `candidate`.`succeeded_at` = (
		SELECT MAX(`latest`.`succeeded_at`)
		FROM `writing_checks` AS latest
		WHERE `latest`.`writing_id` = `candidate`.`writing_id`
	)
);
--> statement-breakpoint
CREATE TABLE `writing_events_next` (
	`user_id` text NOT NULL,
	`writing_id` text NOT NULL,
	`event_type` text NOT NULL,
	`recorded_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `writing_id`, `event_type`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writing_events_type_check" CHECK("writing_events_next"."event_type" IN ('writing_created', 'check_succeeded', 'revised_after_check', 'writing_deleted'))
);
--> statement-breakpoint
INSERT INTO `writing_events_next` (`user_id`, `writing_id`, `event_type`, `recorded_at`)
SELECT `user_id`, `writing_id`, `event_type`, `recorded_at`
FROM `writing_events`
WHERE `event_type` <> 'writing_completed';
--> statement-breakpoint
DROP TABLE `writing_checks`;
--> statement-breakpoint
DROP TABLE `writings`;
--> statement-breakpoint
DROP TABLE `writing_events`;
--> statement-breakpoint
ALTER TABLE `writings_next` RENAME TO `writings`;
--> statement-breakpoint
ALTER TABLE `writing_checks_next` RENAME TO `writing_checks`;
--> statement-breakpoint
ALTER TABLE `writing_events_next` RENAME TO `writing_events`;
--> statement-breakpoint
CREATE INDEX `writings_user_updated_idx` ON `writings` (`user_id`,`updated_at`,`id`);
--> statement-breakpoint
CREATE INDEX `writings_publication_idx` ON `writings` (`publication_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `writing_checks_writing_idx` ON `writing_checks` (`writing_id`);
--> statement-breakpoint
CREATE INDEX `writing_checks_succeeded_idx` ON `writing_checks` (`succeeded_at`,`id`);
--> statement-breakpoint
CREATE INDEX `writing_events_type_recorded_idx` ON `writing_events` (`event_type`,`recorded_at`);
--> statement-breakpoint
CREATE VIEW `writing_reporting_events` AS
SELECT user_id, writing_id, event_type, recorded_at
FROM writing_events;
