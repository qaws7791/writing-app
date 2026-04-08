CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `journey_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`journey_id` integer NOT NULL,
	`order` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journey_sessions_journey_idx` ON `journey_sessions` (`journey_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `journey_sessions_journey_order_uniq` ON `journey_sessions` (`journey_id`,`order`);--> statement-breakpoint
CREATE TABLE `journeys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`thumbnail_url` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journeys_category_idx` ON `journeys` (`category`);--> statement-breakpoint
CREATE TABLE `saved_prompts` (
	`user_id` text NOT NULL,
	`prompt_id` integer NOT NULL,
	`saved_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	PRIMARY KEY(`user_id`, `prompt_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `writing_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_prompts_user_saved_idx` ON `saved_prompts` (`user_id`,`saved_at`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`order` integer NOT NULL,
	`type` text NOT NULL,
	`content_json` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `journey_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `steps_session_idx` ON `steps` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `steps_session_order_uniq` ON `steps` (`session_id`,`order`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_journey_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`journey_id` integer NOT NULL,
	`current_session_order` integer DEFAULT 1 NOT NULL,
	`completion_rate` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_journey_progress_user_idx` ON `user_journey_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_journey_progress_status_idx` ON `user_journey_progress` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_journey_progress_user_journey_uniq` ON `user_journey_progress` (`user_id`,`journey_id`);--> statement-breakpoint
CREATE TABLE `user_session_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`session_id` integer NOT NULL,
	`current_step_order` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`step_responses_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `journey_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_session_progress_user_idx` ON `user_session_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_session_progress_status_idx` ON `user_session_progress` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_session_progress_user_session_uniq` ON `user_session_progress` (`user_id`,`session_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `writing_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt_type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`response_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `writing_prompts_type_idx` ON `writing_prompts` (`prompt_type`);--> statement-breakpoint
CREATE TABLE `writing_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`writing_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`title` text NOT NULL,
	`body_json` text NOT NULL,
	`word_count` integer NOT NULL,
	`ai_feedback_json` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`writing_id`) REFERENCES `writings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `writing_versions_writing_idx` ON `writing_versions` (`writing_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `writings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body_json` text NOT NULL,
	`body_plain_text` text NOT NULL,
	`word_count` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_prompt_id` integer,
	`source_session_id` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_prompt_id`) REFERENCES `writing_prompts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_session_id`) REFERENCES `journey_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `writings_user_updated_idx` ON `writings` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `writings_user_status_idx` ON `writings` (`user_id`,`status`);