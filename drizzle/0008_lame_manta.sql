CREATE TABLE `password_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`login_identifier` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`iterations` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`password_changed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_credentials_login_identifier_idx` ON `password_credentials` (`login_identifier`);--> statement-breakpoint
CREATE TABLE `password_login_attempts` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`first_failed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`locked_until` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
