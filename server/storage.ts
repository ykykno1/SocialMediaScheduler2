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
  type AdminUser,
  type Subscription,
  type ConnectedAccount,
  type GoogleUser,
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
  
  // User operations
  createUser(userData: RegisterData): User;
  getUserByEmail(email: string): User | null;
  getUserById(id: string): User | null;
  updateUser(id: string, updates: Partial<User>): User;
  verifyPassword(email: string, password: string): User | null;
  getAllUsers(): User[];
  
  // Shabbat times operations
  getShabbatTimes(latitude: number, longitude: number): Promise<ShabbatTimes | null>;
  cacheShabbatTimes(times: ShabbatTimes): void;
  
  // Admin operations
  createAdmin(adminData: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser;
  getAdminByCode(code: string): AdminUser | null;
  updateAdminLastLogin(id: string): void;
  
  // Subscription operations
  createSubscription(subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription;
  getSubscriptionByUserId(userId: string): Subscription | null;
  updateSubscription(id: string, updates: Partial<Subscription>): Subscription;
  getAllSubscriptions(): Subscription[];
  
  // Connected accounts operations
  saveConnectedAccount(accountData: Omit<ConnectedAccount, 'id' | 'createdAt' | 'updatedAt'>): ConnectedAccount;
  getConnectedAccountsByUserId(userId: string): ConnectedAccount[];
  getConnectedAccount(userId: string, platform: SupportedPlatform): ConnectedAccount | null;
  updateConnectedAccount(id: string, updates: Partial<ConnectedAccount>): ConnectedAccount;
  removeConnectedAccount(id: string): void;
  
  // Google OAuth operations
  createOrUpdateUserFromGoogle(googleUser: GoogleUser): User;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private settings: Settings;
  private authTokens: Record<SupportedPlatform, AuthToken | null> = {
    facebook: null,
    youtube: null,
    tiktok: null,
    instagram: null
  };
  private facebookAuth: FacebookAuth | null = null; // Legacy support
  private historyEntries: HistoryEntry[] = [];
  private cachedPosts: FacebookPost[] = [];
  private cachedPages: FacebookPage[] = [];
  private cachedYouTubeVideos: YouTubeVideo[] = [];
  private privacyStatuses: Record<SupportedPlatform, PrivacyStatus[]> = {
    facebook: [],
    youtube: [],
    tiktok: [],
    instagram: []
  };
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId
  private shabbatTimesCache: Map<string, ShabbatTimes> = new Map();
  private admins: Map<string, AdminUser> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private userSubscriptions: Map<string, string> = new Map(); // userId -> subscriptionId
  private connectedAccounts: Map<string, ConnectedAccount> = new Map();
  private userConnectedAccounts: Map<string, string[]> = new Map(); // userId -> accountIds[]
  
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
  
  // Update or add a single privacy status
  updatePrivacyStatus(platform: SupportedPlatform, contentId: string, updates: Partial<PrivacyStatus>): void {
    const statuses = this.getPrivacyStatuses(platform);
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
    
    this.privacyStatuses[platform] = statuses;
  }
  
  // Toggle lock status for a specific piece of content
  toggleContentLock(platform: SupportedPlatform, contentId: string): boolean {
    const statuses = this.getPrivacyStatuses(platform);
    const status = statuses.find(s => s.contentId === contentId);
    
    if (status) {
      status.isLockedByUser = !status.isLockedByUser;
      status.lastModified = Date.now();
      this.privacyStatuses[platform] = statuses;
      return status.isLockedByUser;
    }
    
    return false;
  }
  
  // Get a specific privacy status
  getPrivacyStatus(platform: SupportedPlatform, contentId: string): PrivacyStatus | null {
    const statuses = this.getPrivacyStatuses(platform);
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
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
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
  createAdmin(adminData: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser {
    const adminId = nanoid();
    const admin: AdminUser = {
      id: adminId,
      username: adminData.username,
      password: adminData.password,
      role: 'admin',
      createdAt: new Date(),
      lastLogin: adminData.lastLogin
    };
    
    this.admins.set(adminId, admin);
    return admin;
  }
  
  getAdminByCode(code: string): AdminUser | null {
    // For simple code-based auth (code: 1234)
    if (code === '1234') {
      // Create default admin if not exists
      const existingAdmin = Array.from(this.admins.values()).find(a => a.username === 'admin');
      if (existingAdmin) {
        return existingAdmin;
      }
      
      return this.createAdmin({
        username: 'admin',
        password: '1234',
        role: 'admin',
        lastLogin: new Date()
      });
    }
    return null;
  }
  
  updateAdminLastLogin(id: string): void {
    const admin = this.admins.get(id);
    if (admin) {
      admin.lastLogin = new Date();
      this.admins.set(id, admin);
    }
  }
  
  // Subscription operations
  createSubscription(subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription {
    const subscriptionId = nanoid();
    const subscription: Subscription = {
      id: subscriptionId,
      userId: subscriptionData.userId,
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      price: subscriptionData.price,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      autoRenew: subscriptionData.autoRenew,
      paymentMethod: subscriptionData.paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    this.userSubscriptions.set(subscriptionData.userId, subscriptionId);
    return subscription;
  }
  
  getSubscriptionByUserId(userId: string): Subscription | null {
    const subscriptionId = this.userSubscriptions.get(userId);
    if (!subscriptionId) return null;
    return this.subscriptions.get(subscriptionId) || null;
  }
  
  updateSubscription(id: string, updates: Partial<Subscription>): Subscription {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updated = { ...subscription, ...updates, updatedAt: new Date() };
    this.subscriptions.set(id, updated);
    return updated;
  }
  
  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }
  
  // Connected accounts operations
  saveConnectedAccount(accountData: Omit<ConnectedAccount, 'id' | 'createdAt' | 'updatedAt'>): ConnectedAccount {
    const accountId = nanoid();
    const account: ConnectedAccount = {
      id: accountId,
      userId: accountData.userId,
      platform: accountData.platform,
      platformUserId: accountData.platformUserId,
      platformUsername: accountData.platformUsername,
      profilePictureUrl: accountData.profilePictureUrl,
      accessToken: accountData.accessToken,
      refreshToken: accountData.refreshToken,
      expiresAt: accountData.expiresAt,
      isActive: accountData.isActive,
      lastSync: accountData.lastSync,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.connectedAccounts.set(accountId, account);
    
    // Update user's connected accounts list
    const userAccounts = this.userConnectedAccounts.get(accountData.userId) || [];
    userAccounts.push(accountId);
    this.userConnectedAccounts.set(accountData.userId, userAccounts);
    
    return account;
  }
  
  getConnectedAccountsByUserId(userId: string): ConnectedAccount[] {
    const accountIds = this.userConnectedAccounts.get(userId) || [];
    return accountIds
      .map(id => this.connectedAccounts.get(id))
      .filter(account => account !== undefined) as ConnectedAccount[];
  }
  
  getConnectedAccount(userId: string, platform: SupportedPlatform): ConnectedAccount | null {
    const accounts = this.getConnectedAccountsByUserId(userId);
    return accounts.find(account => account.platform === platform && account.isActive) || null;
  }
  
  updateConnectedAccount(id: string, updates: Partial<ConnectedAccount>): ConnectedAccount {
    const account = this.connectedAccounts.get(id);
    if (!account) throw new Error('Connected account not found');
    
    const updated = { ...account, ...updates, updatedAt: new Date() };
    this.connectedAccounts.set(id, updated);
    return updated;
  }
  
  removeConnectedAccount(id: string): void {
    const account = this.connectedAccounts.get(id);
    if (!account) return;
    
    // Remove from accounts map
    this.connectedAccounts.delete(id);
    
    // Remove from user's accounts list
    const userAccounts = this.userConnectedAccounts.get(account.userId) || [];
    const updatedAccounts = userAccounts.filter(accountId => accountId !== id);
    this.userConnectedAccounts.set(account.userId, updatedAccounts);
  }
  
  // Google OAuth operations
  createOrUpdateUserFromGoogle(googleUser: GoogleUser): User {
    // Check if user exists by email
    let user = this.getUserByEmail(googleUser.email);
    
    if (user) {
      // Update existing user with Google info
      const updates: Partial<User> = {
        googleId: googleUser.googleId,
        firstName: googleUser.givenName || user.firstName,
        lastName: googleUser.familyName || user.lastName,
        profileImageUrl: googleUser.picture || user.profileImageUrl,
        lastLogin: new Date(),
        updatedAt: new Date()
      };
      return this.updateUser(user.id, updates);
    } else {
      // Create new user from Google
      const userId = nanoid();
      const newUser: User = {
        id: userId,
        email: googleUser.email,
        username: googleUser.email.split('@')[0], // Use email prefix as username
        googleId: googleUser.googleId,
        firstName: googleUser.givenName,
        lastName: googleUser.familyName,
        profileImageUrl: googleUser.picture,
        accountType: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      this.users.set(userId, newUser);
      this.usersByEmail.set(googleUser.email, userId);
      return newUser;
    }
  }
}

// Use in-memory storage
export const storage = new MemStorage();
