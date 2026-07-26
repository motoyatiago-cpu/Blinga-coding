CREATE TABLE `lesson_completions` (
	`user_email` text NOT NULL,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`passed_tests` integer NOT NULL,
	`total_tests` integer NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_email`, `language`, `topic_index`)
);
