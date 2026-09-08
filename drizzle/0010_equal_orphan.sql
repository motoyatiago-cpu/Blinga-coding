CREATE TABLE `forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forum_posts_user_request_idx` ON `forum_posts` (`user_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `forum_posts_public_feed_idx` ON `forum_posts` (`status`,`is_deleted`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `forum_posts_user_created_idx` ON `forum_posts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `forum_user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`post_count` integer DEFAULT 0 NOT NULL,
	`first_post_at` text,
	`last_post_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
