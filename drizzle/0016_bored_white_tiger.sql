ALTER TABLE `forum_notifications` ADD `content_excerpt` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_notifications` ADD `actor_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_notifications` ADD `is_read` integer DEFAULT 0 NOT NULL;