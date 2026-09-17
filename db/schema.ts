import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const learningProgress = sqliteTable("learning_progress", {
  userEmail: text("user_email").primaryKey(),
  userId: text("user_id"),
  activeLanguage: text("active_language").notNull(),
  topicsJson: text("topics_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const codeDrafts = sqliteTable("code_drafts", {
  userEmail: text("user_email").notNull(),
  userId: text("user_id"),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  code: text("code").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userEmail, table.language, table.topicIndex] }),
]);

export const lessonCompletions = sqliteTable("lesson_completions", {
  userEmail: text("user_email").notNull(),
  userId: text("user_id"),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  passedTests: integer("passed_tests").notNull(),
  totalTests: integer("total_tests").notNull(),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userEmail, table.language, table.topicIndex] }),
]);

export const codeRunHistory = sqliteTable("code_run_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("user_email").notNull(),
  userId: text("user_id"),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  mode: text("mode").notNull(),
  statusId: integer("status_id").notNull(),
  statusDescription: text("status_description").notNull(),
  durationMs: integer("duration_ms"),
  memoryKb: integer("memory_kb"),
  passedTests: integer("passed_tests"),
  totalTests: integer("total_tests"),
  sourceCode: text("source_code"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learningNotes = sqliteTable("learning_notes", {
  userEmail: text("user_email").notNull(),
  userId: text("user_id"),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userEmail, table.language, table.topicIndex] }),
]);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  username: text("username"),
  email: text("email"),
  avatarType: text("avatar_type").notNull().default("preset"),
  avatarValue: text("avatar_value"),
  legacyEmail: text("legacy_email"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("users_username_idx").on(table.username),
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_legacy_email_idx").on(table.legacyEmail),
]);

export const oauthIdentities = sqliteTable("oauth_identities", {
  provider: text("provider").notNull(),
  providerSubject: text("provider_subject").notNull(),
  userId: text("user_id").notNull(),
  providerEmail: text("provider_email"),
  providerName: text("provider_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: text("last_used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerSubject] }),
  index("oauth_identities_user_idx").on(table.userId),
]);

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  userId: text("user_id").notNull(),
  userAgent: text("user_agent"),
  ipHint: text("ip_hint"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
}, (table) => [
  uniqueIndex("auth_sessions_token_hash_idx").on(table.tokenHash),
  index("auth_sessions_user_idx").on(table.userId, table.expiresAt),
]);

export const passwordCredentials = sqliteTable("password_credentials", {
  userId: text("user_id").primaryKey(),
  loginIdentifier: text("login_identifier").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  iterations: integer("iterations").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  passwordChangedAt: text("password_changed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("password_credentials_login_identifier_idx").on(table.loginIdentifier),
]);

export const passwordLoginAttempts = sqliteTable("password_login_attempts", {
  bucketKey: text("bucket_key").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  firstFailedAt: text("first_failed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lockedUntil: text("locked_until"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const oauthTransactions = sqliteTable("oauth_transactions", {
  id: text("id").primaryKey(),
  stateHash: text("state_hash").notNull(),
  provider: text("provider").notNull(),
  codeVerifier: text("code_verifier").notNull(),
  nonce: text("nonce").notNull(),
  returnTo: text("return_to").notNull(),
  linkUserId: text("link_user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at").notNull(),
}, (table) => [
  uniqueIndex("oauth_transactions_state_hash_idx").on(table.stateHash),
  index("oauth_transactions_expiry_idx").on(table.expiresAt),
]);

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  defaultLanguage: text("default_language").notNull().default("Python"),
  editorFontSize: integer("editor_font_size").notNull().default(14),
  reduceMotion: integer("reduce_motion").notNull().default(0),
  aiDetail: text("ai_detail").notNull().default("balanced"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learningActivity = sqliteTable("learning_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("learning_activity_user_idx").on(table.userId, table.id),
]);

export const forumPosts = sqliteTable("forum_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  requestId: text("request_id").notNull(),
  category: text("category").notNull().default("help"),
  content: text("content").notNull(),
  resolved: integer("resolved").notNull().default(0),
  status: text("status").notNull().default("published"),
  isDeleted: integer("is_deleted").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("forum_posts_user_request_idx").on(table.userId, table.requestId),
  index("forum_posts_public_feed_idx").on(
    table.status,
    table.isDeleted,
    table.createdAt,
    table.id,
  ),
  index("forum_posts_user_created_idx").on(table.userId, table.createdAt),
]);

export const forumReplies = sqliteTable("forum_replies", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  replyToId: text("reply_to_id"),
  requestId: text("request_id").notNull(),
  content: text("content").notNull(),
  isDeleted: integer("is_deleted").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("forum_replies_user_request_idx").on(table.userId, table.requestId),
  index("forum_replies_post_created_idx").on(table.postId, table.createdAt, table.id),
  index("forum_replies_user_created_idx").on(table.userId, table.createdAt),
]);

export const forumUserStats = sqliteTable("forum_user_stats", {
  userId: text("user_id").primaryKey(),
  postCount: integer("post_count").notNull().default(0),
  firstPostAt: text("first_post_at"),
  lastPostAt: text("last_post_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
