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
  email: text("email"),
  avatarType: text("avatar_type").notNull().default("preset"),
  avatarValue: text("avatar_value"),
  legacyEmail: text("legacy_email"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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
