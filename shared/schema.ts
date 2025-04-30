import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  autoSchedule: boolean("auto_schedule").notNull().default(true),
  hideTime: text("hide_time").notNull().default("18:30"),
  restoreTime: text("restore_time").notNull().default("19:45"),
  timeZone: text("time_zone").notNull().default("Asia/Jerusalem"),
  defaultPost: boolean("default_post").notNull().default(true),
  platforms: jsonb("platforms").notNull(),
  exceptedPosts: jsonb("excepted_posts").notNull(),
});

// Auth tokens table
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresIn: integer("expires_in"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// History entries table
export const historyEntries = pgTable("history_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  details: jsonb("details"),
  platforms: jsonb("platforms").notNull(),
});

// Insert schemas
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({ id: true });
export const insertHistoryEntrySchema = createInsertSchema(historyEntries).omit({ id: true });

// Types
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type InsertHistoryEntry = z.infer<typeof insertHistoryEntrySchema>;

export type Settings = typeof settings.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type HistoryEntry = typeof historyEntries.$inferSelect;

// Platform types
export const platformSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string(),
  apiSecret: z.string(),
  connected: z.boolean(),
});

export type Platform = z.infer<typeof platformSchema>;

export const platformsSchema = z.object({
  facebook: platformSchema,
  instagram: platformSchema,
  youtube: platformSchema,
  tiktok: platformSchema,
});

export type Platforms = z.infer<typeof platformsSchema>;

// Excepted post type
export const exceptedPostSchema = z.object({
  id: z.string(),
  platform: z.string(),
  title: z.string(),
  url: z.string(),
});

export type ExceptedPost = z.infer<typeof exceptedPostSchema>;

// Platform status types
export const platformStatusEnum = z.enum(['connected', 'disconnected', 'error']);
export type PlatformStatus = z.infer<typeof platformStatusEnum>;

// Action types
export const actionTypeEnum = z.enum(['hide', 'restore', 'test']);
export type ActionType = z.infer<typeof actionTypeEnum>;

// Status types
export const statusEnum = z.enum(['success', 'error', 'pending']);
export type Status = z.infer<typeof statusEnum>;
