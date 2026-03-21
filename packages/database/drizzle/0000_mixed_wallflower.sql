CREATE TABLE `account` (
	`accessToken` text,
	`accessTokenExpiresAt` integer,
	`accountId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`idToken` text,
	`password` text,
	`providerId` text NOT NULL,
	`refreshToken` text,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`updatedAt` integer NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`body_json` text NOT NULL,
	`body_plain_text` text NOT NULL,
	`character_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_saved_at` text NOT NULL,
	`source_prompt_id` integer,
	`title` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	`word_count` integer NOT NULL,
	FOREIGN KEY (`source_prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drafts_user_updated_idx` ON `drafts` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`created_at` text NOT NULL,
	`description` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`is_today_recommended` integer DEFAULT false NOT NULL,
	`level` integer NOT NULL,
	`outline_json` text NOT NULL,
	`slug` text NOT NULL,
	`suggested_length_label` text NOT NULL,
	`tags_json` text NOT NULL,
	`text` text NOT NULL,
	`tips_json` text NOT NULL,
	`today_recommendation_order` integer,
	`topic` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompts_slug_unique` ON `prompts` (`slug`);--> statement-breakpoint
CREATE INDEX `prompts_today_idx` ON `prompts` (`is_today_recommended`,`today_recommendation_order`);--> statement-breakpoint
CREATE TABLE `saved_prompts` (
	`prompt_id` integer NOT NULL,
	`saved_at` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `prompt_id`),
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_prompts_saved_at_idx` ON `saved_prompts` (`user_id`,`saved_at`);--> statement-breakpoint
CREATE TABLE `session` (
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`ipAddress` text,
	`token` text NOT NULL,
	`updatedAt` integer NOT NULL,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `user` (
	`createdAt` integer NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`updatedAt` integer NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);