import { z } from "zod";

// User settings schema
export const settingsSchema = z.object({
  autoSchedule: z.boolean().default(true),
  hideTime: z.string().default('18:30'),
  restoreTime: z.string().default('19:45'),
  timeZone: z.string().default('Asia/Jerusalem'),
  exceptedPostIds: z.array(z.string()).default([]),
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

// History entry schema
export const historyEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  action: z.enum(['hide', 'restore']),
  platform: z.literal('facebook'),
  success: z.boolean(),
  affectedItems: z.number(),
  error: z.string().optional(),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

// Facebook auth schema
export const facebookAuthSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  timestamp: z.number(),
  userId: z.string().optional(),
  pageAccess: z.boolean().optional(),
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
