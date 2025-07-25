// Core types for Shabbat Robot application
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  shabbatCity: string | null;
  shabbatCityId: string | null;
  hideTimingPreference?: 'immediate' | '15min' | '30min' | '1hour';
  restoreTimingPreference?: 'immediate' | '30min' | '1hour';
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserSettings {
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  autoShabbat?: boolean;
  shabbatEnterOffset?: number; // minutes before sunset
  shabbatExitOffset?: number;  // minutes after havdalah
}

export interface PlatformToken {
  userId: string;
  platform: SupportedPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  additionalData?: Record<string, any>;
}

export interface ContentState {
  userId: string;
  platform: SupportedPlatform;
  contentId: string;
  contentType: 'video' | 'post' | 'story';
  originalState: 'public' | 'private' | 'unlisted';
  currentState: 'public' | 'private' | 'unlisted';
  hiddenAt?: Date;
  restoredAt?: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'auth' | 'hide' | 'restore' | 'manual_token' | 'payment' | 'admin_action';
  platform: SupportedPlatform | 'system';
  timestamp: Date;
  success: boolean;
  affectedItems?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface ShabbatSchedule {
  userId: string;
  date: string; // YYYY-MM-DD format
  shabbatEnter: Date;
  shabbatExit: Date;
  timezone: string;
  location: {
    city: string;
    latitude: number;
    longitude: number;
  };
}

export type SupportedPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';

export type AccountType = 'free' | 'youtube_pro' | 'premium';

// API Response types
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface PlatformAuthStatus {
  isAuthenticated: boolean;
  platform: SupportedPlatform;
  channelTitle?: string;
  connectedAt?: Date;
  tokenExpiresAt?: Date;
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PlatformConnectRequest {
  platform: SupportedPlatform;
  code: string;
  redirectUri: string;
}

// Error types
export interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// Facebook-specific types
export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  privacy?: {
    value: 'PUBLIC' | 'FRIENDS' | 'FRIENDS_OF_FRIENDS' | 'ONLY_ME' | 'SELF' | 'CUSTOM';
    description?: string;
  };
  attachments?: {
    data: Array<{
      media?: {
        image?: { src: string; width?: number; height?: number; };
        video?: { src: string; width?: number; height?: number; };
      };
      subattachments?: {
        data: Array<{
          media?: {
            image?: { src: string; width?: number; height?: number; };
          };
        }>;
      };
      type?: string;
      url?: string;
    }>;
  };
  full_picture?: string;
  picture?: string;
  type?: 'photo' | 'video' | 'status' | 'link' | 'event' | 'note';
  story?: string;
  isHidden?: boolean;
  pageId?: string;
  pageName?: string;
}