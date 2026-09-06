ALTER TABLE `forum_posts` ADD `category` text DEFAULT 'help' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_posts` ADD `resolved` integer DEFAULT 0 NOT NULL;