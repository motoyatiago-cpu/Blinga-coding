CREATE TABLE `code_drafts` (
	`user_email` text NOT NULL,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`code` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_email`, `language`, `topic_index`)
);
