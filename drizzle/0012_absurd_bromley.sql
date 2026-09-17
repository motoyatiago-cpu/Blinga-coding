CREATE TABLE `forum_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reply_to_id` text,
	`request_id` text NOT NULL,
	`content` text NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forum_replies_user_request_idx` ON `forum_replies` (`user_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `forum_replies_post_created_idx` ON `forum_replies` (`post_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `forum_replies_user_created_idx` ON `forum_replies` (`user_id`,`created_at`);