import {
  type Settings,
  type FacebookAuth,
  type HistoryEntry,
  type FacebookPost,
  type FacebookPage,
  type AuthToken,
  type SupportedPlatform,
  type YouTubeVideo,
  type PrivacyStatus,
  settingsSchema,
  facebookAuthSchema,
  historyEntrySchema,
  authSchema,
  SupportedPlatform as SupportedPlatformEnum
} from "@shared/schema";
import { nanoid } from 'nanoid';

// Interface for storage operations
export interface IStorage {
  // Settings operations
  getSettings(): Settings;
  saveSettings(settings: Settings): Settings;
  
  // Generic auth token operations
  getAuthToken(platform: SupportedPlatform): AuthToken | null;
  saveAuthToken(token: AuthToken): AuthToken;
  removeAuthToken(platform: SupportedPlatform): void;
  
  // Legacy Facebook-specific auth (kept for backward compatibility)
  getFacebookAuth(): FacebookAuth | null;
  saveFacebookAuth(token: FacebookAuth): FacebookAuth;
  removeFacebookAuth(): void;
  
  // History operations
  getHistoryEntries(platform?: SupportedPlatform): HistoryEntry[];
  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry;
  
  // Facebook content operations (for backward compatibility)
  getCachedPosts(): FacebookPost[];
  saveCachedPosts(posts: FacebookPost[]): void;
  clearCachedPosts(): void;
  
  getCachedPages(): FacebookPage[];
  saveCachedPages(pages: FacebookPage[]): void;
  clearCachedPages(): void;
  
  // YouTube content operations
  getCachedYouTubeVideos(): YouTubeVideo[];
  saveCachedYouTubeVideos(videos: YouTubeVideo[]): void;
  clearCachedYouTubeVideos(): void;
  
  // Privacy status backup operations (for restoring content)
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[]): void;
  getPrivacyStatuses(platform: SupportedPlatform): PrivacyStatus[];
  clearPrivacyStatuses(platform: SupportedPlatform): void;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private settings: Settings;
  private authTokens: Record<SupportedPlatform, AuthToken | null> = {
    facebook: null,
    youtube: null,
    tiktok: null
  };
  private facebookAuth: FacebookAuth | null = null; // Legacy support
  private historyEntries: HistoryEntry[] = [];
  private cachedPosts: FacebookPost[] = [];
  private cachedPages: FacebookPage[] = [];
  private cachedYouTubeVideos: YouTubeVideo[] = [];
  private privacyStatuses: Record<SupportedPlatform, PrivacyStatus[]> = {
    facebook: [],
    youtube: [],
    tiktok: []
  };
  
  constructor() {
    // Initialize with default settings
    this.settings = settingsSchema.parse({});
  }

  // Settings operations
  getSettings(): Settings {
    return this.settings;
  }

  saveSettings(settings: Settings): Settings {
    this.settings = settings;
    return this.settings;
  }
  
  // Generic auth token operations
  getAuthToken(platform: SupportedPlatform): AuthToken | null {
    return this.authTokens[platform];
  }
  
  saveAuthToken(token: AuthToken): AuthToken {
    const validatedToken = authSchema.parse(token);
    this.authTokens[token.platform] = validatedToken;
    
    // Sync with legacy Facebook auth if applicable
    if (token.platform === 'facebook') {
      this.facebookAuth = {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn || 0,
        timestamp: token.timestamp,
        userId: token.userId,
        isManualToken: token.isManualToken
      };
    }
    
    return validatedToken;
  }
  
  removeAuthToken(platform: SupportedPlatform): void {
    this.authTokens[platform] = null;
    
    // Sync with legacy Facebook auth if applicable
    if (platform === 'facebook') {
      this.facebookAuth = null;
    }
  }
  
  // Legacy Facebook-specific auth (kept for backward compatibility)
  getFacebookAuth(): FacebookAuth | null {
    return this.facebookAuth;
  }
  
  saveFacebookAuth(token: FacebookAuth): FacebookAuth {
    this.facebookAuth = facebookAuthSchema.parse(token);
    
    // Sync with generic auth
    this.authTokens.facebook = {
      platform: 'facebook',
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      timestamp: token.timestamp,
      userId: token.userId,
      isManualToken: token.isManualToken
    };
    
    return this.facebookAuth;
  }
  
  removeFacebookAuth(): void {
    this.facebookAuth = null;
    this.authTokens.facebook = null;
  }
  
  // History operations
  getHistoryEntries(platform?: SupportedPlatform): HistoryEntry[] {
    if (!platform) {
      return this.historyEntries;
    }
    
    return this.historyEntries.filter(entry => entry.platform === platform);
  }
  
  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
    const newEntry: HistoryEntry = {
      ...entry,
      id: nanoid()
    };
    
    this.historyEntries.unshift(newEntry); // Add to beginning for newest first
    
    // Keep only the last 100 entries
    if (this.historyEntries.length > 100) {
      this.historyEntries = this.historyEntries.slice(0, 100);
    }
    
    return newEntry;
  }
  
  // Facebook content operations (for backward compatibility)
  getCachedPosts(): FacebookPost[] {
    return this.cachedPosts;
  }
  
  saveCachedPosts(posts: FacebookPost[]): void {
    this.cachedPosts = posts;
  }
  
  clearCachedPosts(): void {
    this.cachedPosts = [];
  }
  
  getCachedPages(): FacebookPage[] {
    return this.cachedPages;
  }
  
  saveCachedPages(pages: FacebookPage[]): void {
    this.cachedPages = pages;
  }
  
  clearCachedPages(): void {
    this.cachedPages = [];
  }
  
  // YouTube content operations
  getCachedYouTubeVideos(): YouTubeVideo[] {
    return this.cachedYouTubeVideos;
  }
  
  saveCachedYouTubeVideos(videos: YouTubeVideo[]): void {
    this.cachedYouTubeVideos = videos;
  }
  
  clearCachedYouTubeVideos(): void {
    this.cachedYouTubeVideos = [];
  }
  
  // Privacy status backup operations
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[]): void {
    this.privacyStatuses[platform] = statuses;
  }
  
  getPrivacyStatuses(platform: SupportedPlatform): PrivacyStatus[] {
    return this.privacyStatuses[platform] || [];
  }
  
  clearPrivacyStatuses(platform: SupportedPlatform): void {
    this.privacyStatuses[platform] = [];
  }
}

// Use in-memory storage
export const storage = new MemStorage();
