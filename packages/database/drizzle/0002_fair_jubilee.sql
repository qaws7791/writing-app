CREATE TABLE `user_session_step_ai_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`session_id` integer NOT NULL,
	`step_order` integer NOT NULL,
	`kind` text NOT NULL,
	`source_step_order` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`input_json` text NOT NULL,
	`result_json` text,
	`error_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `journey_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_session_step_ai_state_user_session_idx` ON `user_session_step_ai_state` (`user_id`,`session_id`);--> statement-breakpoint
CREATE INDEX `user_session_step_ai_state_status_idx` ON `user_session_step_ai_state` (`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_session_step_ai_state_user_session_step_uniq` ON `user_session_step_ai_state` (`user_id`,`session_id`,`step_order`);
