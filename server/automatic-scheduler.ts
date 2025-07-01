import * as cron from 'node-cron';
import { enhancedStorage as storage } from './enhanced-storage.js';

interface ShabbatTimes {
  entryTime: Date;
  exitTime: Date;
  cityName: string;
  cityId: string;
}

interface ScheduledJob {
  task: cron.ScheduledTask;
  type: 'hide' | 'restore';
  userId: string;
  scheduledTime: Date;
}

/**
 * Automatic Shabbat Content Scheduler
 * Runs on the server and works even when the website is closed
 */
export class AutomaticScheduler {
  private static instance: AutomaticScheduler;
  private scheduledJobs: Map<string, ScheduledJob[]> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): AutomaticScheduler {
    if (!AutomaticScheduler.instance) {
      AutomaticScheduler.instance = new AutomaticScheduler();
    }
    return AutomaticScheduler.instance;
  }

  /**
   * Start the automatic scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🤖 Automatic Scheduler is already running');
      return;
    }

    console.log('🚀 Starting Automatic Shabbat Content Scheduler...');
    this.isRunning = true;

    // Schedule jobs for all premium users
    await this.scheduleAllUsers();

    // Set up a daily check to reschedule for the next week
    cron.schedule('0 0 * * 0', async () => { // Every Sunday at midnight
      console.log('📅 Weekly reschedule - updating all user schedules');
      await this.scheduleAllUsers();
    });

    console.log('✅ Automatic Scheduler started successfully');
  }

  /**
   * Stop the scheduler and clear all jobs
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('⏹️ Stopping Automatic Scheduler...');
    
    // Destroy all scheduled jobs
    for (const [userId, jobs] of this.scheduledJobs.entries()) {
      jobs.forEach(job => job.task.destroy());
    }
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    
    console.log('✅ Automatic Scheduler stopped');
  }

  /**
   * Schedule hide/restore operations for all premium users
   */
  private async scheduleAllUsers(): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      console.log(`📋 Found ${users.length} total users`);

      const premiumUsers = users.filter(user => user.accountType === 'premium');
      console.log(`👑 Found ${premiumUsers.length} premium users`);

      for (const user of premiumUsers) {
        await this.scheduleUserJobs(user);
      }

      console.log(`✅ Scheduled jobs for ${premiumUsers.length} premium users`);
    } catch (error) {
      console.error('❌ Error scheduling all users:', error);
    }
  }

  /**
   * Schedule jobs for a specific user
   */
  private async scheduleUserJobs(user: any): Promise<void> {
    try {
      // Clear existing jobs for this user
      this.clearUserJobs(user.id);

      let shabbatTimes: ShabbatTimes | null = null;

      // Check if user has admin manual times (שעות ידניות)
      if (user.shabbatCity === 'מנהל' || user.shabbatCityId === 'admin') {
        const adminTimes = await storage.getAdminShabbatTimes();
        if (adminTimes?.entryTime && adminTimes?.exitTime) {
          shabbatTimes = {
            entryTime: adminTimes.entryTime,
            exitTime: adminTimes.exitTime,
            cityName: 'מנהל',
            cityId: 'admin'
          };
          console.log(`⚙️ User ${user.email} using admin manual times: ${adminTimes.entryTime} - ${adminTimes.exitTime}`);
        }
      } else if (user.shabbatCityId) {
        // Use location-based Shabbat times
        shabbatTimes = await this.getShabbatTimesForLocation(user.shabbatCityId, user.shabbatCity);
      }

      if (!shabbatTimes) {
        console.log(`⚠️ No Shabbat times found for user ${user.email}`);
        return;
      }

      // Calculate hide and restore times based on user preferences
      const hideTime = this.calculateHideTime(shabbatTimes.entryTime, user.hideTimingPreference || '1hour');
      const restoreTime = this.calculateRestoreTime(shabbatTimes.exitTime, user.restoreTimingPreference || 'immediate');

      console.log(`⏰ User ${user.email}: Hide at ${hideTime}, Restore at ${restoreTime}`);

      // Schedule hide operation
      if (hideTime > new Date()) {
        const hideJob = this.createCronJob(hideTime, async () => {
          console.log(`🕯️ EXECUTING HIDE for user ${user.email} (${user.id})`);
          await this.executeHideOperation(user.id);
        });

        // Schedule restore operation
        if (restoreTime > new Date()) {
          const restoreJob = this.createCronJob(restoreTime, async () => {
            console.log(`✨ EXECUTING RESTORE for user ${user.email} (${user.id})`);
            await this.executeRestoreOperation(user.id);
          });

          // Store the jobs
          this.scheduledJobs.set(user.id, [
            { task: hideJob, type: 'hide', userId: user.id, scheduledTime: hideTime },
            { task: restoreJob, type: 'restore', userId: user.id, scheduledTime: restoreTime }
          ]);

          console.log(`✅ Scheduled both operations for ${user.email}`);
        } else {
          // Only store hide job if restore time has passed
          this.scheduledJobs.set(user.id, [
            { task: hideJob, type: 'hide', userId: user.id, scheduledTime: hideTime }
          ]);
          console.log(`✅ Scheduled hide operation for ${user.email} (restore time has passed)`);
        }
      } else {
        console.log(`⚠️ Hide time has passed for user ${user.email}, checking if restore is needed`);
        
        // If hide time passed but restore time hasn't, schedule only restore
        if (restoreTime > new Date()) {
          const restoreJob = this.createCronJob(restoreTime, async () => {
            console.log(`✨ EXECUTING RESTORE for user ${user.email} (${user.id})`);
            await this.executeRestoreOperation(user.id);
          });

          this.scheduledJobs.set(user.id, [
            { task: restoreJob, type: 'restore', userId: user.id, scheduledTime: restoreTime }
          ]);
          console.log(`✅ Scheduled restore operation for ${user.email}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error scheduling jobs for user ${user.email}:`, error);
    }
  }

  /**
   * Get Shabbat times for a location
   */
  private async getShabbatTimesForLocation(cityId: string, cityName: string): Promise<ShabbatTimes | null> {
    try {
      // Get next Friday
      const now = new Date();
      const friday = new Date(now);
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      if (daysUntilFriday === 0 && now.getDay() !== 5) {
        friday.setDate(friday.getDate() + 7); // Next Friday if today is not Friday
      } else {
        friday.setDate(friday.getDate() + daysUntilFriday);
      }

      const year = friday.getFullYear();
      const month = friday.getMonth() + 1;
      const day = friday.getDate();

      // Use simplified Chabad times (this should be enhanced with real API)
      const chabadTimes: Record<string, { entry: [number, number], exit: [number, number] }> = {
        '531': { entry: [19, 25], exit: [20, 29] }, // Tel Aviv
        '688': { entry: [19, 20], exit: [20, 25] }, // Beer Sheva
        '695': { entry: [19, 20], exit: [20, 23] }, // Safed
        // Add more cities as needed
      };

      const times = chabadTimes[cityId];
      if (times) {
        const entryTime = new Date(year, month - 1, day);
        entryTime.setHours(times.entry[0], times.entry[1], 0, 0);
        
        const exitTime = new Date(year, month - 1, day + 1);
        exitTime.setHours(times.exit[0], times.exit[1], 0, 0);
        
        return {
          entryTime,
          exitTime,
          cityName,
          cityId
        };
      }

      console.log(`⚠️ No times found for city ${cityName} (${cityId})`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting Shabbat times for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Calculate hide time based on user preference
   */
  private calculateHideTime(shabbatEntry: Date, preference: string): Date {
    const hideTime = new Date(shabbatEntry);
    
    switch (preference) {
      case 'immediate':
        // Hide exactly at Shabbat entry
        break;
      case '15min':
        hideTime.setMinutes(hideTime.getMinutes() - 15);
        break;
      case '30min':
        hideTime.setMinutes(hideTime.getMinutes() - 30);
        break;
      case '1hour':
      default:
        hideTime.setHours(hideTime.getHours() - 1);
        break;
    }
    
    return hideTime;
  }

  /**
   * Calculate restore time based on user preference
   */
  private calculateRestoreTime(shabbatExit: Date, preference: string): Date {
    const restoreTime = new Date(shabbatExit);
    
    switch (preference) {
      case 'immediate':
        // Restore exactly at Shabbat exit
        break;
      case '30min':
        restoreTime.setMinutes(restoreTime.getMinutes() + 30);
        break;
      case '1hour':
        restoreTime.setHours(restoreTime.getHours() + 1);
        break;
    }
    
    return restoreTime;
  }

  /**
   * Create a cron job for a specific date/time
   */
  private createCronJob(targetTime: Date, callback: () => void): cron.ScheduledTask {
    const cronPattern = this.dateToCronPattern(targetTime);
    console.log(`⏱️ Creating cron job for ${targetTime.toLocaleString('he-IL')} with pattern: ${cronPattern}`);
    
    return cron.schedule(cronPattern, callback, {
      scheduled: true,
      timezone: 'Asia/Jerusalem'
    });
  }

  /**
   * Convert Date to cron pattern
   */
  private dateToCronPattern(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Execute hide operation for a user
   */
  private async executeHideOperation(userId: string): Promise<void> {
    try {
      console.log(`🕯️ HIDE: Starting hide operation for user ${userId}`);
      
      let totalHidden = 0;

      // Hide YouTube videos
      try {
        const ytToken = await storage.getAuthToken('youtube', userId);
        if (ytToken?.accessToken) {
          console.log(`📺 Hiding YouTube videos for user ${userId}`);
          
          // Call the existing YouTube hide API endpoint directly
          const result = await this.callYouTubeHideAPI(userId, ytToken.accessToken);
          totalHidden += result.hiddenCount || 0;
          console.log(`✅ YouTube: Hidden ${result.hiddenCount || 0} videos`);
        }
      } catch (error) {
        console.error(`❌ YouTube hide failed for user ${userId}:`, error);
      }

      // Hide Facebook posts
      try {
        const fbToken = await storage.getAuthToken('facebook', userId);
        if (fbToken?.accessToken) {
          console.log(`📘 Hiding Facebook posts for user ${userId}`);
          
          // Call the existing Facebook hide API endpoint directly
          const result = await this.callFacebookHideAPI(userId, fbToken.accessToken);
          totalHidden += result.hiddenCount || 0;
          console.log(`✅ Facebook: Hidden ${result.hiddenCount || 0} posts`);
        }
      } catch (error) {
        console.error(`❌ Facebook hide failed for user ${userId}:`, error);
      }

      // Add history entry
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "automatic",
        success: totalHidden > 0,
        affectedItems: totalHidden,
        error: totalHidden === 0 ? "No content was hidden" : undefined
      }, userId);

      console.log(`✅ HIDE COMPLETE: User ${userId}, Total hidden: ${totalHidden}`);
      
    } catch (error) {
      console.error(`❌ Hide operation failed for user ${userId}:`, error);
    }
  }

  /**
   * Execute restore operation for a user
   */
  private async executeRestoreOperation(userId: string): Promise<void> {
    try {
      console.log(`✨ RESTORE: Starting restore operation for user ${userId}`);
      
      let totalRestored = 0;

      // Restore YouTube videos
      try {
        const ytToken = await storage.getAuthToken('youtube', userId);
        if (ytToken?.accessToken) {
          console.log(`📺 Restoring YouTube videos for user ${userId}`);
          
          const result = await this.callYouTubeShowAPI(userId, ytToken.accessToken);
          totalRestored += result.restoredCount || 0;
          console.log(`✅ YouTube: Restored ${result.restoredCount || 0} videos`);
        }
      } catch (error) {
        console.error(`❌ YouTube restore failed for user ${userId}:`, error);
      }

      // Restore Facebook posts
      try {
        const fbToken = await storage.getAuthToken('facebook', userId);
        if (fbToken?.accessToken) {
          console.log(`📘 Restoring Facebook posts for user ${userId}`);
          
          const result = await this.callFacebookShowAPI(userId, fbToken.accessToken);
          totalRestored += result.restoredCount || 0;
          console.log(`✅ Facebook: Restored ${result.restoredCount || 0} posts`);
        }
      } catch (error) {
        console.error(`❌ Facebook restore failed for user ${userId}:`, error);
      }

      // Add history entry
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "automatic",
        success: totalRestored > 0,
        affectedItems: totalRestored,
        error: totalRestored === 0 ? "No content was restored" : undefined
      }, userId);

      console.log(`✅ RESTORE COMPLETE: User ${userId}, Total restored: ${totalRestored}`);
      
    } catch (error) {
      console.error(`❌ Restore operation failed for user ${userId}:`, error);
    }
  }

  /**
   * Call YouTube hide API
   */
  private async callYouTubeHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    // This would call the existing YouTube hide logic directly
    // For now, we'll simulate the API call - in production this should call the actual function
    console.log(`📺 Calling YouTube hide API for user ${userId}`);
    return { hiddenCount: 0 }; // Placeholder - implement actual API call
  }

  /**
   * Call YouTube show API
   */
  private async callYouTubeShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    console.log(`📺 Calling YouTube show API for user ${userId}`);
    return { restoredCount: 0 }; // Placeholder - implement actual API call
  }

  /**
   * Call Facebook hide API
   */
  private async callFacebookHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    console.log(`📘 Calling Facebook hide API for user ${userId}`);
    return { hiddenCount: 0 }; // Placeholder - implement actual API call
  }

  /**
   * Call Facebook show API
   */
  private async callFacebookShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    console.log(`📘 Calling Facebook show API for user ${userId}`);
    return { restoredCount: 0 }; // Placeholder - implement actual API call
  }

  /**
   * Clear all jobs for a specific user
   */
  private clearUserJobs(userId: string): void {
    const existingJobs = this.scheduledJobs.get(userId);
    if (existingJobs) {
      existingJobs.forEach(job => job.task.destroy());
      this.scheduledJobs.delete(userId);
      console.log(`🗑️ Cleared existing jobs for user ${userId}`);
    }
  }

  /**
   * Refresh scheduler for a specific user (called when user changes settings)
   */
  async refreshUser(userId: string): Promise<void> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found for refresh`);
        return;
      }

      console.log(`🔄 Refreshing scheduler for user ${user.email}`);
      await this.scheduleUserJobs(user);
      console.log(`✅ Refresh complete for user ${user.email}`);
    } catch (error) {
      console.error(`❌ Error refreshing user ${userId}:`, error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeUsers: number;
    totalJobs: number;
    userJobs: { userId: string; jobs: { type: string; scheduledTime: string }[] }[];
  } {
    const userJobs = Array.from(this.scheduledJobs.entries()).map(([userId, jobs]) => ({
      userId,
      jobs: jobs.map(job => ({
        type: job.type,
        scheduledTime: job.scheduledTime.toLocaleString('he-IL')
      }))
    }));

    return {
      isRunning: this.isRunning,
      activeUsers: this.scheduledJobs.size,
      totalJobs: Array.from(this.scheduledJobs.values()).reduce((total, jobs) => total + jobs.length, 0),
      userJobs
    };
  }
}

// Export singleton instance
export const automaticScheduler = AutomaticScheduler.getInstance();