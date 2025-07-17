/**
 * Scheduler service for Shabbat Robot
 * Handles timed hiding and restoration of social media content
 */

import CONFIG from '../config';
import Logger from '../utils/logger';
import StorageService from './storageService';
import DateTimeUtils from '../utils/dateTimeUtils';
import AuthService from './authService';

export type PlatformAction = {
  platform: string;
  total: number;
  successful: number;
  failed: number;
  error?: string;
};

export type SchedulerResult = {
  action: string;
  status: string;
  timestamp: string;
  platforms: PlatformAction[];
};

export class SchedulerService {
  private static instance: SchedulerService;
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }
  
  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) return;
    
    const settings = StorageService.getSettings();
    if (!settings.autoSchedule) {
      Logger.info('Auto-schedule is disabled, scheduler not started');
      return;
    }
    
    this.isRunning = true;
    Logger.info('Scheduler started');
    
    // Run immediately to check if action is needed
    this.checkSchedule();
    
    // Set interval for future checks
    this.intervalId = window.setInterval(() => {
      this.checkSchedule();
    }, CONFIG.SCHEDULER_INTERVAL) as unknown as number;
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    Logger.info('Scheduler stopped');
  }
  
  /**
   * Check if hiding or restoring actions should be performed - with timezone awareness
   */
  private checkSchedule(): void {
    const settings = StorageService.getSettings();
    
    if (!settings.autoSchedule) {
      this.stop();
      return;
    }
    
    // Use Israeli time for comparisons
    const now = DateTimeUtils.getCurrentIsraeliTime();
    const hideTime = DateTimeUtils.parseTime(settings.hideTime);
    const restoreTime = DateTimeUtils.parseTime(settings.restoreTime);
    
    if (!hideTime || !restoreTime) {
      Logger.error('Invalid time format in settings');
      return;
    }
    
    // Calculate next Shabbat times in Israeli timezone
    const nextHideTime = DateTimeUtils.getNextShabbatEnter(settings.hideTime, 'Asia/Jerusalem');
    const nextRestoreTime = DateTimeUtils.getNextShabbatExit(settings.restoreTime, 'Asia/Jerusalem');
    
    if (!nextHideTime || !nextRestoreTime) {
      Logger.error('Failed to calculate next Shabbat times');
      return;
    }
    
    // Convert to Israeli time for accurate comparison
    const israelHideTime = DateTimeUtils.convertToIsraeliTime(nextHideTime);
    const israelRestoreTime = DateTimeUtils.convertToIsraeliTime(nextRestoreTime);
    
    // Check if we're within 1 minute of the scheduled times (in Israeli time)
    const oneMinute = 60 * 1000; // 1 minute in milliseconds
    
    if (Math.abs(now.getTime() - israelHideTime.getTime()) < oneMinute) {
      Logger.info('Triggering hide content based on Israeli time schedule');
      this.hideAllContent();
    } else if (Math.abs(now.getTime() - israelRestoreTime.getTime()) < oneMinute) {
      Logger.info('Triggering restore content based on Israeli time schedule');
      this.restoreAllContent();
    }
  }
  
  /**
   * Hide content on all enabled platforms
   */
  public async hideAllContent(): Promise<SchedulerResult> {
    Logger.info('Hiding content on all platforms');
    
    const settings = StorageService.getSettings();
    const platformActions: PlatformAction[] = [];
    
    const tasks = Object.entries(settings.platforms)
      .filter(([_, platformConfig]: [string, any]) => platformConfig.enabled && platformConfig.connected)
      .map(async ([platform, _]: [string, any]) => {
        try {
          const result = await this.hidePlatformContent(platform);
          platformActions.push(result);
        } catch (error) {
          platformActions.push({
            platform,
            total: 0,
            successful: 0,
            failed: 0,
            error: (error as Error).message
          });
        }
      });
    
    await Promise.all(tasks);
    
    const result: SchedulerResult = {
      action: CONFIG.ACTIONS.HIDE,
      status: CONFIG.STATUS.SUCCESS,
      timestamp: new Date().toISOString(),
      platforms: platformActions
    };
    
    // Add to history
    StorageService.addHistoryEntry(result);
    
    return result;
  }
  
  /**
   * Restore content on all enabled platforms
   */
  public async restoreAllContent(): Promise<SchedulerResult> {
    Logger.info('Restoring content on all platforms');
    
    const settings = StorageService.getSettings();
    const platformActions: PlatformAction[] = [];
    
    const tasks = Object.entries(settings.platforms)
      .filter(([_, platformConfig]: [string, any]) => platformConfig.enabled && platformConfig.connected)
      .map(async ([platform, _]: [string, any]) => {
        try {
          const result = await this.restorePlatformContent(platform);
          platformActions.push(result);
        } catch (error) {
          platformActions.push({
            platform,
            total: 0,
            successful: 0,
            failed: 0,
            error: (error as Error).message
          });
        }
      });
    
    await Promise.all(tasks);
    
    const result: SchedulerResult = {
      action: CONFIG.ACTIONS.RESTORE,
      status: CONFIG.STATUS.SUCCESS,
      timestamp: new Date().toISOString(),
      platforms: platformActions
    };
    
    // Add to history
    StorageService.addHistoryEntry(result);
    
    return result;
  }
  
  /**
   * Hide content for a specific platform
   * @param {string} platform - Platform name
   */
  private async hidePlatformContent(platform: string): Promise<PlatformAction> {
    Logger.info(`Hiding content for platform: ${platform}`);
    
    // Check if authenticated
    if (!AuthService.isAuthenticated(platform)) {
      throw new Error(`Not authenticated with ${platform}`);
    }
    
    const token = AuthService.getAccessToken(platform);
    if (!token) {
      throw new Error(`Failed to get access token for ${platform}`);
    }
    
    // Fetch and update posts/content
    // This would contain platform-specific API calls
    // For now, we'll return a sample result
    
    return {
      platform,
      total: 5,
      successful: 5,
      failed: 0
    };
  }
  
  /**
   * Restore content for a specific platform
   * @param {string} platform - Platform name
   */
  private async restorePlatformContent(platform: string): Promise<PlatformAction> {
    Logger.info(`Restoring content for platform: ${platform}`);
    
    // Check if authenticated
    if (!AuthService.isAuthenticated(platform)) {
      throw new Error(`Not authenticated with ${platform}`);
    }
    
    const token = AuthService.getAccessToken(platform);
    if (!token) {
      throw new Error(`Failed to get access token for ${platform}`);
    }
    
    // Fetch and update posts/content
    // This would contain platform-specific API calls
    // For now, we'll return a sample result
    
    return {
      platform,
      total: 5,
      successful: 5,
      failed: 0
    };
  }
}

export default SchedulerService;
