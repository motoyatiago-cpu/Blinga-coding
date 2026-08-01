CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`user_agent` text,
	`ip_hint` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_hash_idx` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `learning_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`language` text NOT NULL,
	`topic_index` integer NOT NULL,
	`action` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `learning_activity_user_idx` ON `learning_activity` (`user_id`,`id`);--> statement-breakpoint
CREATE TABLE `oauth_identities` (
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`user_id` text NOT NULL,
	`provider_email` text,
	`provider_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_used_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`provider`, `provider_subject`)
);
--> statement-breakpoint
CREATE INDEX `oauth_identities_user_idx` ON `oauth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `oauth_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`provider` text NOT NULL,
	`code_verifier` text NOT NULL,
	`nonce` text NOT NULL,
	`return_to` text NOT NULL,
	`link_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_transactions_state_hash_idx` ON `oauth_transactions` (`state_hash`);--> statement-breakpoint
CREATE INDEX `oauth_transactions_expiry_idx` ON `oauth_transactions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`default_language` text DEFAULT 'Python' NOT NULL,
	`editor_font_size` integer DEFAULT 14 NOT NULL,
	`reduce_motion` integer DEFAULT 0 NOT NULL,
	`ai_detail` text DEFAULT 'balanced' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`avatar_type` text DEFAULT 'preset' NOT NULL,
	`avatar_value` text,
	`legacy_email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_login_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `code_drafts` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `code_run_history` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `learning_notes` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `learning_progress` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `lesson_completions` ADD `user_id` text;