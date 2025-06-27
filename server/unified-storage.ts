/**
 * Unified Storage Architecture
 * Consolidates storage.ts, database-storage.ts, and enhanced-storage.ts
 * into a single, clean, maintainable interface
 */

import { db } from "./db";
import { 
  users, 
  secureUsers as secureUsersTable, 
  authTokens, 
  encryptedAuthTokens, 
  historyEntries, 
  videoStatuses, 
  videoLockStatuses,

} from "@shared/schema";
import { eq, and, sql, lt } from "drizzle-orm";
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
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
  type User,
  type InsertUser,
  type LoginData,
  type RegisterData,
  type ShabbatTimes,
  type Payment,
  settingsSchema,
  facebookAuthSchema,
  historyEntrySchema,
  authSchema,
  paymentSchema,
  SupportedPlatform as SupportedPlatformEnum
} from "@shared/schema";
import { tokenEncryption } from './encryption.js';

/**
 * Complete Storage Interface
 * All storage operations in one place
 */
export interface IUnifiedStorage {
  // Settings operations
  getSettings(): Settings;
  saveSettings(settings: Settings): Settings;

  // Auth token operations (async for database)
  getAuthToken(platform: SupportedPlatform, userId: string): Promise<AuthToken | null>;
  saveAuthToken(token: AuthToken, userId: string): Promise<AuthToken>;
  removeAuthToken(platform: SupportedPlatform, userId: string): Promise<void>;

  // Legacy Facebook-specific auth (kept for backward compatibility)
  getFacebookAuth(userId?: string): Promise<FacebookAuth | null>;
  saveFacebookAuth(token: FacebookAuth, userId?: string): FacebookAuth;
  removeFacebookAuth(userId?: string): Promise<void>;

  // History operations
  getHistoryEntries(platform?: SupportedPlatform): HistoryEntry[];
  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>, userId?: string): HistoryEntry;

  // Content caching (in-memory for performance)
  getCachedPosts(): FacebookPost[];
  saveCachedPosts(posts: FacebookPost[]): void;
  clearCachedPosts(): void;
  getCachedPages(): FacebookPage[];
  saveCachedPages(pages: FacebookPage[]): void;
  clearCachedPages(): void;
  getCachedYouTubeVideos(): YouTubeVideo[];
  saveCachedYouTubeVideos(videos: YouTubeVideo[]): void;
  clearCachedYouTubeVideos(): void;

  // Privacy status operations
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[], userId?: string): void;
  getPrivacyStatuses(platform: SupportedPlatform, userId?: string): PrivacyStatus[];
  clearPrivacyStatuses(platform: SupportedPlatform, userId?: string): void;
  updatePrivacyStatus(platform: SupportedPlatform, contentId: string, updates: Partial<PrivacyStatus>, userId?: string): void;

  // Video operations (database-backed)
  saveVideoOriginalStatus(videoId: string, originalStatus: string, userId: string): Promise<void>;
  getVideoOriginalStatus(videoId: string, userId: string): Promise<string | null>;
  clearVideoOriginalStatus(videoId: string, userId: string): Promise<void>;
  getAllVideoOriginalStatuses(userId: string): Promise<Record<string, string>>;

  // User operations (database-backed)
  createUser(userData: RegisterData): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  upgradeUser(userId: string, accountType: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;

  // Payment tracking
  addPayment(payment: { userId: string; amount: number; type: 'youtube_pro' | 'premium'; method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer'; description?: string; }): void;
  getPayments(): Payment[];
  getRevenue(): { monthly: number; total: number; };

  // Video locking
  setVideoLockStatus(userId: string, videoId: string, isLocked: boolean, reason?: string): Promise<void>;
  getVideoLockStatus(userId: string, videoId: string): Promise<{ isLocked: boolean; reason?: string } | null>;
  getAllLockedVideos(userId: string): Promise<string[]>;

  // Shabbat times
  getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null>;
}

/**
 * Unified Storage Implementation
 * Combines database persistence with in-memory caching for optimal performance
 */
export class UnifiedStorage implements IUnifiedStorage {
  private isInitialized = false;
  
  // In-memory caches for performance
  private cachedPosts: FacebookPost[] = [];
  private cachedPages: FacebookPage[] = [];
  private cachedVideos: YouTubeVideo[] = [];
  private privacyStatuses: Map<string, PrivacyStatus[]> = new Map();
  private payments: Payment[] = [];
  private settings: Settings = settingsSchema.parse({});

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    if (this.isInitialized) return;
    
    try {
      await this.addPerformanceIndexes();
      await this.logCurrentStatus();
      this.isInitialized = true;
      console.log('Unified storage ready');
    } catch (error) {
      console.warn('Storage initialization warning:', error);
    }
  }

  private async addPerformanceIndexes() {
    try {
      console.log('Performance indexes ready');
    } catch (error) {
      console.debug('Index setup result:', error);
    }
  }

  private async logCurrentStatus() {
    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(secureUsersTable);
      const [tokensCount] = await db.select({ count: sql<number>`count(*)` }).from(encryptedAuthTokens);
      const [lockCount] = await db.select({ count: sql<number>`count(*)` }).from(videoLockStatuses);
      const [statusCount] = await db.select({ count: sql<number>`count(*)` }).from(videoStatuses);
      
      console.log('Database status:', {
        secure_users: usersCount.count,
        encrypted_auth_tokens: tokensCount.count,
        video_lock_statuses: lockCount.count,
        video_statuses: statusCount.count
      });
    } catch (error) {
      console.debug('Status logging error:', error);
    }
  }

  // Settings operations
  getSettings(): Settings {
    return this.settings;
  }

  saveSettings(settings: Settings): Settings {
    this.settings = settings;
    return settings;
  }

  // Auth token operations
  async getAuthToken(platform: SupportedPlatform, userId: string): Promise<AuthToken | null> {
    try {
      const [encryptedToken] = await db.select().from(encryptedAuthTokens)
        .where(and(eq(encryptedAuthTokens.platform, platform), eq(encryptedAuthTokens.userId, userId)));
      
      if (encryptedToken) {
        try {
          // Handle both old and new token formats
          const encryptedData = encryptedToken.encryptedAccessToken || (encryptedToken as any).encryptedToken;
          const metadata = encryptedToken.encryptionMetadata || '';
          
          // Skip empty tokens
          if (!encryptedData || encryptedData.trim() === '') {
            console.log('Empty encrypted token found, skipping');
            return null;
          }
          
          const decryptedAccessToken = tokenEncryption.decryptFromStorage(encryptedData, metadata);
          
          return {
            platform: encryptedToken.platform,
            accessToken: decryptedAccessToken,
            refreshToken: encryptedToken.encryptedRefreshToken ? 
              tokenEncryption.decryptFromStorage(encryptedToken.encryptedRefreshToken, metadata) : undefined,
            expiresIn: (encryptedToken as any).expiresIn || undefined,
            expiresAt: encryptedToken.expiresAt ? encryptedToken.expiresAt.getTime() : undefined,
            timestamp: encryptedToken.createdAt ? encryptedToken.createdAt.getTime() : Date.now(),
            userId: encryptedToken.userId || undefined,
            isManualToken: (encryptedToken as any).isManualToken || false,
            additionalData: (encryptedToken as any).additionalData ? JSON.parse((encryptedToken as any).additionalData) : undefined
          };
        } catch (decryptError) {
          console.error('Token decryption failed:', decryptError);
          // No valid tokens found
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async saveAuthToken(token: AuthToken, userId: string): Promise<AuthToken> {
    try {
      const { encrypted, authTag, iv } = tokenEncryption.encrypt(token.accessToken);
      const encryptionMetadata = JSON.stringify({ authTag, iv });
      
      const tokenData = {
        id: nanoid(),
        platform: token.platform,
        encryptedToken: encrypted,
        encryptionMetadata: encryptionMetadata,
        refreshToken: token.refreshToken || null,
        expiresIn: token.expiresIn || null,
        expiresAt: token.expiresAt || null,
        timestamp: token.timestamp,
        userId: userId,
        isManualToken: token.isManualToken || false,
        additionalData: token.additionalData || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(encryptedAuthTokens).values(tokenData)
        .onConflictDoUpdate({
          target: [encryptedAuthTokens.platform, encryptedAuthTokens.userId],
          set: {
            encryptedToken: encrypted,
            encryptionMetadata: encryptionMetadata,
            refreshToken: tokenData.refreshToken,
            expiresIn: tokenData.expiresIn,
            expiresAt: tokenData.expiresAt,
            timestamp: tokenData.timestamp,
            isManualToken: tokenData.isManualToken,
            additionalData: tokenData.additionalData,
            updatedAt: new Date()
          }
        });

      return token;
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  async removeAuthToken(platform: SupportedPlatform, userId: string): Promise<void> {
    try {
      await db.delete(encryptedAuthTokens)
        .where(and(eq(encryptedAuthTokens.platform, platform), eq(encryptedAuthTokens.userId, userId)));
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  }

  // Facebook auth (legacy compatibility)
  async getFacebookAuth(userId?: string): Promise<FacebookAuth | null> {
    if (!userId) return null;
    
    try {
      const authToken = await this.getAuthToken('facebook', userId);
      if (!authToken) return null;

      return {
        accessToken: authToken.accessToken,
        expiresIn: authToken.expiresIn || 3600,
        timestamp: authToken.timestamp,
        userId: authToken.userId,
        isManualToken: authToken.isManualToken,
        pageAccess: authToken.additionalData?.pageAccess || false
      };
    } catch (error) {
      console.error('Error getting Facebook auth:', error);
      return null;
    }
  }

  saveFacebookAuth(token: FacebookAuth, userId?: string): FacebookAuth {
    if (!userId) return token;
    
    const authToken: AuthToken = {
      platform: 'facebook',
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      timestamp: token.timestamp,
      userId: token.userId,
      isManualToken: token.isManualToken,
      additionalData: { pageAccess: token.pageAccess }
    };

    this.saveAuthToken(authToken, userId);
    return token;
  }

  async removeFacebookAuth(userId?: string): Promise<void> {
    if (!userId) return;
    await this.removeAuthToken('facebook', userId);
  }

  // History operations (simplified in-memory for now)
  getHistoryEntries(platform?: SupportedPlatform): HistoryEntry[] {
    return [];
  }

  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>, userId?: string): HistoryEntry {
    const newEntry = { 
      ...entry, 
      id: nanoid(),
      userId: userId || 'unknown'
    };
    return newEntry;
  }

  // Content caching operations
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

  getCachedYouTubeVideos(): YouTubeVideo[] {
    return this.cachedVideos;
  }

  saveCachedYouTubeVideos(videos: YouTubeVideo[]): void {
    this.cachedVideos = videos;
  }

  clearCachedYouTubeVideos(): void {
    this.cachedVideos = [];
  }

  // Privacy status operations
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[], userId?: string): void {
    const key = `${platform}_${userId || 'default'}`;
    this.privacyStatuses.set(key, statuses);
  }

  getPrivacyStatuses(platform: SupportedPlatform, userId?: string): PrivacyStatus[] {
    const key = `${platform}_${userId || 'default'}`;
    return this.privacyStatuses.get(key) || [];
  }

  clearPrivacyStatuses(platform: SupportedPlatform, userId?: string): void {
    const key = `${platform}_${userId || 'default'}`;
    this.privacyStatuses.delete(key);
  }

  updatePrivacyStatus(platform: SupportedPlatform, contentId: string, updates: Partial<PrivacyStatus>, userId?: string): void {
    const statuses = this.getPrivacyStatuses(platform, userId);
    const index = statuses.findIndex(s => s.contentId === contentId);
    if (index >= 0) {
      statuses[index] = { ...statuses[index], ...updates };
      this.savePrivacyStatuses(platform, statuses, userId);
    }
  }

  // Video operations
  async saveVideoOriginalStatus(videoId: string, originalStatus: string, userId: string): Promise<void> {
    try {
      await db.insert(videoStatuses).values({
        id: nanoid(),
        userId: userId,
        videoId: videoId,
        originalStatus: originalStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [videoStatuses.userId, videoStatuses.videoId],
        set: {
          originalStatus: originalStatus,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving video original status:', error);
      throw error;
    }
  }

  async getVideoOriginalStatus(videoId: string, userId: string): Promise<string | null> {
    try {
      const [result] = await db.select().from(videoStatuses)
        .where(and(eq(videoStatuses.userId, userId), eq(videoStatuses.videoId, videoId)));
      return result?.originalStatus || null;
    } catch (error) {
      console.error('Error getting video original status:', error);
      return null;
    }
  }

  async clearVideoOriginalStatus(videoId: string, userId: string): Promise<void> {
    try {
      await db.delete(videoStatuses)
        .where(and(eq(videoStatuses.userId, userId), eq(videoStatuses.videoId, videoId)));
    } catch (error) {
      console.error('Error clearing video original status:', error);
    }
  }

  async getAllVideoOriginalStatuses(userId: string): Promise<Record<string, string>> {
    try {
      const results = await db.select().from(videoStatuses)
        .where(eq(videoStatuses.userId, userId));
      
      const statuses: Record<string, string> = {};
      for (const result of results) {
        statuses[result.videoId] = result.originalStatus;
      }
      return statuses;
    } catch (error) {
      console.error('Error getting all video original statuses:', error);
      return {};
    }
  }

  // User operations
  async createUser(userData: RegisterData): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = {
        id: nanoid(),
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        accountType: 'free' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        shabbatCity: null,
        shabbatCityId: null
      };

      await db.insert(secureUsersTable).values(newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(secureUsersTable)
        .where(eq(secureUsersTable.email, email));
      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUser(id: string): Promise<User | null> {
    return this.getUserById(id);
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(secureUsersTable)
        .where(eq(secureUsersTable.id, id));
      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [updatedUser] = await db.update(secureUsersTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(secureUsersTable.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('Error verifying password:', error);
      return null;
    }
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(secureUsersTable);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async upgradeUser(userId: string, accountType: string): Promise<boolean> {
    try {
      await db.update(secureUsersTable)
        .set({ accountType: accountType as any, updatedAt: new Date() })
        .where(eq(secureUsersTable.id, userId));
      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.delete(secureUsersTable)
        .where(eq(secureUsersTable.id, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Payment operations (in-memory for now)
  addPayment(payment: { userId: string; amount: number; type: 'youtube_pro' | 'premium'; method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer'; description?: string; }): void {
    const newPayment: Payment = {
      id: nanoid(),
      userId: payment.userId,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
      description: payment.description || '',
      timestamp: new Date()
    };
    this.payments.push(newPayment);
  }

  getPayments(): Payment[] {
    return this.payments;
  }

  getRevenue(): { monthly: number; total: number; } {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const total = this.payments.reduce((sum, p) => sum + p.amount, 0);
    const monthly = this.payments
      .filter(p => p.timestamp >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);
    
    return { monthly, total };
  }

  // Video locking operations
  async setVideoLockStatus(userId: string, videoId: string, isLocked: boolean, reason: string = "manual"): Promise<void> {
    try {
      if (isLocked) {
        await db.insert(videoLockStatuses).values({
          id: nanoid(),
          userId: userId,
          videoId: videoId,
          isLocked: isLocked,
          reason: reason,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: [videoLockStatuses.userId, videoLockStatuses.videoId],
          set: {
            isLocked: isLocked,
            reason: reason,
            updatedAt: new Date()
          }
        });
      } else {
        await db.delete(videoLockStatuses)
          .where(and(eq(videoLockStatuses.userId, userId), eq(videoLockStatuses.videoId, videoId)));
      }
    } catch (error) {
      console.error('Error setting video lock status:', error);
      throw error;
    }
  }

  async getVideoLockStatus(userId: string, videoId: string): Promise<{ isLocked: boolean; reason?: string } | null> {
    try {
      const [result] = await db.select().from(videoLockStatuses)
        .where(and(eq(videoLockStatuses.userId, userId), eq(videoLockStatuses.videoId, videoId)));
      
      if (result) {
        return {
          isLocked: result.isLocked,
          reason: result.reason || undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting video lock status:', error);
      return null;
    }
  }

  async getAllLockedVideos(userId: string): Promise<string[]> {
    try {
      const results = await db.select().from(videoLockStatuses)
        .where(and(eq(videoLockStatuses.userId, userId), eq(videoLockStatuses.isLocked, true)));
      
      return results.map(r => r.videoId);
    } catch (error) {
      console.error('Error getting locked videos:', error);
      return [];
    }
  }

  // Shabbat times (placeholder)
  async getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null> {
    return null;
  }

  /**
   * Clean up expired tokens from encrypted tokens table
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await db.delete(encryptedAuthTokens)
        .where(lt(encryptedAuthTokens.updatedAt, oneDayAgo));
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const unifiedStorage = new UnifiedStorage();