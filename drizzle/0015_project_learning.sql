CREATE TABLE `project_progress` (
	`owner_key` text NOT NULL,
	`user_id` text,
	`language` text NOT NULL,
	`project_slug` text NOT NULL,
	`milestone_json` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`write_window_started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`write_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_key`, `language`, `project_slug`)
);
--> statement-breakpoint
CREATE INDEX `project_progress_owner_updated_idx` ON `project_progress` (`owner_key`,`updated_at` DESC);
--> statement-breakpoint
PRAGMA optimize;
