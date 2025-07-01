/**
 * Shabbat Scheduler - Automatic content hiding and restoration
 * Handles automatic hiding 1 hour before Shabbat and restoration at Shabbat exit
 */

import { storage } from './database-storage';
import { CronJob } from 'cron';

interface ShabbatTimes {
  entryTime: Date;
  exitTime: Date;
  cityName: string;
  cityId: string;
}

interface UserShabbatSchedule {
  userId: string;
  shabbatTimes: ShabbatTimes;
  hideTime: Date; // 1 hour before Shabbat entry
  restoreTime: Date; // At Shabbat exit
}

export class ShabbatScheduler {
  private static instance: ShabbatScheduler;
  private cronJobs: Map<string, CronJob> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): ShabbatScheduler {
    if (!ShabbatScheduler.instance) {
      ShabbatScheduler.instance = new ShabbatScheduler();
    }
    return ShabbatScheduler.instance;
  }

  /**
   * Start the scheduler - calculates Shabbat times for all premium users
   * and schedules automatic hide/restore operations
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Shabbat scheduler is already running');
      return;
    }

    console.log('Starting Shabbat scheduler...');
    this.isRunning = true;

    // Schedule calculation of Shabbat times every hour
    const scheduleJob = new CronJob('0 * * * *', async () => {
      await this.calculateAndScheduleForAllUsers();
    });

    scheduleJob.start();
    this.cronJobs.set('schedule-calculator', scheduleJob);

    // Initial calculation
    await this.calculateAndScheduleForAllUsers();

    console.log('Shabbat scheduler started successfully');
  }

  /**
   * Stop the scheduler and clear all scheduled jobs
   */
  stop(): void {
    console.log('Stopping Shabbat scheduler...');
    
    for (const [jobId, job] of this.cronJobs) {
      job.stop();
      job.destroy();
      console.log(`Stopped job: ${jobId}`);
    }
    
    this.cronJobs.clear();
    this.isRunning = false;
    console.log('Shabbat scheduler stopped');
  }

  /**
   * Calculate Shabbat times for all premium users and schedule operations
   */
  private async calculateAndScheduleForAllUsers(): Promise<void> {
    try {
      console.log('Calculating Shabbat times for all users...');
      
      const allUsers = await storage.getAllUsers();
      const premiumUsers = allUsers.filter(user => 
        user.accountType === 'premium' || user.accountType === 'youtube_pro'
      );

      console.log(`Found ${premiumUsers.length} premium users for Shabbat scheduling`);

      for (const user of premiumUsers) {
        try {
          await this.scheduleForUser(user.id, user.shabbatCity, user.shabbatCityId);
        } catch (error) {
          console.error(`Failed to schedule for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error calculating Shabbat times for users:', error);
    }
  }

  /**
   * Schedule hide/restore operations for a specific user
   */
  private async scheduleForUser(userId: string, cityName: string | null, cityId: string | null): Promise<void> {
    if (!cityName || !cityId) {
      console.log(`User ${userId} has no Shabbat location set, skipping`);
      return;
    }

    try {
      // Get Shabbat times for this user's location
      const shabbatTimes = await this.getShabbatTimesForCity(cityId);
      if (!shabbatTimes) {
        console.error(`Failed to get Shabbat times for city ${cityName} (${cityId})`);
        return;
      }

      // Calculate hide time (1 hour before Shabbat entry)
      const hideTime = new Date(shabbatTimes.entryTime.getTime() - (60 * 60 * 1000));
      const restoreTime = shabbatTimes.exitTime;

      console.log(`Scheduling for user ${userId} in ${cityName}:`);
      console.log(`  Hide time: ${hideTime.toLocaleString('he-IL')}`);
      console.log(`  Restore time: ${restoreTime.toLocaleString('he-IL')}`);

      // Clear existing jobs for this user
      this.clearUserJobs(userId);

      // Schedule hide operation
      this.scheduleHideOperation(userId, hideTime);

      // Schedule restore operation
      this.scheduleRestoreOperation(userId, restoreTime);

    } catch (error) {
      console.error(`Error scheduling for user ${userId}:`, error);
    }
  }

  /**
   * Get Shabbat times for a specific city
   */
  private async getShabbatTimesForCity(cityId: string): Promise<ShabbatTimes | null> {
    try {
      // Calculate coordinates for the city (simplified - in production would use a proper mapping)
      const coordinates = this.getCityCoordinates(cityId);
      if (!coordinates) {
        console.error(`No coordinates found for city ID ${cityId}`);
        return null;
      }

      const shabbatTimes = await storage.getShabbatTimes(coordinates.lat, coordinates.lng);
      if (!shabbatTimes) {
        console.error(`Failed to get Shabbat times for coordinates ${coordinates.lat}, ${coordinates.lng}`);
        return null;
      }

      return {
        entryTime: new Date(shabbatTimes.candleLighting),
        exitTime: new Date(shabbatTimes.havdalah),
        cityName: shabbatTimes.location || 'Unknown',
        cityId: cityId
      };
    } catch (error) {
      console.error(`Error getting Shabbat times for city ${cityId}:`, error);
      return null;
    }
  }

  /**
   * Get coordinates for a city ID (simplified mapping)
   */
  private getCityCoordinates(cityId: string): { lat: number; lng: number } | null {
    // This is a simplified mapping - in production this would be in the database
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      '531': { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
      '281': { lat: 31.7683, lng: 35.2137 }, // Jerusalem
      '294': { lat: 32.7940, lng: 34.9896 }, // Haifa
      '179': { lat: 31.2518, lng: 34.7915 }, // Beer Sheva
      '233': { lat: 32.3215, lng: 34.8532 }, // Netanya
    };

    return cityCoordinates[cityId] || null;
  }

  /**
   * Schedule hide operation for a user at specific time
   */
  private scheduleHideOperation(userId: string, hideTime: Date): void {
    const now = new Date();
    
    // Only schedule if the time is in the future
    if (hideTime <= now) {
      console.log(`Hide time for user ${userId} is in the past, skipping`);
      return;
    }

    const jobId = `hide-${userId}`;
    const cronPattern = this.dateToCronPattern(hideTime);
    
    const hideJob = new CronJob(cronPattern, async () => {
      await this.executeHideOperation(userId);
    }, null, true, 'Asia/Jerusalem');

    this.cronJobs.set(jobId, hideJob);
    console.log(`Scheduled hide operation for user ${userId} at ${hideTime.toLocaleString('he-IL')}`);
  }

  /**
   * Schedule restore operation for a user at specific time
   */
  private scheduleRestoreOperation(userId: string, restoreTime: Date): void {
    const now = new Date();
    
    // Only schedule if the time is in the future
    if (restoreTime <= now) {
      console.log(`Restore time for user ${userId} is in the past, skipping`);
      return;
    }

    const jobId = `restore-${userId}`;
    const cronPattern = this.dateToCronPattern(restoreTime);
    
    const restoreJob = new CronJob(cronPattern, async () => {
      await this.executeRestoreOperation(userId);
    }, null, true, 'Asia/Jerusalem');

    this.cronJobs.set(jobId, restoreJob);
    console.log(`Scheduled restore operation for user ${userId} at ${restoreTime.toLocaleString('he-IL')}`);
  }

  /**
   * Execute hide operation for a user
   */
  private async executeHideOperation(userId: string): Promise<void> {
    try {
      console.log(`Executing hide operation for user ${userId}`);
      
      // Check if user has Facebook connected
      const facebookAuth = await storage.getAuthToken('facebook', userId);
      if (facebookAuth) {
        await this.hideFacebookPosts(userId, facebookAuth.accessToken);
      }

      // Check if user has YouTube connected
      const youtubeAuth = await storage.getAuthToken('youtube', userId);
      if (youtubeAuth) {
        await this.hideYouTubePosts(userId, youtubeAuth.accessToken);
      }

      // Add to history
      storage.addHistoryEntry({
        platform: 'auto',
        action: 'hide',
        status: 'success',
        userId: userId,
        details: 'Automatic Shabbat content hiding',
        timestamp: new Date(),
      });

      console.log(`Hide operation completed for user ${userId}`);
    } catch (error) {
      console.error(`Error executing hide operation for user ${userId}:`, error);
      
      // Add error to history
      storage.addHistoryEntry({
        platform: 'auto',
        action: 'hide',
        status: 'error',
        userId: userId,
        details: `Error: ${(error as Error).message}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Execute restore operation for a user
   */
  private async executeRestoreOperation(userId: string): Promise<void> {
    try {
      console.log(`Executing restore operation for user ${userId}`);
      
      // Check if user has Facebook connected
      const facebookAuth = await storage.getAuthToken('facebook', userId);
      if (facebookAuth) {
        await this.restoreFacebookPosts(userId, facebookAuth.accessToken);
      }

      // Check if user has YouTube connected
      const youtubeAuth = await storage.getAuthToken('youtube', userId);
      if (youtubeAuth) {
        await this.restoreYouTubePosts(userId, youtubeAuth.accessToken);
      }

      // Add to history
      storage.addHistoryEntry({
        platform: 'auto',
        action: 'restore',
        status: 'success',
        userId: userId,
        details: 'Automatic Shabbat content restoration',
        timestamp: new Date(),
      });

      console.log(`Restore operation completed for user ${userId}`);
    } catch (error) {
      console.error(`Error executing restore operation for user ${userId}:`, error);
      
      // Add error to history
      storage.addHistoryEntry({
        platform: 'auto',
        action: 'restore',
        status: 'error',
        userId: userId,
        details: `Error: ${(error as Error).message}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Hide Facebook posts for a user
   */
  private async hideFacebookPosts(userId: string, accessToken: string): Promise<void> {
    // Implementation for hiding Facebook posts
    // This would integrate with the Facebook API to set posts to private
    console.log(`Hiding Facebook posts for user ${userId}`);
    
    // TODO: Implement Facebook posts hiding using Graph API
  }

  /**
   * Restore Facebook posts for a user
   */
  private async restoreFacebookPosts(userId: string, accessToken: string): Promise<void> {
    // Implementation for restoring Facebook posts
    console.log(`Restoring Facebook posts for user ${userId}`);
    
    // TODO: Implement Facebook posts restoration using Graph API
  }

  /**
   * Hide YouTube videos for a user
   */
  private async hideYouTubePosts(userId: string, accessToken: string): Promise<void> {
    // Implementation for hiding YouTube videos
    console.log(`Hiding YouTube videos for user ${userId}`);
    
    // TODO: Implement YouTube videos hiding using YouTube Data API
  }

  /**
   * Restore YouTube videos for a user
   */
  private async restoreYouTubePosts(userId: string, accessToken: string): Promise<void> {
    // Implementation for restoring YouTube videos
    console.log(`Restoring YouTube videos for user ${userId}`);
    
    // TODO: Implement YouTube videos restoration using YouTube Data API
  }

  /**
   * Convert a Date to cron pattern for one-time execution
   */
  private dateToCronPattern(date: Date): string {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minutes} ${hours} ${day} ${month} *`;
  }

  /**
   * Clear all scheduled jobs for a user
   */
  private clearUserJobs(userId: string): void {
    const hideJobId = `hide-${userId}`;
    const restoreJobId = `restore-${userId}`;
    
    [hideJobId, restoreJobId].forEach(jobId => {
      const job = this.cronJobs.get(jobId);
      if (job) {
        job.stop();
        job.destroy();
        this.cronJobs.delete(jobId);
        console.log(`Cleared job: ${jobId}`);
      }
    });
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    jobs: string[];
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.cronJobs.size,
      jobs: Array.from(this.cronJobs.keys())
    };
  }
}

export default ShabbatScheduler;