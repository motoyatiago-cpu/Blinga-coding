CREATE TABLE `forum_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_key` text NOT NULL,
	`author_name` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `forum_posts_created_idx` ON `forum_posts` (`id`);--> statement-breakpoint
CREATE INDEX `forum_posts_author_idx` ON `forum_posts` (`author_key`,`id`);