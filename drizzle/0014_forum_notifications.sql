CREATE TABLE `forum_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_user_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`post_id` text NOT NULL,
	`reply_id` text,
	`kind` text NOT NULL CHECK (`kind` IN ('post_reply', 'reply_reply', 'mention', 'resolved')),
	`dedupe_key` text NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forum_notifications_recipient_dedupe_idx` ON `forum_notifications` (`recipient_user_id`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `forum_notifications_recipient_created_idx` ON `forum_notifications` (`recipient_user_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `forum_notifications_recipient_unread_idx` ON `forum_notifications` (`recipient_user_id`,`read_at`,`created_at`);
