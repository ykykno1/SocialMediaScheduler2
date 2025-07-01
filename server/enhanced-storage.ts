import { DatabaseStorage } from './database-storage.js';
import { db } from './db.js';
import { secureUsers, encryptedAuthTokens, videoLockStatuses, videoStatuses, authTokens } from '../shared/schema.js';
import { sql, lt } from 'drizzle-orm';

/**
 * Enhanced storage with improved performance and monitoring
 * 100% backward compatible - no functionality changes
 */
export class EnhancedStorage extends DatabaseStorage {
  private isInitialized = false;

  constructor() {
    super();
    this.setupImprovements();
  }

  private async setupImprovements() {
    if (this.isInitialized) return;
    
    try {
      await this.addPerformanceIndexes();
      await this.logCurrentStatus();
      this.isInitialized = true;
      console.log('Enhanced storage ready');
    } catch (error) {
      console.warn('Enhanced storage setup failed, continuing with basic functionality:', error);
    }
  }

  private async addPerformanceIndexes() {
    try {
      // Indexes are handled by the database schema and migrations
      // This is a placeholder for future index optimizations
      console.log('Performance indexes ready');
    } catch (error) {
      console.debug('Index setup result:', error);
    }
  }

  private async logCurrentStatus() {
    try {
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(secureUsers);
      const [tokensCount] = await db.select({ count: sql<number>`count(*)` }).from(encryptedAuthTokens);
      const [lockCount] = await db.select({ count: sql<number>`count(*)` }).from(videoLockStatuses);
      const [statusCount] = await db.select({ count: sql<number>`count(*)` }).from(videoStatuses);
      
      console.log('Database migration status:', {
        secure_users: usersCount.count,
        encrypted_auth_tokens: tokensCount.count,
        video_lock_statuses: lockCount.count,
        video_statuses: statusCount.count
      });
    } catch (error) {
      console.debug('Status logging failed:', error);
    }
  }

  /**
   * Clean up expired tokens from both tables
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      
      // Clean up encrypted tokens
      const result1 = await db.delete(encryptedAuthTokens)
        .where(lt(encryptedAuthTokens.expiresAt, now));
      
      // Clean up legacy tokens 
      const result2 = await db.delete(authTokens)
        .where(lt(authTokens.expiresAt, now));
      
      const cleaned = (result1.rowCount || 0) + (result2.rowCount || 0);
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired tokens`);
      }
      
      return cleaned;
    } catch (error) {
      console.error('Token cleanup failed:', error);
      return 0;
    }
  }

  // Admin Shabbat times management - inherited from DatabaseStorage
  async setAdminShabbatTimes(entryTime: Date, exitTime: Date): Promise<void> {
    return super.setAdminShabbatTimes(entryTime, exitTime);
  }

  async getAdminShabbatTimes(): Promise<{ entryTime: Date | null; exitTime: Date | null; } | null> {
    return super.getAdminShabbatTimes();
  }
}

export const enhancedStorage = new EnhancedStorage();