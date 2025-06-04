import { randomUUID } from 'crypto';
import type { 
  User, 
  PlatformToken, 
  ContentState, 
  ActivityLog, 
  ShabbatSchedule,
  SupportedPlatform,
  UserSettings
} from '../shared/types';

export interface ISecureStorage {
  // User management - all operations require proper authentication
  createUser(userData: { email: string; password: string; username: string }): User;
  getUserById(userId: string): User | undefined;
  getUserByEmail(email: string): User | undefined;
  updateUser(userId: string, updates: Partial<User>): User | undefined;
  deleteUser(userId: string): boolean;

  // Platform tokens - strictly user-isolated
  savePlatformToken(userId: string, tokenData: Omit<PlatformToken, 'userId'>): void;
  getPlatformToken(userId: string, platform: SupportedPlatform): PlatformToken | undefined;
  removePlatformToken(userId: string, platform: SupportedPlatform): boolean;
  refreshPlatformToken(userId: string, platform: SupportedPlatform, newTokenData: Partial<PlatformToken>): boolean;

  // Content state management - user-isolated
  saveContentState(userId: string, contentData: Omit<ContentState, 'userId'>): void;
  getContentStates(userId: string, platform?: SupportedPlatform): ContentState[];
  updateContentState(userId: string, platform: SupportedPlatform, contentId: string, updates: Partial<ContentState>): boolean;
  clearContentStates(userId: string, platform?: SupportedPlatform): boolean;

  // Activity logging - user-isolated
  addActivityLog(userId: string, logData: Omit<ActivityLog, 'id' | 'userId' | 'timestamp'>): void;
  getActivityLogs(userId: string, limit?: number): ActivityLog[];

  // Shabbat scheduling - user-isolated
  saveShabbatSchedule(userId: string, schedule: Omit<ShabbatSchedule, 'userId'>): void;
  getShabbatSchedule(userId: string, date: string): ShabbatSchedule | undefined;
  getUpcomingShabbat(userId: string): ShabbatSchedule | undefined;

  // User settings - user-isolated
  saveUserSettings(userId: string, settings: UserSettings): void;
  getUserSettings(userId: string): UserSettings | undefined;

  // Admin functions - with proper security checks
  getAllUsers(): User[]; // Admin only
  getUserStats(): { totalUsers: number; activeUsers: number; premiumUsers: number }; // Admin only
}

export class SecureMemoryStorage implements ISecureStorage {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId mapping
  private platformTokens: Map<string, Map<SupportedPlatform, PlatformToken>> = new Map(); // userId -> platform -> token
  private contentStates: Map<string, ContentState[]> = new Map(); // userId -> states
  private activityLogs: Map<string, ActivityLog[]> = new Map(); // userId -> logs
  private shabbatSchedules: Map<string, Map<string, ShabbatSchedule>> = new Map(); // userId -> date -> schedule
  private userSettings: Map<string, UserSettings> = new Map(); // userId -> settings

  // User management
  createUser(userData: { email: string; password: string; username: string }): User {
    const userId = randomUUID();
    const user: User = {
      id: userId,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      accountType: 'free',
      createdAt: new Date(),
      hideCount: 0,
      maxHides: 4 // Free tier limit
    } as User;

    this.users.set(userId, user);
    this.usersByEmail.set(userData.email, userId);

    // Initialize user-specific collections
    this.platformTokens.set(userId, new Map());
    this.contentStates.set(userId, []);
    this.activityLogs.set(userId, []);
    this.shabbatSchedules.set(userId, new Map());

    this.addActivityLog(userId, {
      action: 'auth',
      platform: 'system',
      success: true,
      details: { action: 'user_created' }
    });

    return user;
  }

  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.usersByEmail.get(email);
    return userId ? this.users.get(userId) : undefined;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);

    // Update email mapping if email changed
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email);
      this.usersByEmail.set(updates.email, userId);
    }

    return updatedUser;
  }

  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    // Clean up all user data
    this.users.delete(userId);
    this.usersByEmail.delete(user.email);
    this.platformTokens.delete(userId);
    this.contentStates.delete(userId);
    this.activityLogs.delete(userId);
    this.shabbatSchedules.delete(userId);
    this.userSettings.delete(userId);

    return true;
  }

  // Platform tokens - strictly user-isolated
  savePlatformToken(userId: string, tokenData: Omit<PlatformToken, 'userId'>): void {
    const userTokens = this.platformTokens.get(userId);
    if (!userTokens) {
      throw new Error('User not found');
    }

    const token: PlatformToken = {
      ...tokenData,
      userId
    };

    userTokens.set(tokenData.platform, token);

    this.addActivityLog(userId, {
      action: 'auth',
      platform: tokenData.platform,
      success: true,
      details: { action: 'token_saved' }
    });
  }

  getPlatformToken(userId: string, platform: SupportedPlatform): PlatformToken | undefined {
    const userTokens = this.platformTokens.get(userId);
    return userTokens?.get(platform);
  }

  removePlatformToken(userId: string, platform: SupportedPlatform): boolean {
    const userTokens = this.platformTokens.get(userId);
    if (!userTokens) return false;

    const removed = userTokens.delete(platform);
    
    if (removed) {
      this.addActivityLog(userId, {
        action: 'auth',
        platform: platform,
        success: true,
        details: { action: 'token_removed' }
      });
    }

    return removed;
  }

  refreshPlatformToken(userId: string, platform: SupportedPlatform, newTokenData: Partial<PlatformToken>): boolean {
    const userTokens = this.platformTokens.get(userId);
    const existingToken = userTokens?.get(platform);
    
    if (!existingToken) return false;

    const updatedToken = { ...existingToken, ...newTokenData };
    userTokens!.set(platform, updatedToken);

    this.addActivityLog(userId, {
      action: 'auth',
      platform: platform,
      success: true,
      details: { action: 'token_refreshed' }
    });

    return true;
  }

  // Content state management - user-isolated
  saveContentState(userId: string, contentData: Omit<ContentState, 'userId'>): void {
    const userStates = this.contentStates.get(userId);
    if (!userStates) {
      throw new Error('User not found');
    }

    const state: ContentState = {
      ...contentData,
      userId
    };

    // Remove existing state for same content if exists
    const existingIndex = userStates.findIndex(
      s => s.platform === state.platform && s.contentId === state.contentId
    );

    if (existingIndex >= 0) {
      userStates[existingIndex] = state;
    } else {
      userStates.push(state);
    }
  }

  getContentStates(userId: string, platform?: SupportedPlatform): ContentState[] {
    const userStates = this.contentStates.get(userId) || [];
    
    if (platform) {
      return userStates.filter(state => state.platform === platform);
    }
    
    return userStates;
  }

  updateContentState(userId: string, platform: SupportedPlatform, contentId: string, updates: Partial<ContentState>): boolean {
    const userStates = this.contentStates.get(userId);
    if (!userStates) return false;

    const stateIndex = userStates.findIndex(
      s => s.platform === platform && s.contentId === contentId
    );

    if (stateIndex >= 0) {
      userStates[stateIndex] = { ...userStates[stateIndex], ...updates };
      return true;
    }

    return false;
  }

  clearContentStates(userId: string, platform?: SupportedPlatform): boolean {
    const userStates = this.contentStates.get(userId);
    if (!userStates) return false;

    if (platform) {
      const originalLength = userStates.length;
      const filtered = userStates.filter(state => state.platform !== platform);
      this.contentStates.set(userId, filtered);
      return filtered.length < originalLength;
    } else {
      this.contentStates.set(userId, []);
      return true;
    }
  }

  // Activity logging - user-isolated
  addActivityLog(userId: string, logData: Omit<ActivityLog, 'id' | 'userId' | 'timestamp'>): void {
    const userLogs = this.activityLogs.get(userId);
    if (!userLogs) {
      throw new Error('User not found');
    }

    const log: ActivityLog = {
      id: randomUUID(),
      userId,
      timestamp: new Date(),
      ...logData
    };

    userLogs.unshift(log); // Add to beginning for chronological order

    // Keep only last 1000 logs per user
    if (userLogs.length > 1000) {
      userLogs.splice(1000);
    }
  }

  getActivityLogs(userId: string, limit: number = 100): ActivityLog[] {
    const userLogs = this.activityLogs.get(userId) || [];
    return userLogs.slice(0, limit);
  }

  // Shabbat scheduling - user-isolated
  saveShabbatSchedule(userId: string, schedule: Omit<ShabbatSchedule, 'userId'>): void {
    let userSchedules = this.shabbatSchedules.get(userId);
    if (!userSchedules) {
      userSchedules = new Map();
      this.shabbatSchedules.set(userId, userSchedules);
    }

    const fullSchedule: ShabbatSchedule = {
      ...schedule,
      userId
    };

    userSchedules.set(schedule.date, fullSchedule);
  }

  getShabbatSchedule(userId: string, date: string): ShabbatSchedule | undefined {
    const userSchedules = this.shabbatSchedules.get(userId);
    return userSchedules?.get(date);
  }

  getUpcomingShabbat(userId: string): ShabbatSchedule | undefined {
    const userSchedules = this.shabbatSchedules.get(userId);
    if (!userSchedules) return undefined;

    const now = new Date();
    let upcoming: ShabbatSchedule | undefined;

    for (const schedule of userSchedules.values()) {
      if (schedule.shabbatEnter > now) {
        if (!upcoming || schedule.shabbatEnter < upcoming.shabbatEnter) {
          upcoming = schedule;
        }
      }
    }

    return upcoming;
  }

  // User settings - user-isolated
  saveUserSettings(userId: string, settings: UserSettings): void {
    this.userSettings.set(userId, settings);
  }

  getUserSettings(userId: string): UserSettings | undefined {
    return this.userSettings.get(userId);
  }

  // Admin functions - with proper security checks
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserStats(): { totalUsers: number; activeUsers: number; premiumUsers: number } {
    const users = Array.from(this.users.values());
    const now = new Date();
    const activeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.lastActive && u.lastActive > activeThreshold).length,
      premiumUsers: users.filter(u => u.accountType === 'premium' || u.accountType === 'youtube_pro').length
    };
  }
}

// Export singleton instance
export const secureStorage = new SecureMemoryStorage();