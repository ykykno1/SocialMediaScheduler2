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

// NEW SECURE USERS TABLE - Enhanced security and organization
export const secureUsers = pgTable("secure_users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  username: varchar("username").notNull(),
  passwordHash: varchar("password_hash"),
  accountTier: varchar("account_tier").$type<'free' | 'youtube_pro' | 'premium'>().notNull().default('free'),
  emailVerified: boolean("email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  // Phone verification fields
  phoneNumber: varchar("phone_number").unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  // Registration method
  registrationMethod: varchar("registration_method").$type<'email' | 'phone'>().notNull().default('email'),
  shabbatCity: varchar("shabbat_city").default('ירושלים'),
  shabbatCityId: varchar("shabbat_city_id").default('247'),
  // Custom timing preferences for premium users
  hideTimingPreference: varchar("hide_timing_preference").$type<'immediate' | '15min' | '30min' | '1hour'>().default('1hour'),
  restoreTimingPreference: varchar("restore_timing_preference").$type<'immediate' | '30min' | '1hour'>().default('immediate'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Verification codes table for email and SMS verification
export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => secureUsers.id),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"), 
  code: varchar("code").notNull(), // 6-digit verification code
  type: varchar("type").$type<'email' | 'sms'>().notNull(),
  purpose: varchar("purpose").$type<'registration' | 'password_reset' | 'phone_verification'>().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
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

// NEW ENCRYPTED AUTH TOKENS TABLE - Enhanced security with encryption
export const encryptedAuthTokens = pgTable("encrypted_auth_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  platform: varchar("platform").$type<SupportedPlatform>().notNull(),
  connectionName: varchar("connection_name").default('primary'), // Allow multiple connections per platform
  encryptedAccessToken: text("encrypted_access_token"), // Encrypted token data
  encryptedRefreshToken: text("encrypted_refresh_token"), // Encrypted refresh token
  tokenHash: varchar("token_hash"), // For lookup without decryption
  encryptionMetadata: text("encryption_metadata"), // IV, authTag, etc.
  expiresAt: timestamp("expires_at"),
  scopes: text("scopes"), // Array stored as JSON string
  encryptionKeyVersion: integer("encryption_key_version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
  legacyAccessToken: text("legacy_access_token"), // Temporary for migration
  legacyRefreshToken: text("legacy_refresh_token"), // Temporary for migration
  migrationStatus: varchar("migration_status").default('pending'), // 'pending', 'migrated', 'verified'
});

export const historyEntries = pgTable("history_entries", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  timestamp: timestamp("timestamp").defaultNow(),
  action: varchar("action").$type<'hide' | 'restore'>().notNull(),
  platform: varchar("platform").$type<SupportedPlatform>().notNull(),
  success: boolean("success").notNull(),
  affectedItems: integer("affected_items").notNull(),
  error: text("error"),
});

export const videoStatuses = pgTable("video_statuses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  videoId: varchar("video_id").notNull(),
  originalStatus: varchar("original_status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoLockStatuses = pgTable("video_lock_statuses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  videoId: varchar("video_id").notNull(),
  platform: varchar("platform").$type<SupportedPlatform>().notNull().default('youtube'),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedReason: varchar("locked_reason").default("manual"), // "manual" or "pre_hidden"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const shabbatLocations = pgTable("shabbat_locations", {
  id: varchar("id").primaryKey(),
  cityName: varchar("city_name").notNull(),
  cityId: varchar("city_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  // Special admin location with manual times
  isAdminLocation: boolean("is_admin_location").notNull().default(false),
  manualEntryTime: timestamp("manual_entry_time"), // Admin sets this manually
  manualExitTime: timestamp("manual_exit_time"), // Admin sets this manually
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Facebook content preferences table
export const facebookPreferences = pgTable("facebook_preferences", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  
  // What to hide/manage
  managePersonalPosts: boolean("manage_personal_posts").notNull().default(true),
  manageBusinessPages: boolean("manage_business_pages").notNull().default(true),
  manageCampaigns: boolean("manage_campaigns").notNull().default(true),
  
  // Per-page settings (JSON array of page IDs that user wants to manage)
  enabledPageIds: text("enabled_page_ids").default('[]'), // JSON array: ["page1", "page2"]
  
  // Original states tracking (JSON objects)
  personalPostsBeforeHide: text("personal_posts_before_hide").default('{}'), // JSON: {postId: "public"}
  pagePostsBeforeHide: text("page_posts_before_hide").default('{}'), // JSON: {pageId: {postId: "public"}}
  campaignsBeforeHide: text("campaigns_before_hide").default('{}'), // JSON: {campaignId: "active"}
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Facebook content states - tracks what was hidden/restored
export const facebookContentStates = pgTable("facebook_content_states", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  contentId: varchar("content_id").notNull(), // post ID, page ID, or campaign ID
  contentType: varchar("content_type").$type<'personal_post' | 'page_post' | 'campaign'>().notNull(),
  pageId: varchar("page_id"), // only for page_post type
  originalState: varchar("original_state").notNull(), // "public", "friends", "active", etc.
  currentState: varchar("current_state").notNull(),
  hiddenAt: timestamp("hidden_at"),
  restoredAt: timestamp("restored_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type User = typeof users.$inferSelect & {
  hideTimingPreference?: 'immediate' | '15min' | '30min' | '1hour';
  restoreTimingPreference?: 'immediate' | '30min' | '1hour';
};
export type InsertUser = typeof users.$inferInsert;
export type AuthTokenDb = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;
export type VideoLockStatus = typeof videoLockStatuses.$inferSelect;
export type InsertVideoLockStatus = typeof videoLockStatuses.$inferInsert;
export type FacebookPreferences = typeof facebookPreferences.$inferSelect;
export type InsertFacebookPreferences = typeof facebookPreferences.$inferInsert;
export type FacebookContentState = typeof facebookContentStates.$inferSelect;
export type InsertFacebookContentState = typeof facebookContentStates.$inferInsert;

// ============================================
// STRIPE SUBSCRIPTION SYSTEM - NEW TABLES
// ============================================

// Subscription plans schema
export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(), // "trial", "premium"
  stripePriceId: z.string().optional(), // Stripe price ID
  price: z.number(), // $9.90
  currency: z.string().default('USD'),
  interval: z.enum(['month', 'year']).default('month'),
  trialDays: z.number().default(0), // Days of free trial
  isActive: z.boolean().default(true),
  features: z.array(z.string()).default([]), // List of features
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// User subscription status schema
export const userSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeSetupIntentId: z.string().optional(), // For card setup without immediate charge
  status: z.enum([
    'trial',           // Free trial (first Shabbat)
    'pending_payment', // Trial ended, waiting for Tuesday payment
    'active',          // Paying subscriber
    'cancelled',       // Cancelled before payment
    'expired',         // Payment failed or subscription ended
    'paused'           // Temporarily suspended
  ]).default('trial'),
  trialStartDate: z.date(),
  trialEndDate: z.date().optional(), // When trial ends
  paymentDueDate: z.date().optional(), // Tuesday after first Shabbat
  nextBillingDate: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancellationReason: z.string().optional(),
  lastPaymentDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserSubscription = z.infer<typeof userSubscriptionSchema>;

// Payment history schema
export const stripePaymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subscriptionId: z.string(),
  stripePaymentIntentId: z.string(),
  amount: z.number(), // Amount in cents
  currency: z.string().default('USD'),
  status: z.enum(['pending', 'succeeded', 'failed', 'cancelled']),
  paymentMethod: z.string().optional(), // last4 of card
  failureReason: z.string().optional(),
  paidAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type StripePayment = z.infer<typeof stripePaymentSchema>;

// Email notifications schema
export const emailNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subscriptionId: z.string(),
  type: z.enum([
    'trial_started',     // Welcome to trial
    'trial_ending',      // Sunday: Trial ending reminder
    'payment_reminder',  // Monday: Payment due tomorrow
    'payment_failed',    // Payment attempt failed
    'payment_succeeded', // Payment successful
    'subscription_cancelled', // User cancelled
    'subscription_expired'    // Subscription ended
  ]),
  emailAddress: z.string().email(),
  subject: z.string(),
  sentAt: z.date().optional(),
  opened: z.boolean().default(false),
  clicked: z.boolean().default(false),
  status: z.enum(['pending', 'sent', 'failed']).default('pending'),
  createdAt: z.date().default(() => new Date()),
});

export type EmailNotification = z.infer<typeof emailNotificationSchema>;

// Database tables for Stripe integration
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  stripePriceId: varchar("stripe_price_id"),
  price: integer("price").notNull(), // Price in cents
  currency: varchar("currency").notNull().default('USD'),
  interval: varchar("interval").$type<'month' | 'year'>().notNull().default('month'),
  trialDays: integer("trial_days").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  features: text("features").default('[]'), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeSetupIntentId: varchar("stripe_setup_intent_id"),
  status: varchar("status").$type<'trial' | 'pending_payment' | 'active' | 'cancelled' | 'expired' | 'paused'>().notNull().default('trial'),
  trialStartDate: timestamp("trial_start_date").notNull(),
  trialEndDate: timestamp("trial_end_date"),
  paymentDueDate: timestamp("payment_due_date"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  lastPaymentDate: timestamp("last_payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stripePayments = pgTable("stripe_payments", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  subscriptionId: varchar("subscription_id").notNull().references(() => userSubscriptions.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").notNull().default('USD'),
  status: varchar("status").$type<'pending' | 'succeeded' | 'failed' | 'cancelled'>().notNull(),
  paymentMethod: varchar("payment_method"), // last4 of card
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => secureUsers.id),
  subscriptionId: varchar("subscription_id").notNull().references(() => userSubscriptions.id),
  type: varchar("type").$type<'trial_started' | 'trial_ending' | 'payment_reminder' | 'payment_failed' | 'payment_succeeded' | 'subscription_cancelled' | 'subscription_expired'>().notNull(),
  emailAddress: varchar("email_address").notNull(),
  subject: varchar("subject").notNull(),
  sentAt: timestamp("sent_at"),
  opened: boolean("opened").notNull().default(false),
  clicked: boolean("clicked").notNull().default(false),
  status: varchar("status").$type<'pending' | 'sent' | 'failed'>().notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports for new tables
export type SubscriptionPlanDb = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscriptionDb = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type StripePaymentDb = typeof stripePayments.$inferSelect;
export type InsertStripePayment = typeof stripePayments.$inferInsert;
export type EmailNotificationDb = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;
