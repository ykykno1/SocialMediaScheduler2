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
  
  // User operations
  createUser(userData: RegisterData): User;
  getUserByEmail(email: string): User | null;
  getUserById(id: string): User | null;
  updateUser(id: string, updates: Partial<User>): User;
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
  
  // Generic auth token operations (user-specific)
  getAuthToken(platform: SupportedPlatform, userId?: string): AuthToken | null {
    if (!userId) return null;
    const userTokens = this.userAuthTokens.get(userId);
    return userTokens?.[platform] || null;
  }
  
  saveAuthToken(token: AuthToken, userId?: string): AuthToken {
    if (!userId) throw new Error('User ID required for saving auth token');
    
    const validatedToken = authSchema.parse(token);
    
    let userTokens = this.userAuthTokens.get(userId);
    if (!userTokens) {
      userTokens = { facebook: null, youtube: null, tiktok: null, instagram: null };
      this.userAuthTokens.set(userId, userTokens);
    }
    userTokens[token.platform] = validatedToken;
    
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
    if (!userId) return null;
    return this.userFacebookAuth.get(userId) || null;
  }
  
  saveFacebookAuth(token: FacebookAuth, userId?: string): FacebookAuth {
    if (!userId) throw new Error('User ID required for saving Facebook auth');
    
    const validatedToken = facebookAuthSchema.parse(token);
    this.userFacebookAuth.set(userId, validatedToken);
    
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
  
  removeFacebookAuth(userId?: string): void {
    if (!userId) return;
    this.userFacebookAuth.set(userId, null);
    
    const userTokens = this.userAuthTokens.get(userId);
    if (userTokens) {
      userTokens.facebook = null;
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
      firstName: userData.firstName,
      lastName: userData.lastName,
      accountType: 'free',
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
}

// Use in-memory storage
export const storage = new MemStorage();
