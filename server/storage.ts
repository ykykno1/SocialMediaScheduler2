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
import { nanoid } from 'nanoid';

// Interface for storage operations
export interface IStorage {
  // Settings operations
  getSettings(): Settings;
  saveSettings(settings: Settings): Settings;

  // Generic auth token operations
  getAuthToken(platform: SupportedPlatform, userId: string): AuthToken | null;
  saveAuthToken(token: AuthToken, userId: string): Promise<AuthToken>;
  removeAuthToken(platform: SupportedPlatform, userId: string): void;

  // Legacy Facebook-specific auth (kept for backward compatibility)
  getFacebookAuth(userId?: string): FacebookAuth | null;
  saveFacebookAuth(token: FacebookAuth, userId?: string): FacebookAuth;
  removeFacebookAuth(userId?: string): void;

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

  // Video original status operations (for Shabbat restore)
  saveVideoOriginalStatus(videoId: string, originalStatus: string, userId: string): void;
  getVideoOriginalStatus(videoId: string, userId: string): string | null;
  clearVideoOriginalStatus(videoId: string, userId: string): void;
  getAllVideoOriginalStatuses(userId: string): Record<string, string>;

  // User operations
  createUser(userData: RegisterData): User;
  getUserByEmail(email: string): User | null;
  getUser(id: string): User | null;
  getUserById(id: string): User | null;
  updateUser(id: string, updates: Partial<User>): User;
  updateUserShabbatLocation(id: string, cityName: string, cityId: string): User;
  verifyPassword(email: string, password: string): User | null;

  // Admin operations
  getAllUsers(): User[];
  upgradeUser(userId: string, accountType: string): boolean;
  deleteUser(userId: string): boolean;

  // Payment tracking operations
  addPayment(payment: { userId: string; amount: number; type: 'youtube_pro' | 'premium'; method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer'; description?: string; }): void;
  getPayments(): Payment[];
  getRevenue(): { monthly: number; total: number; };

  // Shabbat times operations
  getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null>;
  cacheShabbatTimes(times: ShabbatTimes): void;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private settings: Settings;
  // User-specific data storage
  private userAuthTokens: Map<string, Record<SupportedPlatform, AuthToken | null>> = new Map();
  private userFacebookAuth: Map<string, FacebookAuth | null> = new Map();
  private userHistoryEntries: Map<string, HistoryEntry[]> = new Map();
  private userCachedPosts: Map<string, FacebookPost[]> = new Map();
  private userCachedPages: Map<string, FacebookPage[]> = new Map();
  private userCachedYouTubeVideos: Map<string, YouTubeVideo[]> = new Map();
  private userPrivacyStatuses: Map<string, Record<SupportedPlatform, PrivacyStatus[]>> = new Map();
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private shabbatTimesCache: Map<string, ShabbatTimes> = new Map();
  private payments: Payment[] = [];
  private userVideoOriginalStatuses: Map<string, Map<string, string>> = new Map(); // userId -> Map<videoId, originalPrivacyStatus>

  constructor() {
    // Initialize with default settings
    this.settings = settingsSchema.parse({});
    
    // Initialize database connections after a short delay
    setTimeout(() => {
      this.initializeDatabaseConnection();
    }, 1000);
  }

  private async initializeDatabaseConnection(): Promise<void> {
    try {
      console.log('STORAGE_INIT: Initializing database connection and loading tokens...');
      
      // Import database dependencies
      const { db } = await import('./db');
      const { authTokens } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Load all Facebook auth tokens from database
      const allTokens = await db.select()
        .from(authTokens)
        .where(eq(authTokens.platform, 'facebook'));
      
      console.log(`STORAGE_INIT: Found ${allTokens.length} Facebook tokens in database`);
      
      for (const token of allTokens) {
        try {
          let additionalData: any = {};
          if (token.additionalData) {
            additionalData = JSON.parse(token.additionalData);
          }
          
          const facebookAuth: FacebookAuth = {
            accessToken: token.accessToken,
            expiresIn: 3600,
            timestamp: token.timestamp?.getTime() || Date.now(),
            userId: additionalData.userId || '',
            pageAccess: additionalData.pageAccess || false,
            isManualToken: !!additionalData.isManualToken
          };
          
          this.userFacebookAuth.set(token.userId, facebookAuth);
          console.log(`STORAGE_INIT: Loaded Facebook token for user ${token.userId}`);
        } catch (error) {
          console.error(`STORAGE_INIT: Failed to load token for user ${token.userId}:`, error);
        }
      }
      
      console.log(`STORAGE_INIT: Successfully loaded ${this.userFacebookAuth.size} Facebook tokens into memory`);
    } catch (error) {
      console.error('STORAGE_INIT: Failed to initialize database connection:', error);
    }
  }

  // Settings operations
  getSettings(): Settings {
    return this.settings;
  }

  saveSettings(settings: Settings): Settings {
    this.settings = settings;
    return this.settings;
  }

  // Generic auth token operations (user-specific)
  getAuthToken(platform: SupportedPlatform, userId?: string): AuthToken | null {
    if (!userId) return null;
    const userTokens = this.userAuthTokens.get(userId);
    return userTokens?.[platform] || null;
  }

  async saveAuthToken(token: AuthToken, userId?: string): Promise<AuthToken> {
    if (!userId) throw new Error('User ID required for saving auth token');

    const validatedToken = authSchema.parse(token);

    // Save to memory
    let userTokens = this.userAuthTokens.get(userId);
    if (!userTokens) {
      userTokens = { facebook: null, youtube: null, tiktok: null, instagram: null };
      this.userAuthTokens.set(userId, userTokens);
    }
    userTokens[token.platform] = validatedToken;

    // Save to database
    try {
      const { db } = await import('./db');
      const { authTokens } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');

      // First delete existing token
      await db.delete(authTokens)
        .where(and(
          eq(authTokens.userId, userId),
          eq(authTokens.platform, token.platform)
        ));

      // Then insert new token
      await db.insert(authTokens).values({
        id: `${token.platform}_${userId}_${Date.now()}`,
        platform: token.platform,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
        timestamp: new Date(token.timestamp),
        userId: userId,
        additionalData: token.additionalData ? JSON.stringify({
          ...token.additionalData,
          expiresIn: token.expiresIn,
          isManualToken: token.isManualToken
        }) : JSON.stringify({
          expiresIn: token.expiresIn,
          isManualToken: token.isManualToken
        })
      });

      console.log(`Saved ${token.platform} token to database for user: ${userId}`);
    } catch (error) {
      console.error(`Error saving ${token.platform} token to database:`, error);
    }

    // Sync with legacy Facebook auth if applicable
    if (token.platform === 'facebook') {
      this.userFacebookAuth.set(userId, {
        accessToken: token.accessToken,
        expiresIn: token.expiresIn || 0,
        timestamp: token.timestamp,
        userId: token.userId,
        isManualToken: token.isManualToken
      });
    }

    return validatedToken;
  }

  removeAuthToken(platform: SupportedPlatform, userId?: string): void {
    if (!userId) return;

    const userTokens = this.userAuthTokens.get(userId);
    if (userTokens) {
      userTokens[platform] = null;
    }

    // Sync with legacy Facebook auth if applicable
    if (platform === 'facebook') {
      this.userFacebookAuth.set(userId, null);
    }
  }



  // Legacy Facebook-specific auth (user-specific)
  getFacebookAuth(userId?: string): FacebookAuth | null {
    console.log(`SYNC_FB_AUTH: Getting auth for userId=${userId}`);
    console.log(`SYNC_FB_AUTH: Memory map keys: [${Array.from(this.userFacebookAuth.keys()).join(', ')}]`);
    console.log(`SYNC_FB_AUTH: Memory map size: ${this.userFacebookAuth.size}`);
    
    if (!userId) {
      console.log('SYNC_FB_AUTH: No userId provided');
      return null;
    }
    
    // Check memory first
    const memoryAuth = this.userFacebookAuth.get(userId);
    console.log(`SYNC_FB_AUTH: Memory lookup for "${userId}" result: ${!!memoryAuth}`);
    if (memoryAuth) {
      console.log('SYNC_FB_AUTH: Found in memory, returning token');
      return memoryAuth;
    }
    
    console.log('SYNC_FB_AUTH: Not in memory, returning null');
    return null;
  }

  async saveFacebookAuth(token: FacebookAuth, userId?: string): Promise<FacebookAuth> {
    if (!userId) throw new Error('User ID required for saving Facebook auth');

    console.log(`Saving Facebook auth for user: ${userId}`);
    console.log('Token to save:', { accessToken: token.accessToken.substring(0, 20) + '...', expiresIn: token.expiresIn });

    const validatedToken = facebookAuthSchema.parse(token);
    
    // Save to memory storage for immediate access
    this.userFacebookAuth.set(userId, validatedToken);
    
    // Save to database immediately
    console.log('SYNC_SAVE_FB: Starting immediate database save...');
    try {
      await this.saveFacebookAuthAsync(validatedToken, userId);
      console.log('SYNC_SAVE_FB: Database save completed successfully');
    } catch (error) {
      console.error('SYNC_SAVE_FB: Database save failed:', error);
    }
    
    console.log(`Facebook auth saved successfully for user: ${userId}`);
    console.log('Users with Facebook auth after save:', Array.from(this.userFacebookAuth.keys()));
    
    // Immediate verification - try to read what we just saved
    const verification = this.userFacebookAuth.get(userId);
    console.log(`Immediate verification - can we read the token we just saved? ${!!verification}`);

    // Sync with generic auth
    let userTokens = this.userAuthTokens.get(userId);
    if (!userTokens) {
      userTokens = { facebook: null, youtube: null, tiktok: null, instagram: null };
      this.userAuthTokens.set(userId, userTokens);
    }
    userTokens.facebook = {
      platform: 'facebook',
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      timestamp: token.timestamp,
      userId: token.userId,
      isManualToken: token.isManualToken
    };

    return validatedToken;
  }

  private async loadFacebookAuthFromDatabase(userId: string): Promise<void> {
    try {
      console.log(`SYNC_FB_AUTH: Loading from database for userId=${userId}`);
      
      const { db } = await import('./db');
      const { authTokens } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const authToken = await db.select()
        .from(authTokens)
        .where(and(eq(authTokens.userId, userId), eq(authTokens.platform, 'facebook')))
        .limit(1);

      if (authToken.length > 0) {
        const token = authToken[0];
        // Parse additionalData safely
        let additionalData: any = {};
        try {
          if (token.additionalData) {
            additionalData = JSON.parse(token.additionalData);
          }
        } catch (e) {
          console.warn('Failed to parse additionalData:', e);
        }

        const facebookAuth: FacebookAuth = {
          accessToken: token.accessToken,
          expiresIn: 3600, // Default value since it's not stored separately
          timestamp: token.timestamp?.getTime() || Date.now(),
          userId: additionalData.userId || '',
          pageAccess: additionalData.pageAccess || false,
          isManualToken: !!additionalData.isManualToken
        };
        
        console.log(`SYNC_FB_AUTH: Loaded from database, setting in memory`);
        this.userFacebookAuth.set(userId, facebookAuth);
      } else {
        console.log(`SYNC_FB_AUTH: No token found in database`);
      }
    } catch (error) {
      console.error('SYNC_FB_AUTH: Database load error:', error);
    }
  }

  private async saveFacebookAuthAsync(token: FacebookAuth, userId: string): Promise<void> {
    try {
      console.log('ASYNC_DB_SAVE: Starting database save...');
      const { db } = await import('./db');
      const { authTokens } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const tokenData = {
        id: `fb_${userId}_${Date.now()}`,
        userId: userId,
        platform: 'facebook' as const,
        accessToken: token.accessToken,
        refreshToken: null,
        expiresAt: token.expiresIn ? new Date(Date.now() + (token.expiresIn * 1000)) : null,
        timestamp: new Date(token.timestamp || Date.now()),
        additionalData: JSON.stringify({
          facebookUserId: token.userId,
          pageAccess: token.pageAccess || false,
          isManualToken: token.isManualToken || false
        })
      };
      
      // Try update first, then insert
      const updateResult = await db.update(authTokens)
        .set(tokenData)
        .where(and(
          eq(authTokens.userId, userId),
          eq(authTokens.platform, 'facebook')
        ))
        .returning();
      
      if (updateResult.length === 0) {
        await db.insert(authTokens).values(tokenData);
        console.log('ASYNC_DB_SAVE: Inserted new token');
      } else {
        console.log('ASYNC_DB_SAVE: Updated existing token');
      }
    } catch (error) {
      console.error('ASYNC_DB_SAVE: Database save failed:', error);
    }
  }

  removeFacebookAuth(userId?: string): void {
    if (!userId) return;
    
    console.log(`Removing Facebook auth for user: ${userId}`);
    
    // Remove from memory
    this.userFacebookAuth.delete(userId);

    const userTokens = this.userAuthTokens.get(userId);
    if (userTokens) {
      userTokens.facebook = null;
    }
    
    // Remove from database asynchronously
    this.removeFacebookAuthFromDatabase(userId).catch(error => {
      console.error('Failed to remove Facebook auth from database:', error);
    });
    
    console.log(`Facebook auth removed for user: ${userId}`);
  }

  private async removeFacebookAuthFromDatabase(userId: string): Promise<void> {
    try {
      console.log(`Removing Facebook auth from database for user: ${userId}`);
      
      const { db } = await import('./db');
      const { authTokens } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');

      await db.delete(authTokens)
        .where(and(
          eq(authTokens.userId, userId),
          eq(authTokens.platform, 'facebook')
        ));
      
      console.log(`Facebook auth removed from database for user: ${userId}`);
    } catch (error) {
      console.error(`Error removing Facebook auth from database for user ${userId}:`, error);
      throw error;
    }
  }

  // History operations (user-specific)
  getHistoryEntries(platform?: SupportedPlatform, userId?: string): HistoryEntry[] {
    if (!userId) return [];
    const userHistory = this.userHistoryEntries.get(userId) || [];
    if (!platform) {
      return userHistory;
    }

    return userHistory.filter(entry => entry.platform === platform);
  }

  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>, userId?: string): HistoryEntry {
    if (!userId) throw new Error('User ID required for adding history entry');

    const newEntry: HistoryEntry = {
      ...entry,
      id: nanoid()
    };

    let userHistory = this.userHistoryEntries.get(userId) || [];
    userHistory.unshift(newEntry); // Add to beginning for newest first

    // Keep only the last 100 entries per user
    if (userHistory.length > 100) {
      userHistory = userHistory.slice(0, 100);
    }

    this.userHistoryEntries.set(userId, userHistory);
    return newEntry;
  }

  // Facebook content operations (user-specific)
  getCachedPosts(userId?: string): FacebookPost[] {
    if (!userId) return [];
    return this.userCachedPosts.get(userId) || [];
  }

  saveCachedPosts(posts: FacebookPost[], userId?: string): void {
    if (!userId) return;
    this.userCachedPosts.set(userId, posts);
  }

  clearCachedPosts(userId?: string): void {
    if (!userId) return;
    this.userCachedPosts.set(userId, []);
  }

  getCachedPages(userId?: string): FacebookPage[] {
    if (!userId) return [];
    return this.userCachedPages.get(userId) || [];
  }

  saveCachedPages(pages: FacebookPage[], userId?: string): void {
    if (!userId) return;
    this.userCachedPages.set(userId, pages);
  }

  clearCachedPages(userId?: string): void {
    if (!userId) return;
    this.userCachedPages.set(userId, []);
  }

  // YouTube content operations (user-specific)
  getCachedYouTubeVideos(userId?: string): YouTubeVideo[] {
    if (!userId) return [];
    return this.userCachedYouTubeVideos.get(userId) || [];
  }

  saveCachedYouTubeVideos(videos: YouTubeVideo[], userId?: string): void {
    if (!userId) return;
    this.userCachedYouTubeVideos.set(userId, videos);
  }

  clearCachedYouTubeVideos(userId?: string): void {
    if (!userId) return;
    this.userCachedYouTubeVideos.set(userId, []);
  }

  // Privacy status backup operations (user-specific)
  savePrivacyStatuses(platform: SupportedPlatform, statuses: PrivacyStatus[], userId?: string): void {
    if (!userId) return;
    let userStatuses = this.userPrivacyStatuses.get(userId);
    if (!userStatuses) {
      userStatuses = { facebook: [], youtube: [], tiktok: [], instagram: [] };
      this.userPrivacyStatuses.set(userId, userStatuses);
    }
    userStatuses[platform] = statuses;
  }

  getPrivacyStatuses(platform: SupportedPlatform, userId?: string): PrivacyStatus[] {
    if (!userId) return [];
    const userStatuses = this.userPrivacyStatuses.get(userId);
    return userStatuses?.[platform] || [];
  }

  clearPrivacyStatuses(platform: SupportedPlatform, userId?: string): void {
    if (!userId) return;
    let userStatuses = this.userPrivacyStatuses.get(userId);
    if (!userStatuses) {
      userStatuses = { facebook: [], youtube: [], tiktok: [], instagram: [] };
      this.userPrivacyStatuses.set(userId, userStatuses);
    }
    userStatuses[platform] = [];
  }

  // Update or add a single privacy status (user-specific)
  updatePrivacyStatus(platform: SupportedPlatform, contentId: string, updates: Partial<PrivacyStatus>, userId?: string): void {
    if (!userId) return;
    const statuses = this.getPrivacyStatuses(platform, userId);
    const existingIndex = statuses.findIndex(s => s.contentId === contentId);

    if (existingIndex >= 0) {
      statuses[existingIndex] = { ...statuses[existingIndex], ...updates, lastModified: Date.now() };
    } else {
      const newStatus: PrivacyStatus = {
        platform,
        contentId,
        originalStatus: 'public',
        currentStatus: 'public',
        wasHiddenByUser: false,
        isLockedByUser: false,
        timestamp: Date.now(),
        ...updates
      };
      statuses.push(newStatus);
    }

    this.savePrivacyStatuses(platform, statuses, userId);
  }

  // Toggle lock status for a specific piece of content (user-specific)
  toggleContentLock(platform: SupportedPlatform, contentId: string, userId?: string): boolean {
    if (!userId) return false;
    const statuses = this.getPrivacyStatuses(platform, userId);
    const status = statuses.find(s => s.contentId === contentId);

    if (status) {
      status.isLockedByUser = !status.isLockedByUser;
      status.lastModified = Date.now();
      this.savePrivacyStatuses(platform, statuses, userId);
      return status.isLockedByUser;
    }

    return false;
  }

  // Get a specific privacy status (user-specific)
  getPrivacyStatus(platform: SupportedPlatform, contentId: string, userId?: string): PrivacyStatus | null {
    if (!userId) return null;
    const statuses = this.getPrivacyStatuses(platform, userId);
    return statuses.find(s => s.contentId === contentId) || null;
  }

  // User operations
  createUser(userData: RegisterData): User {
    const userId = nanoid();
    const user: User = {
      id: userId,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      accountType: 'free',
      shabbatCity: 'ירושלים',
      shabbatCityId: '247',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(userId, user);
    this.usersByEmail.set(userData.email, userId);
    return user;
  }

  getUserByEmail(email: string): User | null {
    const userId = this.usersByEmail.get(email);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  getUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  updateUser(id: string, updates: Partial<User>): User {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);

    // Update email index if email changed
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email);
      this.usersByEmail.set(updates.email, id);
    }

    return updatedUser;
  }

  updateUserShabbatLocation(id: string, cityName: string, cityId: string): User {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    const updatedUser = { 
      ...user, 
      shabbatCity: cityName, 
      shabbatCityId: cityId, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);

    return updatedUser;
  }

  verifyPassword(email: string, password: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user || !user.password) return null;

    // Simple password comparison (in production, use bcrypt)
    if (user.password === password) {
      return user;
    }

    return null;
  }

  // Shabbat times operations
  async getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null> {
    const cacheKey = `${latitude},${longitude}`;
    const cached = this.shabbatTimesCache.get(cacheKey);

    if (cached) {
      // Check if cached data is from today
      const today = new Date().toISOString().split('T')[0];
      if (cached.date === today) {
        return cached;
      }
    }

    try {
      // Fetch from Hebcal API
      const response = await fetch(
        `https://www.hebcal.com/shabbat?cfg=json&latitude=${latitude}&longitude=${longitude}&m=50`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const items = data.items || [];

      let candleLighting = '';
      let havdalah = '';

      for (const item of items) {
        if (item.title.includes('Candle lighting')) {
          candleLighting = item.date;
        } else if (item.title.includes('Havdalah')) {
          havdalah = item.date;
        }
      }

      if (candleLighting && havdalah) {
        const shabbatTimes: ShabbatTimes = {
          date: new Date().toISOString().split('T')[0],
          candleLighting,
          havdalah,
          location: data.title || 'Unknown',
          timezone: 'auto'
        };

        this.cacheShabbatTimes(shabbatTimes);
        return shabbatTimes;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch Shabbat times:', error);
      return null;
    }
  }

  cacheShabbatTimes(times: ShabbatTimes): void {
    // Extract coordinates from cache key or use default
    const cacheKey = 'default';
    this.shabbatTimesCache.set(cacheKey, times);
  }

  // Admin operations
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  upgradeUser(userId: string, accountType: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const validTypes = ['free', 'youtube_pro', 'premium'];
    if (!validTypes.includes(accountType)) {
      return false;
    }

    user.accountType = accountType as 'free' | 'youtube_pro' | 'premium';
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return true;
  }

  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    this.users.delete(userId);
    if (user.email) {
      this.usersByEmail.delete(user.email);
    }
    return true;
  }

  // Payment tracking operations
  addPayment(payment: { userId: string; amount: number; type: 'youtube_pro' | 'premium'; method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer'; description?: string; }): void {
    const newPayment = paymentSchema.parse({
      id: nanoid(),
      userId: payment.userId,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
      description: payment.description,
      timestamp: new Date(),
      isActive: true
    });
    this.payments.push(newPayment);
  }

  getPayments(): Payment[] {
    return this.payments.filter(p => p.isActive);
  }

  getRevenue(): { monthly: number; total: number; } {
    const activePayments = this.payments.filter(p => p.isActive);
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = activePayments.filter(p => 
      p.timestamp >= currentMonth && p.method !== 'coupon'
    );

    const totalPayments = activePayments.filter(p => p.method !== 'coupon');

    return {
      monthly: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
      total: totalPayments.reduce((sum, p) => sum + p.amount, 0)
    };
  }

  // Video original status operations (for Shabbat restore)
  saveVideoOriginalStatus(videoId: string, originalStatus: string, userId: string): void {
    let userStatuses = this.userVideoOriginalStatuses.get(userId);
    if (!userStatuses) {
      userStatuses = new Map();
      this.userVideoOriginalStatuses.set(userId, userStatuses);
    }
    userStatuses.set(videoId, originalStatus);
  }

  getVideoOriginalStatus(videoId: string, userId: string): string | null {
    const userStatuses = this.userVideoOriginalStatuses.get(userId);
    return userStatuses?.get(videoId) || null;
  }

  clearVideoOriginalStatus(videoId: string, userId: string): void {
    const userStatuses = this.userVideoOriginalStatuses.get(userId);
    if (userStatuses) {
      userStatuses.delete(videoId);
    }
  }

  getAllVideoOriginalStatuses(userId: string): Record<string, string> {
    const userStatuses = this.userVideoOriginalStatuses.get(userId);
    const statuses: Record<string, string> = {};
    if (userStatuses) {
      userStatuses.forEach((status, videoId) => {
        statuses[videoId] = status;
      });
    }
    return statuses;
  }
}

// Use in-memory storage
export const storage = new MemStorage();
