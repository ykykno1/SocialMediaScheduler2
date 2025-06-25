import { z } from "zod";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// Supported platforms enum
export const SupportedPlatform = z.enum(['facebook', 'youtube', 'tiktok', 'instagram']);
export type SupportedPlatform = z.infer<typeof SupportedPlatform>;

// User settings schema
export const settingsSchema = z.object({
  autoSchedule: z.boolean().default(true),
  hideTime: z.string().default('18:30'),
  restoreTime: z.string().default('19:45'),
  timeZone: z.string().default('Asia/Jerusalem'),
  exceptedContentIds: z.record(z.array(z.string())).default({}), // Record of platform -> excluded IDs
  enabledPlatforms: z.array(SupportedPlatform).default(['facebook']),
  lastHideOperation: z.date().nullable().default(null),
  lastRestoreOperation: z.date().nullable().default(null),
});

export type Settings = z.infer<typeof settingsSchema>;

// Facebook post schema
export const facebookPostSchema = z.object({
  id: z.string(),
  message: z.string().optional(),
  created_time: z.string(),
  privacy: z.object({
    value: z.string(), // 'EVERYONE', 'SELF', etc.
    description: z.string().optional(),
  }),
  isHidden: z.boolean().optional().default(false),
  // Media attachments
  attachments: z.object({
    data: z.array(z.object({
      type: z.string().optional(), // 'photo', 'video', 'link', etc.
      media: z.object({
        image: z.object({
          src: z.string(),
          width: z.number().optional(),
          height: z.number().optional()
        }).optional()
      }).optional(),
      url: z.string().optional(),
      subattachments: z.object({
        data: z.array(z.object({
          type: z.string().optional(),
          media: z.object({
            image: z.object({
              src: z.string(),
              width: z.number().optional(),
              height: z.number().optional()
            }).optional()
          }).optional()
        })).optional()
      }).optional()
    })).optional()
  }).optional(),
  // Direct media fields
  full_picture: z.string().optional(), // Full size image URL
  picture: z.string().optional(), // Thumbnail image URL
  type: z.string().optional(), // 'photo', 'video', 'status', 'link', etc.
  story: z.string().optional() // Story text for posts without message
});

export type FacebookPost = z.infer<typeof facebookPostSchema>;

// YouTube video schema
export const youtubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  publishedAt: z.string(),
  thumbnailUrl: z.string().optional(),
  privacyStatus: z.enum(['public', 'private', 'unlisted']),
  originalPrivacyStatus: z.enum(['public', 'private', 'unlisted']).optional(), // המצב המקורי לפני ההסתרה
  isHidden: z.boolean().optional().default(false)
});

export type YouTubeVideo = z.infer<typeof youtubeVideoSchema>;

// YouTube auth schema
export const youtubeAuthSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
  expiresAt: z.number().optional(),
  timestamp: z.number(),
  channelId: z.string().optional(),
  channelTitle: z.string().optional(),
  profilePictureUrl: z.string().optional()
});

export type YouTubeAuth = z.infer<typeof youtubeAuthSchema>;

// Generic content type for unified handling
export const contentItemSchema = z.object({
  id: z.string(),
  platform: SupportedPlatform,
  title: z.string(),
  description: z.string().optional(),
  publishedAt: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  privacyStatus: z.string(),
  originalPrivacyStatus: z.string().optional(), // For restoring to original state
  isHidden: z.boolean().default(false)
});

export type ContentItem = z.infer<typeof contentItemSchema>;

// History entry schema (updated for multiple platforms)
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  action: z.enum(['hide', 'restore', 'manual_token', 'auth']),
  platform: SupportedPlatform,
  success: z.boolean(),
  affectedItems: z.number(),
  error: z.string().optional(),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

// Generic auth schema
export const authSchema = z.object({
  platform: SupportedPlatform,
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
  expiresAt: z.number().optional(), // Timestamp of expiration
  timestamp: z.number(), // When the token was acquired
  userId: z.string().optional(),
  isManualToken: z.boolean().optional(),
  additionalData: z.record(z.any()).optional(), // Platform-specific extra data
});

export type AuthToken = z.infer<typeof authSchema>;

// Facebook-specific auth schema
export const facebookAuthSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  timestamp: z.number(),
  userId: z.string().optional(),
  pageAccess: z.boolean().optional(),
  isManualToken: z.boolean().optional(),
});

export type FacebookAuth = z.infer<typeof facebookAuthSchema>;

// Facebook page schema
export const facebookPageSchema = z.object({
  id: z.string(),
  name: z.string(),
  access_token: z.string().optional(),
  category: z.string().optional(),
  tasks: z.array(z.string()).optional(),
  isHidden: z.boolean().optional().default(false)
});

export type FacebookPage = z.infer<typeof facebookPageSchema>;

// Privacy status backup schema for restoring content
export const privacyStatusSchema = z.object({
  platform: SupportedPlatform,
  contentId: z.string(),
  originalStatus: z.string(),
  currentStatus: z.string(),
  wasHiddenByUser: z.boolean().default(false), // Was already hidden before our app touched it
  isLockedByUser: z.boolean().default(false), // User manually locked this post
  timestamp: z.number(),
  lastModified: z.number().optional()
});

export type PrivacyStatus = z.infer<typeof privacyStatusSchema>;

// User account schemas
export const userSchema = z.object({
  id: z.string(), // UUID
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().optional(), // Optional for Google auth users
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  accountType: z.enum(['free', 'youtube_pro', 'premium']).default('free'),
  subscriptionId: z.string().optional(), // Stripe subscription ID
  location: z.object({
    city: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string()
  }).optional(),
  shabbatSettings: z.object({
    autoHide: z.boolean().default(false),
    candleLightingOffset: z.number().default(-18), // minutes before sunset
    havdalahOffset: z.number().default(42), // minutes after sunset
    enabledPlatforms: z.array(SupportedPlatform).default([])
  }).optional(),
  googleId: z.string().optional(), // For Google OAuth
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLogin: z.date().optional(),
  lastActive: z.date().optional()
});

export type UserZod = z.infer<typeof userSchema>;

// Insert schemas
export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertUserZod = z.infer<typeof insertUserSchema>;

// Login schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginData = z.infer<typeof loginSchema>;

// Registration schema
export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

export type RegisterData = z.infer<typeof registerSchema>;

// Shabbat times schema
export const shabbatTimesSchema = z.object({
  date: z.string(),
  candleLighting: z.string(), // ISO datetime
  havdalah: z.string(), // ISO datetime
  location: z.string(),
  timezone: z.string()
});

export type ShabbatTimes = z.infer<typeof shabbatTimesSchema>;

// Payment tracking schema
export const paymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  type: z.enum(['youtube_pro', 'premium']),
  method: z.enum(['manual', 'coupon', 'credit_card', 'bank_transfer']),
  description: z.string().optional(),
  timestamp: z.date(),
  isActive: z.boolean().default(true)
});

export type Payment = z.infer<typeof paymentSchema>;

// Database tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  username: varchar("username").notNull(),
  accountType: varchar("account_type").$type<'free' | 'youtube_pro' | 'premium'>().notNull().default('free'),
  shabbatCity: varchar("shabbat_city").default('ירושלים'),
  shabbatCityId: varchar("shabbat_city_id").default('247'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: varchar("platform").$type<SupportedPlatform>().notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  timestamp: timestamp("timestamp").defaultNow(),
  additionalData: text("additional_data"), // JSON string
});

export const historyEntries = pgTable("history_entries", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
  action: varchar("action").$type<'hide' | 'restore'>().notNull(),
  platform: varchar("platform").$type<SupportedPlatform>().notNull(),
  success: boolean("success").notNull(),
  affectedItems: integer("affected_items").notNull(),
  error: text("error"),
});

export const videoStatuses = pgTable("video_statuses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull(),
  originalStatus: varchar("original_status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoLockStatuses = pgTable("video_lock_statuses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull(),
  platform: varchar("platform").$type<SupportedPlatform>().notNull().default('youtube'),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedReason: varchar("locked_reason").default("manual"), // "manual" or "pre_hidden"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AuthTokenDb = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;
export type VideoLockStatus = typeof videoLockStatuses.$inferSelect;
export type InsertVideoLockStatus = typeof videoLockStatuses.$inferInsert;
