import { users, type User, type InsertUser, settings, historyEntries, authTokens } from "@shared/schema";
import type { Settings, InsertSettings, HistoryEntry, InsertHistoryEntry, AuthToken, InsertAuthToken } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings methods
  getSettings(userId: string): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: number, settings: Partial<Settings>): Promise<Settings | undefined>;
  
  // Auth token methods
  getAuthToken(userId: string, platform: string): Promise<AuthToken | undefined>;
  saveAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  deleteAuthToken(userId: string, platform: string): Promise<boolean>;
  
  // History methods
  getHistoryEntries(userId: string, limit?: number): Promise<HistoryEntry[]>;
  addHistoryEntry(entry: InsertHistoryEntry): Promise<HistoryEntry>;
  clearHistory(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private settings: Map<number, Settings>;
  private tokens: Map<string, AuthToken>;
  private history: Map<number, HistoryEntry>;
  
  currentUserId: number;
  currentSettingsId: number;
  currentTokenId: number;
  currentHistoryId: number;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
    this.tokens = new Map();
    this.history = new Map();
    
    this.currentUserId = 1;
    this.currentSettingsId = 1;
    this.currentTokenId = 1;
    this.currentHistoryId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Settings methods
  async getSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.userId === userId,
    );
  }
  
  async saveSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = this.currentSettingsId++;
    const setting: Settings = { ...insertSettings, id };
    this.settings.set(id, setting);
    return setting;
  }
  
  async updateSettings(id: number, updatedSettings: Partial<Settings>): Promise<Settings | undefined> {
    const existingSettings = this.settings.get(id);
    if (!existingSettings) return undefined;
    
    const updated: Settings = { ...existingSettings, ...updatedSettings };
    this.settings.set(id, updated);
    return updated;
  }
  
  // Auth token methods
  async getAuthToken(userId: string, platform: string): Promise<AuthToken | undefined> {
    return Array.from(this.tokens.values()).find(
      (token) => token.userId === userId && token.platform === platform,
    );
  }
  
  async saveAuthToken(insertToken: InsertAuthToken): Promise<AuthToken> {
    // Delete existing token if it exists
    for (const [key, token] of this.tokens.entries()) {
      if (token.userId === insertToken.userId && token.platform === insertToken.platform) {
        this.tokens.delete(key);
        break;
      }
    }
    
    const id = this.currentTokenId++;
    const token: AuthToken = { ...insertToken, id };
    
    // Generate token key for map
    const tokenKey = `${token.userId}:${token.platform}`;
    this.tokens.set(tokenKey, token);
    
    return token;
  }
  
  async deleteAuthToken(userId: string, platform: string): Promise<boolean> {
    const tokenKey = `${userId}:${platform}`;
    return this.tokens.delete(tokenKey);
  }
  
  // History methods
  async getHistoryEntries(userId: string, limit: number = 100): Promise<HistoryEntry[]> {
    const entries = Array.from(this.history.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    
    return entries.slice(0, limit);
  }
  
  async addHistoryEntry(insertEntry: InsertHistoryEntry): Promise<HistoryEntry> {
    const id = this.currentHistoryId++;
    const entry: HistoryEntry = { ...insertEntry, id };
    this.history.set(id, entry);
    return entry;
  }
  
  async clearHistory(userId: string): Promise<boolean> {
    let success = true;
    
    for (const [key, entry] of this.history.entries()) {
      if (entry.userId === userId) {
        const deleted = this.history.delete(key);
        if (!deleted) success = false;
      }
    }
    
    return success;
  }
}

export const storage = new MemStorage();
