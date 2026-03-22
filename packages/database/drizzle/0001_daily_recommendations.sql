CREATE TABLE `daily_recommendations` (
	`created_at` text NOT NULL,
	`date` text NOT NULL,
	`display_order` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt_id` integer NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_rec_date_order_idx` ON `daily_recommendations` (`date`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_rec_date_prompt_idx` ON `daily_recommendations` (`date`,`prompt_id`);--> statement-breakpoint
CREATE INDEX `daily_rec_date_idx` ON `daily_recommendations` (`date`);
