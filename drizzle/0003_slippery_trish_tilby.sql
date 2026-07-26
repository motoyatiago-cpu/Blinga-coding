CREATE TABLE `code_run_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`mode` text NOT NULL,
	`status_id` integer NOT NULL,
	`status_description` text NOT NULL,
	`duration_ms` integer,
	`memory_kb` integer,
	`passed_tests` integer,
	`total_tests` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
