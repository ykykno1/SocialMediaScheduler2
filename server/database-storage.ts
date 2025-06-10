import { db } from "./db";
import { users, authTokens, historyEntries, videoStatuses } from "@shared/schema";
import { eq, and } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  
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
      const [token] = await db.select().from(authTokens)
        .where(and(eq(authTokens.platform, platform), eq(authTokens.userId, userId)));
      
      if (!token) return null;

      return {
        platform: token.platform as SupportedPlatform,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken || undefined,
        expiresAt: token.expiresAt?.getTime(),
        timestamp: token.timestamp?.getTime() || Date.now(),
        userId: token.userId,
        additionalData: token.additionalData ? JSON.parse(token.additionalData) : undefined
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async saveAuthToken(token: AuthToken, userId: string): Promise<AuthToken> {
    try {
      const validatedToken = authSchema.parse(token);
      
      // Delete existing token for this platform and user
      await db.delete(authTokens)
        .where(and(eq(authTokens.platform, token.platform), eq(authTokens.userId, userId)));

      // Insert new token
      await db.insert(authTokens).values({
        id: nanoid(),
        userId,
        platform: token.platform,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
        timestamp: new Date(),
        additionalData: token.additionalData ? JSON.stringify(token.additionalData) : null
      });

      return validatedToken;
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  async removeAuthToken(platform: SupportedPlatform, userId: string): Promise<void> {
    try {
      await db.delete(authTokens)
        .where(and(eq(authTokens.platform, platform), eq(authTokens.userId, userId)));
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Legacy Facebook-specific auth (kept for backward compatibility)
  getFacebookAuth(userId?: string): FacebookAuth | null {
    // This would need to be implemented if Facebook auth is still needed
    return null;
  }

  saveFacebookAuth(token: FacebookAuth, userId?: string): FacebookAuth {
    // This would need to be implemented if Facebook auth is still needed
    return token;
  }

  removeFacebookAuth(userId?: string): void {
    // This would need to be implemented if Facebook auth is still needed
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
      const [user] = await db.select().from(users).where(eq(users.email, email));
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
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [user] = await db.update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      return user;
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
      return await db.select().from(users);
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

      await db.update(users)
        .set({ accountType: accountType as 'free' | 'youtube_pro' | 'premium', updatedAt: new Date() })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, userId));
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

  // Shabbat times operations
  async getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null> {
    // This would use the same Hebcal API implementation as before
    return null;
  }
}

export const storage = new DatabaseStorage();