import {
  type Settings,
  type FacebookAuth,
  type HistoryEntry,
  type FacebookPost,
  settingsSchema,
  facebookAuthSchema,
  historyEntrySchema
} from "@shared/schema";
import { nanoid } from 'nanoid';

// Interface for storage operations
export interface IStorage {
  // Settings operations
  getSettings(): Settings;
  saveSettings(settings: Settings): Settings;
  
  // Auth token operations
  getFacebookAuth(): FacebookAuth | null;
  saveFacebookAuth(token: FacebookAuth): FacebookAuth;
  removeFacebookAuth(): void;
  
  // History operations
  getHistoryEntries(): HistoryEntry[];
  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry;
  
  // Facebook posts cache
  getCachedPosts(): FacebookPost[];
  saveCachedPosts(posts: FacebookPost[]): void;
  clearCachedPosts(): void;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private settings: Settings;
  private facebookAuth: FacebookAuth | null = null;
  private historyEntries: HistoryEntry[] = [];
  private cachedPosts: FacebookPost[] = [];
  
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
  
  // Auth token operations
  getFacebookAuth(): FacebookAuth | null {
    return this.facebookAuth;
  }
  
  saveFacebookAuth(token: FacebookAuth): FacebookAuth {
    this.facebookAuth = facebookAuthSchema.parse(token);
    return this.facebookAuth;
  }
  
  removeFacebookAuth(): void {
    this.facebookAuth = null;
  }
  
  // History operations
  getHistoryEntries(): HistoryEntry[] {
    return this.historyEntries;
  }
  
  addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
    const newEntry: HistoryEntry = {
      ...entry,
      id: nanoid()
    };
    
    this.historyEntries.unshift(newEntry); // Add to beginning for newest first
    
    // Keep only the last 50 entries
    if (this.historyEntries.length > 50) {
      this.historyEntries = this.historyEntries.slice(0, 50);
    }
    
    return newEntry;
  }
  
  // Facebook posts cache
  getCachedPosts(): FacebookPost[] {
    return this.cachedPosts;
  }
  
  saveCachedPosts(posts: FacebookPost[]): void {
    this.cachedPosts = posts;
  }
  
  clearCachedPosts(): void {
    this.cachedPosts = [];
  }
}

// Use in-memory storage
export const storage = new MemStorage();
