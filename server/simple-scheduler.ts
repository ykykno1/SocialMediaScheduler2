/**
 * Simple Shabbat Scheduler - Just timing and notifications
 * The actual hide/show operations should be done manually using the existing working buttons
 */

import { CronJob } from 'cron';
import { enhancedStorage as storage } from './enhanced-storage.js';

interface ShabbatTimes {
  entryTime: Date;
  exitTime: Date;
  cityName: string;
  cityId: string;
}

export class SimpleShabbatScheduler {
  private static instance: SimpleShabbatScheduler;
  private cronJobs: Map<string, CronJob> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): SimpleShabbatScheduler {
    if (!SimpleShabbatScheduler.instance) {
      SimpleShabbatScheduler.instance = new SimpleShabbatScheduler();
    }
    return SimpleShabbatScheduler.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('Starting Simple Shabbat scheduler...');
    await this.calculateAndScheduleForAllUsers();
    this.isRunning = true;
    console.log('Simple Shabbat scheduler started successfully');
  }

  stop(): void {
    console.log('Stopping Simple Shabbat scheduler...');
    for (const [userId, job] of this.cronJobs.entries()) {
      try {
        job.stop();
        console.log(`Stopped scheduler for user ${userId}`);
      } catch (error) {
        console.error(`Error stopping scheduler for user ${userId}:`, error);
      }
    }
    this.cronJobs.clear();
    this.isRunning = false;
    console.log('Simple Shabbat scheduler stopped');
  }

  private async calculateAndScheduleForAllUsers(): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      console.log(`Total users in database: ${users.length}`);
      
      const premiumUsers = users.filter((user: any) => user.accountType === 'premium');
      console.log(`Found ${premiumUsers.length} premium users for Shabbat scheduling`);

      for (const user of premiumUsers) {
        console.log(`Processing user ${user.id}: ${JSON.stringify({ 
          accountType: user.accountType, 
          shabbatCity: user.shabbatCity, 
          shabbatCityId: user.shabbatCityId 
        })}`);

        await this.scheduleForUser(user.id, user.shabbatCity, user.shabbatCityId);
      }
    } catch (error) {
      console.error('Error calculating schedules for all users:', error);
    }
  }

  private async scheduleForUser(userId: string, cityName: string | null, cityId: string | null): Promise<void> {
    try {
      // Clear existing jobs for this user
      this.clearUserJobs(userId);

      if (cityId === 'admin') {
        console.log(`User ${userId} is using admin location - checking manual times`);
        await this.scheduleAdminUser(userId);
      } else if (cityId && cityName) {
        console.log(`Scheduling user ${userId} for city: ${cityName} (${cityId})`);
        await this.scheduleRegularUser(userId, cityId);
      } else {
        console.log(`User ${userId} has no location set - skipping scheduling`);
      }
    } catch (error) {
      console.error(`Error scheduling for user ${userId}:`, error);
    }
  }

  private async scheduleAdminUser(userId: string): Promise<void> {
    try {
      const adminTimes = await storage.getAdminShabbatTimes();
      
      if (adminTimes?.entryTime && adminTimes?.exitTime) {
        console.log(`Scheduling admin user ${userId} with manual times:`);
        console.log(`  Entry: ${adminTimes.entryTime.toLocaleString('he-IL')}`);
        console.log(`  Exit: ${adminTimes.exitTime.toLocaleString('he-IL')}`);

        this.scheduleNotification(userId, adminTimes.entryTime, 'hide');
        this.scheduleNotification(userId, adminTimes.exitTime, 'restore');
      } else {
        console.log(`Admin user ${userId} has no manual times set`);
      }
    } catch (error) {
      console.error(`Error scheduling admin user ${userId}:`, error);
    }
  }

  private async scheduleRegularUser(userId: string, cityId: string): Promise<void> {
    try {
      const shabbatTimes = await this.getShabbatTimesForCity(cityId);
      
      if (shabbatTimes) {
        console.log(`Scheduling regular user ${userId} for ${shabbatTimes.cityName}`);
        console.log(`  Entry: ${shabbatTimes.entryTime.toLocaleString('he-IL')}`);
        console.log(`  Exit: ${shabbatTimes.exitTime.toLocaleString('he-IL')}`);

        // Apply user timing preferences (default 1 hour before)
        const hideTime = new Date(shabbatTimes.entryTime.getTime() - (60 * 60 * 1000));
        
        this.scheduleNotification(userId, hideTime, 'hide');
        this.scheduleNotification(userId, shabbatTimes.exitTime, 'restore');
      }
    } catch (error) {
      console.error(`Error scheduling regular user ${userId}:`, error);
    }
  }

  private scheduleNotification(userId: string, time: Date, action: 'hide' | 'restore'): void {
    try {
      // Ensure time is a Date object
      const dateTime = time instanceof Date ? time : new Date(time);
      const cronPattern = this.dateToCronPattern(dateTime);
      const jobKey = `${userId}_${action}`;
      
      const job = new CronJob(cronPattern, () => {
        this.executeNotification(userId, action);
      }, null, true, 'Asia/Jerusalem');
      
      this.cronJobs.set(jobKey, job);
      
      console.log(`Scheduled ${action} notification for user ${userId} at ${dateTime.toLocaleString('he-IL')}`);
    } catch (error) {
      console.error(`Error scheduling ${action} notification for user ${userId}:`, error);
    }
  }

  private executeNotification(userId: string, action: 'hide' | 'restore'): void {
    console.log(`🕐 SHABBAT SCHEDULER: Time to ${action} content for user ${userId}`);
    console.log(`Please use the ${action === 'hide' ? 'Hide All' : 'Show All'} buttons manually`);
    
    // Add notification to history
    storage.addHistoryEntry({
      platform: 'auto' as any,
      action: action,
      timestamp: new Date(),
      success: true,
      affectedItems: 0,
      error: `Scheduler notification: Please ${action} content manually using the buttons`
    });
  }

  private async getShabbatTimesForCity(cityId: string): Promise<ShabbatTimes | null> {
    try {
      const coordinates = this.getCityCoordinates(cityId);
      if (!coordinates) return null;

      const shabbatTimes = await storage.getShabbatTimes(coordinates.lat, coordinates.lng);
      if (!shabbatTimes) return null;

      return {
        entryTime: shabbatTimes.entryTime,
        exitTime: shabbatTimes.exitTime,
        cityName: this.getCityName(cityId),
        cityId: cityId
      };
    } catch (error) {
      console.error(`Error getting Shabbat times for city ${cityId}:`, error);
      return null;
    }
  }

  private getCityCoordinates(cityId: string): { lat: number; lng: number } | null {
    const cityMap: Record<string, { lat: number; lng: number }> = {
      '281': { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
      '3': { lat: 31.7683, lng: 35.2137 },   // Jerusalem  
      '178': { lat: 32.7940, lng: 34.9896 }, // Haifa
      '379': { lat: 31.2530, lng: 34.7915 }, // Beer Sheva
      '531': { lat: 32.0853, lng: 34.7818 }  // Tel Aviv (duplicate)
    };
    
    return cityMap[cityId] || null;
  }

  private getCityName(cityId: string): string {
    const cityNames: Record<string, string> = {
      '281': 'תל אביב',
      '3': 'ירושלים',
      '178': 'חיפה', 
      '379': 'באר שבע',
      '531': 'תל אביב'
    };
    
    return cityNames[cityId] || 'עיר לא מוכרת';
  }

  private dateToCronPattern(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private clearUserJobs(userId: string): void {
    const keysToRemove = Array.from(this.cronJobs.keys()).filter(key => key.startsWith(userId));
    
    for (const key of keysToRemove) {
      const job = this.cronJobs.get(key);
      if (job) {
        try {
          job.stop();
          this.cronJobs.delete(key);
        } catch (error) {
          console.error(`Error stopping job ${key}:`, error);
        }
      }
    }
  }

  getStatus(): { isRunning: boolean; scheduledJobs: number; userCount: number } {
    return {
      isRunning: this.isRunning,
      scheduledJobs: this.cronJobs.size,
      userCount: new Set(Array.from(this.cronJobs.keys()).map(key => key.split('_')[0])).size
    };
  }

  async refreshAdminUser(userId: string): Promise<void> {
    console.log(`Refreshing admin user ${userId} scheduler`);
    await this.scheduleAdminUser(userId);
  }

  /**
   * Execute hide operation for a user - public method for manual triggering
   */
  async executeHideOperation(userId: string): Promise<void> {
    console.log(`🕐 SHABBAT SCHEDULER: Manual hide operation for user ${userId}`);
    console.log(`Please use the 'Hide All' buttons manually for Facebook and YouTube`);
    
    // Add notification to history
    storage.addHistoryEntry({
      platform: 'facebook' as any,
      action: 'hide',
      timestamp: new Date(),
      success: true,
      affectedItems: 0,
      error: `Manual hide operation triggered - use UI buttons`
    });
  }

  /**
   * Execute restore operation for a user - public method for manual triggering
   */
  async executeRestoreOperation(userId: string): Promise<void> {
    console.log(`🕐 SHABBAT SCHEDULER: Manual restore operation for user ${userId}`);
    console.log(`Please use the 'Show All' buttons manually for Facebook and YouTube`);
    
    // Add notification to history
    storage.addHistoryEntry({
      platform: 'facebook' as any,
      action: 'restore',
      timestamp: new Date(),
      success: true,
      affectedItems: 0,
      error: `Manual restore operation triggered - use UI buttons`
    });
  }
}

export const simpleScheduler = SimpleShabbatScheduler.getInstance();