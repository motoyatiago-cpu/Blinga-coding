CREATE TABLE `learning_progress` (
	`user_email` text PRIMARY KEY NOT NULL,
	`active_language` text NOT NULL,
	`topics_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
