import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learningProgress = sqliteTable("learning_progress", {
  userEmail: text("user_email").primaryKey(),
  activeLanguage: text("active_language").notNull(),
  topicsJson: text("topics_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const codeDrafts = sqliteTable("code_drafts", {
  userEmail: text("user_email").notNull(),
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  code: text("code").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userEmail, table.language, table.topicIndex] }),
]);

export const lessonCompletions = sqliteTable("lesson_completions", {
  userEmail: text("user_email").notNull(),
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
  language: text("language").notNull(),
  topicIndex: integer("topic_index").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userEmail, table.language, table.topicIndex] }),
]);
