import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learningProgress = sqliteTable("learning_progress", {
  userEmail: text("user_email").primaryKey(),
  activeLanguage: text("active_language").notNull(),
  topicsJson: text("topics_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
