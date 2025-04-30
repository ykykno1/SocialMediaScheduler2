/**
 * Storage service for Shabbat Robot
 * Handles local storage operations
 */
import CONFIG from '../config';
import Logger from '../utils/logger';

export class StorageService {
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   * @returns {boolean} Success status
   */
  static save(key: string, data: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      Logger.error('Failed to save data to storage', { key, error: (error as Error).message });
      return false;
    }
  }
  
  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Retrieved data or default value
   */
  static get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      Logger.error('Failed to get data from storage', { key, error: (error as Error).message });
      return defaultValue;
    }
  }
  
  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      Logger.error('Failed to remove data from storage', { key, error: (error as Error).message });
      return false;
    }
  }
  
  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  static has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
  
  /**
   * Clear all app data from localStorage
   */
  static clearAll(): void {
    try {
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      Logger.info('All app data cleared from storage');
    } catch (error) {
      Logger.error('Failed to clear all data from storage', { error: (error as Error).message });
    }
  }
  
  /**
   * Get app settings
   * @returns {Object} App settings
   */
  static getSettings(): any {
    return this.get(CONFIG.STORAGE_KEYS.SETTINGS, CONFIG.DEFAULT_SETTINGS);
  }
  
  /**
   * Save app settings
   * @param {Object} settings - Settings to save
   * @returns {boolean} Success status
   */
  static saveSettings(settings: any): boolean {
    return this.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);
  }
  
  /**
   * Get auth tokens
   * @returns {Object} Auth tokens by platform
   */
  static getAuthTokens(): Record<string, any> {
    return this.get(CONFIG.STORAGE_KEYS.AUTH_TOKENS, {}) || {};
  }
  
  /**
   * Save auth token for a platform
   * @param {string} platform - Platform name
   * @param {Object} tokenData - Token data
   * @returns {boolean} Success status
   */
  static saveAuthToken(platform: string, tokenData: Record<string, any>): boolean {
    const tokens = this.getAuthTokens();
    tokens[platform] = {
      ...tokenData,
      timestamp: Date.now()
    };
    return this.save(CONFIG.STORAGE_KEYS.AUTH_TOKENS, tokens);
  }
  
  /**
   * Remove auth token for a platform
   * @param {string} platform - Platform name
   * @returns {boolean} Success status
   */
  static removeAuthToken(platform: string): boolean {
    const tokens = this.getAuthTokens();
    delete tokens[platform];
    return this.save(CONFIG.STORAGE_KEYS.AUTH_TOKENS, tokens);
  }
  
  /**
   * Get history entries
   * @returns {Array} History entries
   */
  static getHistory(): any[] {
    return this.get(CONFIG.STORAGE_KEYS.HISTORY, []) || [];
  }
  
  /**
   * Add history entry
   * @param {Object} entry - History entry
   * @returns {boolean} Success status
   */
  static addHistoryEntry(entry: Record<string, any>): boolean {
    const history = this.getHistory();
    history.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    // Limit history to 100 entries
    const limitedHistory = history.slice(0, 100);
    
    return this.save(CONFIG.STORAGE_KEYS.HISTORY, limitedHistory);
  }
}

export default StorageService;
