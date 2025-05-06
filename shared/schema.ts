import { z } from "zod";

// Supported platforms enum
export const SupportedPlatform = z.enum(['facebook', 'youtube', 'tiktok']);
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
  isHidden: z.boolean().optional().default(false)
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
  timestamp: z.number()
});

export type PrivacyStatus = z.infer<typeof privacyStatusSchema>;
