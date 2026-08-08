CREATE TABLE `writings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'drafting' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`self_check_started_at` integer,
	`checked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writings_mode_check" CHECK("writings"."mode" IN ('free', 'explain', 'argue')),
	CONSTRAINT "writings_status_check" CHECK("writings"."status" IN ('drafting', 'checked')),
	CONSTRAINT "writings_version_check" CHECK("writings"."version" >= 0),
	CONSTRAINT "writings_checked_at_check" CHECK(("writings"."status" = 'drafting' AND "writings"."checked_at" IS NULL) OR ("writings"."status" = 'checked' AND "writings"."checked_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `writings_user_updated_idx` ON `writings` (`user_id`,`updated_at`,`id`);
--> statement-breakpoint
CREATE TABLE `writing_events` (
	`user_id` text NOT NULL,
	`writing_id` text NOT NULL,
	`event_type` text NOT NULL,
	`recorded_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `writing_id`, `event_type`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "writing_events_type_check" CHECK("writing_events"."event_type" IN ('writing_created', 'self_check_started', 'revised_after_self_check', 'self_check_completed', 'writing_deleted'))
);
--> statement-breakpoint
CREATE INDEX `writing_events_type_recorded_idx` ON `writing_events` (`event_type`,`recorded_at`);
--> statement-breakpoint
CREATE VIEW `writing_reporting_events` AS
SELECT user_id, writing_id, event_type, recorded_at
FROM writing_events;
