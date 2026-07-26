CREATE TABLE `learning_notes` (
	`user_email` text NOT NULL,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`content` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_email`, `language`, `topic_index`)
);
