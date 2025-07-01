import { db } from "./db";
import { users, secureUsers as secureUsersTable, encryptedAuthTokens, historyEntries, videoStatuses, videoLockStatuses } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
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
import { IStorage } from "./storage";

export class DatabaseStorage {
  
  // Settings operations
  getSettings(): Settings {
    // For now, return default settings - could be enhanced to store per-user settings
    return settingsSchema.parse({});
  }

  saveSettings(settings: Settings): Settings {
    // For now, just return the settings - could be enhanced to store per-user settings
    return settings;
  }

  // Generic auth token operations
  async getAuthToken(platform: SupportedPlatform, userId: string): Promise<AuthToken | null> {
    try {
      // First try encrypted tokens table
      const [encryptedToken] = await db.select().from(encryptedAuthTokens)
        .where(and(eq(encryptedAuthTokens.platform, platform), eq(encryptedAuthTokens.userId, userId)));
      
      if (encryptedToken) {
        let accessToken: string;
        let refreshToken: string | undefined;
        
        // Use legacy tokens for reliability during migration period
        if (encryptedToken.legacyAccessToken) {
          accessToken = encryptedToken.legacyAccessToken;
          refreshToken = encryptedToken.legacyRefreshToken || undefined;
        } else if (encryptedToken.encryptedAccessToken && encryptedToken.encryptionMetadata) {
          // Only try decryption if no legacy tokens
          try {
            const { tokenEncryption } = await import('./encryption.js');
            accessToken = tokenEncryption.decryptFromStorage(
              encryptedToken.encryptedAccessToken, 
              encryptedToken.encryptionMetadata
            );
            
            if (encryptedToken.encryptedRefreshToken) {
              refreshToken = tokenEncryption.decryptFromStorage(
                encryptedToken.encryptedRefreshToken,
                encryptedToken.encryptionMetadata
              );
            }
          } catch (decryptError) {
            console.warn('Failed to decrypt token, removing corrupted entry:', decryptError);
            await db.delete(encryptedAuthTokens)
              .where(and(eq(encryptedAuthTokens.platform, platform), eq(encryptedAuthTokens.userId, userId)));
            return null;
          }
        } else {
          // Use legacy tokens if no encrypted version exists yet
          accessToken = encryptedToken.legacyAccessToken || '';
          refreshToken = encryptedToken.legacyRefreshToken || undefined;
        }
        
        if (accessToken) {
          return {
            platform: encryptedToken.platform as SupportedPlatform,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: encryptedToken.expiresAt?.getTime(),
            timestamp: encryptedToken.createdAt?.getTime() || Date.now(),
            userId: encryptedToken.userId,
            additionalData: undefined
          };
        }
      }
      
      // No token found
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async saveAuthToken(token: AuthToken, userId: string): Promise<AuthToken> {
    try {
      const validatedToken = authSchema.parse(token);
      const { tokenEncryption } = await import('./encryption.js');
      
      // Delete existing token from encrypted table
      await db.delete(encryptedAuthTokens)
        .where(and(eq(encryptedAuthTokens.platform, token.platform), eq(encryptedAuthTokens.userId, userId)));

      // Encrypt the tokens
      const encryptedAccessToken = tokenEncryption.encryptForStorage(token.accessToken);
      let encryptedRefreshToken = null;
      
      if (token.refreshToken) {
        encryptedRefreshToken = tokenEncryption.encryptForStorage(token.refreshToken);
      }

      // Insert new token into encrypted table with real encryption
      await db.insert(encryptedAuthTokens).values({
        id: nanoid(),
        userId,
        platform: token.platform,
        encryptedAccessToken: encryptedAccessToken.encryptedToken,
        encryptedRefreshToken: encryptedRefreshToken?.encryptedToken || null,
        tokenHash: encryptedAccessToken.tokenHash,
        encryptionMetadata: encryptedAccessToken.metadata,
        expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
        scopes: null,
        encryptionKeyVersion: 1,
        createdAt: new Date(),
        lastUsed: new Date(),
        legacyAccessToken: token.accessToken, // Keep for fallback during migration
        legacyRefreshToken: token.refreshToken || null,
        migrationStatus: 'migrated'
      });

      return validatedToken;
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  async removeAuthToken(platform: SupportedPlatform, userId: string): Promise<void> {
    try {
      // Remove from encrypted tokens table
      await db.delete(encryptedAuthTokens)
        .where(and(eq(encryptedAuthTokens.platform, platform), eq(encryptedAuthTokens.userId, userId)));
        
      // Legacy table no longer exists - only use encrypted tokens
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Legacy Facebook-specific auth (kept for backward compatibility)
  async getFacebookAuth(userId?: string): Promise<FacebookAuth | null> {
    if (!userId) return null;
    
    try {
      const token = await this.getAuthToken('facebook', userId);
      if (!token) return null;

      return {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn || 3600,
        timestamp: token.timestamp,
        userId: token.userId,
        isManualToken: token.isManualToken
      };
    } catch (error) {
      console.error('Error getting Facebook auth:', error);
      return null;
    }
  }

  async saveFacebookAuth(token: FacebookAuth, userId?: string): Promise<FacebookAuth> {
    if (!userId) throw new Error('User ID is required');

    try {
      const authToken: AuthToken = {
        platform: 'facebook',
        accessToken: token.accessToken,
        refreshToken: undefined,
        expiresIn: token.expiresIn,
        expiresAt: token.expiresIn ? Date.now() + (token.expiresIn * 1000) : undefined,
        timestamp: token.timestamp,
        userId: token.userId,
        isManualToken: token.isManualToken
      };

      await this.saveAuthToken(authToken, userId);
      return token;
    } catch (error) {
      console.error('Error saving Facebook auth:', error);
      throw error;
    }
  }

  async removeFacebookAuth(userId?: string): Promise<void> {
    if (!userId) return;
    
    try {
      await this.removeAuthToken('facebook', userId);
    } catch (error) {
      console.error('Error removing Facebook auth:', error);
    }
  }

  // History operations
  getHistoryEntries(platform?: SupportedPlatform): HistoryEntry[] {
    // This would need async implementation
    return [];
  }

  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
    // This would need async implementation
    const newEntry = { ...entry, id: nanoid() };
    return newEntry;
  }

  // Facebook content operations (for backward compatibility)
  getCachedPosts(): FacebookPost[] {
    return [];
  }

  saveCachedPosts(posts: FacebookPost[]): void {
    // Implementation not needed for current scope
  }

  clearCachedPosts(): void {
    // Implementation not needed for current scope
  }

  getCachedPages(): FacebookPage[] {
    return [];
  }

  saveCachedPages(pages: FacebookPage[]): void {
    // Implementation not needed for current scope
  }

  clearCachedPages(): void {
    // Implementation not needed for current scope
  }

  // Privacy status backup operations (for restoring content)
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[], userId?: string): void {
    // Implementation not needed for current scope
  }

  getPrivacyStatuses(platform: SupportedPlatform, userId?: string): PrivacyStatus[] {
    return [];
  }

  clearPrivacyStatuses(platform: SupportedPlatform, userId?: string): void {
    // Implementation not needed for current scope
  }

  updatePrivacyStatus(platform: SupportedPlatform, contentId: string, updates: Partial<PrivacyStatus>, userId?: string): void {
    // Implementation not needed for current scope
  }

  // Video original status operations (for Shabbat restore)
  async saveVideoOriginalStatus(videoId: string, originalStatus: string, userId: string): Promise<void> {
    try {
      await db.insert(videoStatuses).values({
        id: nanoid(),
        userId,
        videoId,
        originalStatus
      });
    } catch (error) {
      console.error('Error saving video original status:', error);
    }
  }

  async getVideoOriginalStatus(videoId: string, userId: string): Promise<string | null> {
    try {
      const [status] = await db.select().from(videoStatuses)
        .where(and(eq(videoStatuses.videoId, videoId), eq(videoStatuses.userId, userId)));
      
      return status?.originalStatus || null;
    } catch (error) {
      console.error('Error getting video original status:', error);
      return null;
    }
  }

  async clearVideoOriginalStatus(videoId: string, userId: string): Promise<void> {
    try {
      await db.delete(videoStatuses)
        .where(and(eq(videoStatuses.videoId, videoId), eq(videoStatuses.userId, userId)));
    } catch (error) {
      console.error('Error clearing video original status:', error);
    }
  }

  async getAllVideoOriginalStatuses(userId: string): Promise<Record<string, string>> {
    try {
      const statuses = await db.select().from(videoStatuses)
        .where(eq(videoStatuses.userId, userId));
      
      const result: Record<string, string> = {};
      statuses.forEach(status => {
        result[status.videoId] = status.originalStatus;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting all video original statuses:', error);
      return {};
    }
  }

  // User operations
  async createUser(userData: RegisterData): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const [user] = await db.insert(users).values({
        id: nanoid(),
        email: userData.email,
        password: hashedPassword,
        username: userData.username || userData.email.split('@')[0],
        accountType: 'free'
      }).returning();

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [secureUser] = await db.select().from(secureUsersTable).where(eq(secureUsersTable.email, email));
      
      if (!secureUser) {
        return null;
      }

      // Map secure user fields to legacy User format
      const user = {
        id: secureUser.id,
        email: secureUser.email,
        username: secureUser.username,
        password: secureUser.passwordHash, // Map password_hash to password
        accountType: secureUser.accountTier as 'free' | 'youtube_pro' | 'premium',
        shabbatCity: secureUser.shabbatCity,
        shabbatCityId: secureUser.shabbatCityId,
        hideTimingPreference: (secureUser as any).hideTimingPreference || '1hour',
        restoreTimingPreference: (secureUser as any).restoreTimingPreference || 'immediate',
        createdAt: secureUser.createdAt,
        updatedAt: secureUser.updatedAt
      };
      
      return user;
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
      const [secureUser] = await db.select().from(secureUsersTable).where(eq(secureUsersTable.id, id));
      
      if (!secureUser) {
        return null;
      }

      // Map secure user fields to legacy User format
      const user = {
        id: secureUser.id,
        email: secureUser.email,
        username: secureUser.username,
        password: secureUser.passwordHash, // Map password_hash to password
        accountType: secureUser.accountTier as 'free' | 'youtube_pro' | 'premium',
        shabbatCity: secureUser.shabbatCity,
        shabbatCityId: secureUser.shabbatCityId,
        hideTimingPreference: (secureUser as any).hideTimingPreference || '1hour',
        restoreTimingPreference: (secureUser as any).restoreTimingPreference || 'immediate',
        createdAt: secureUser.createdAt,
        updatedAt: secureUser.updatedAt
      };
      
      return user;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      // Map legacy User fields to secure_users fields
      const secureUpdates: any = {};
      
      if (updates.email) secureUpdates.email = updates.email;
      if (updates.username) secureUpdates.username = updates.username;
      if (updates.password) secureUpdates.passwordHash = updates.password;
      if (updates.accountType) secureUpdates.accountTier = updates.accountType;
      if (updates.shabbatCity) secureUpdates.shabbatCity = updates.shabbatCity;
      if (updates.shabbatCityId) secureUpdates.shabbatCityId = updates.shabbatCityId;
      if (updates.hideTimingPreference) secureUpdates.hideTimingPreference = updates.hideTimingPreference;
      if (updates.restoreTimingPreference) secureUpdates.restoreTimingPreference = updates.restoreTimingPreference;
      secureUpdates.updatedAt = new Date();

      const [secureUser] = await db.update(secureUsersTable)
        .set(secureUpdates)
        .where(eq(secureUsersTable.id, id))
        .returning();

      if (!secureUser) {
        throw new Error('User not found');
      }

      // Return in legacy User format
      return {
        id: secureUser.id,
        email: secureUser.email,
        username: secureUser.username,
        password: secureUser.passwordHash,
        accountType: secureUser.accountTier as 'free' | 'youtube_pro' | 'premium',
        shabbatCity: secureUser.shabbatCity,
        shabbatCityId: secureUser.shabbatCityId,
        hideTimingPreference: (secureUser as any).hideTimingPreference || '1hour',
        restoreTimingPreference: (secureUser as any).restoreTimingPreference || 'immediate',
        createdAt: secureUser.createdAt,
        updatedAt: secureUser.updatedAt
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user || !user.password) return null;

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
      const secureUserList = await db.select().from(secureUsersTable);
      
      // Map all secure users to legacy User format
      return secureUserList.map(secureUser => ({
        id: secureUser.id,
        email: secureUser.email,
        username: secureUser.username,
        password: secureUser.passwordHash, // Map password_hash to password
        accountType: secureUser.accountTier as 'free' | 'youtube_pro' | 'premium',
        shabbatCity: null,
        shabbatCityId: null,
        createdAt: secureUser.createdAt,
        updatedAt: secureUser.updatedAt
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async upgradeUser(userId: string, accountType: string): Promise<boolean> {
    try {
      const validTypes = ['free', 'youtube_pro', 'premium'];
      if (!validTypes.includes(accountType)) {
        return false;
      }

      await db.update(secureUsersTable)
        .set({ accountTier: accountType as 'free' | 'youtube_pro' | 'premium', updatedAt: new Date() })
        .where(eq(secureUsersTable.id, userId));

      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.delete(secureUsersTable).where(eq(secureUsersTable.id, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Payment tracking operations
  addPayment(payment: { userId: string; amount: number; type: 'youtube_pro' | 'premium'; method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer'; description?: string; }): void {
    // Implementation not needed for current scope
  }

  getPayments(): Payment[] {
    return [];
  }

  getRevenue(): { monthly: number; total: number; } {
    return { monthly: 0, total: 0 };
  }

  // Video lock status operations
  async setVideoLockStatus(userId: string, videoId: string, isLocked: boolean, reason: string = "manual"): Promise<void> {
    try {
      const existingLock = await db.select().from(videoLockStatuses)
        .where(and(
          eq(videoLockStatuses.userId, userId),
          eq(videoLockStatuses.videoId, videoId),
          eq(videoLockStatuses.platform, 'youtube')
        ));

      if (existingLock.length > 0) {
        // Update existing lock status
        await db.update(videoLockStatuses)
          .set({ 
            isLocked, 
            lockedReason: reason,
            updatedAt: new Date()
          })
          .where(and(
            eq(videoLockStatuses.userId, userId),
            eq(videoLockStatuses.videoId, videoId)
          ));
      } else {
        // Create new lock status
        await db.insert(videoLockStatuses).values({
          id: nanoid(),
          userId,
          videoId,
          platform: 'youtube',
          isLocked,
          lockedReason: reason
        });
      }
    } catch (error) {
      console.error('Error setting video lock status:', error);
      throw error;
    }
  }

  async getVideoLockStatus(userId: string, videoId: string): Promise<{ isLocked: boolean; reason?: string } | null> {
    try {
      const [lockStatus] = await db.select().from(videoLockStatuses)
        .where(and(
          eq(videoLockStatuses.userId, userId),
          eq(videoLockStatuses.videoId, videoId),
          eq(videoLockStatuses.platform, 'youtube')
        ));

      if (!lockStatus) {
        return { isLocked: false };
      }

      return {
        isLocked: lockStatus.isLocked,
        reason: lockStatus.lockedReason || undefined
      };
    } catch (error) {
      console.error('Error getting video lock status:', error);
      return null;
    }
  }

  async getAllLockedVideos(userId: string): Promise<string[]> {
    try {
      const lockedVideos = await db.select().from(videoLockStatuses)
        .where(and(
          eq(videoLockStatuses.userId, userId),
          eq(videoLockStatuses.isLocked, true),
          eq(videoLockStatuses.platform, 'youtube')
        ));

      return lockedVideos.map(lock => lock.videoId);
    } catch (error) {
      console.error('Error getting all locked videos:', error);
      return [];
    }
  }

  // Shabbat times operations
  async getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null> {
    // This would use the same Hebcal API implementation as before
    return null;
  }

  // Admin Shabbat times management for testing
  async setAdminShabbatTimes(entryTime: Date, exitTime: Date): Promise<void> {
    await db.execute(sql`
      UPDATE shabbat_locations 
      SET manual_entry_time = ${entryTime}, manual_exit_time = ${exitTime}, updated_at = NOW()
      WHERE id = 'admin'
    `);
  }

  async getAdminShabbatTimes(): Promise<{ entryTime: Date | null; exitTime: Date | null; } | null> {
    const result = await db.execute(sql`
      SELECT manual_entry_time, manual_exit_time 
      FROM shabbat_locations 
      WHERE id = 'admin'
    `);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      entryTime: row.manual_entry_time,
      exitTime: row.manual_exit_time
    };
  }
}

export const storage = new DatabaseStorage();