CREATE TABLE `learning_mastery` (
	`user_key` text NOT NULL,
	`user_id` text,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`state` text DEFAULT 'not_started' NOT NULL CHECK (`state` IN ('not_started', 'learning', 'mastered', 'review_due')),
	`successful_judges` integer DEFAULT 0 NOT NULL,
	`failed_judges` integer DEFAULT 0 NOT NULL,
	`consecutive_passes` integer DEFAULT 0 NOT NULL,
	`last_attempt_at` text,
	`last_passed_at` text,
	`review_due_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_key`, `language`, `topic_index`)
);
--> statement-breakpoint
CREATE INDEX `learning_mastery_queue_idx` ON `learning_mastery` (`user_key`,`state`,`review_due_at`);
--> statement-breakpoint
CREATE TABLE `wrong_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_key` text NOT NULL,
	`user_id` text,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`run_id` integer,
	`error_summary` text NOT NULL,
	`source_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending', 'reviewed')),
	`retry_count` integer DEFAULT 0 NOT NULL,
	`reviewed_at` text,
	`last_retried_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `wrong_answers_queue_idx` ON `wrong_answers` (`user_key`,`status`,`id`);
--> statement-breakpoint
CREATE INDEX `wrong_answers_run_idx` ON `wrong_answers` (`user_key`,`run_id`);
