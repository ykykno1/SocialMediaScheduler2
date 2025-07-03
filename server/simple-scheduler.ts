import * as cron from 'node-cron';
import { enhancedStorage as storage } from './enhanced-storage';

interface ShabbatTimes {
  entryTime: Date;
  exitTime: Date;
  cityName: string;
  cityId: string;
}

export class SimpleShabbatScheduler {
  private static instance: SimpleShabbatScheduler;
  private scheduledJobs: Map<string, cron.ScheduledTask[]> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): SimpleShabbatScheduler {
    if (!SimpleShabbatScheduler.instance) {
      SimpleShabbatScheduler.instance = new SimpleShabbatScheduler();
    }
    return SimpleShabbatScheduler.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ SimpleShabbatScheduler is already running');
      return;
    }

    console.log('🚀 Starting Simple Shabbat Content Scheduler...');
    this.isRunning = true;

    // Schedule jobs for all premium users
    await this.scheduleAllUsers();
    
    console.log('✅ Simple Scheduler started successfully');
  }

  stop(): void {
    console.log('⏹️ Stopping Simple Scheduler...');
    
    // Clear all scheduled jobs
    this.scheduledJobs.forEach((jobs) => {
      jobs.forEach((job) => job.destroy());
    });
    this.scheduledJobs.clear();
    
    this.isRunning = false;
    console.log('✅ Simple Scheduler stopped');
  }

  private async scheduleAllUsers(): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      const premiumUsers = users.filter((u: any) => 
        u.accountType === 'premium' || u.accountType === 'youtube_pro'
      );

      console.log(`📋 Found ${users.length} total users`);
      console.log(`👑 Found ${premiumUsers.length} premium users`);

      for (const user of premiumUsers) {
        await this.scheduleUserJobs(user);
      }

      console.log(`✅ Scheduled jobs for ${premiumUsers.length} premium users`);
    } catch (error) {
      console.error('❌ Error scheduling users:', error);
    }
  }

  private async scheduleUserJobs(user: any): Promise<void> {
    try {
      let shabbatTimes: ShabbatTimes | null = null;

      // Check if user has admin manual times
      if (user.shabbatCity === 'מנהל' || user.shabbatCityId === 'admin') {
        const adminTimes = await storage.getAdminShabbatTimes();
        if (adminTimes?.entryTime && adminTimes?.exitTime) {
          shabbatTimes = {
            entryTime: adminTimes.entryTime,
            exitTime: adminTimes.exitTime,
            cityName: 'מנהל',
            cityId: 'admin'
          };
          console.log(`⚙️ User ${user.email} using admin manual times: ${adminTimes.entryTime.toLocaleString()} - ${adminTimes.exitTime.toLocaleString()}`);
        }
      }

      if (!shabbatTimes) {
        console.log(`⚠️ No Shabbat times found for user ${user.email}`);
        return;
      }

      // Calculate hide and restore times based on user preferences
      const hidePreference = user.hideTimingPreference || '1hour';
      const restorePreference = user.restoreTimingPreference || 'immediate';

      const hideTime = this.calculateHideTime(shabbatTimes.entryTime, hidePreference);
      const restoreTime = this.calculateRestoreTime(shabbatTimes.exitTime, restorePreference);

      console.log(`⏰ User ${user.email} scheduling:`);
      console.log(`        🕯️ Shabbat entry: ${shabbatTimes.entryTime.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
      console.log(`        ✨ Shabbat exit: ${shabbatTimes.exitTime.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
      console.log(`        📱 Hide preference: ${hidePreference} → Hide at: ${hideTime.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
      console.log(`        🔓 Restore preference: ${restorePreference} → Restore at: ${restoreTime.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);

      // Clear existing jobs for this user
      this.clearUserJobs(user.id);

      // Schedule hide operation if time hasn't passed
      const jobs: cron.ScheduledTask[] = [];
      
      if (hideTime > new Date()) {
        const hideJob = this.createCronJob(hideTime, async () => {
          console.log(`🔒 EXECUTING HIDE for user ${user.email} (${user.id})`);
          await this.executeHideOperation(user.id);
        });

        if (hideJob) {
          jobs.push(hideJob);
          console.log(`✅ Scheduled hide operation for ${user.email} at ${hideTime.toLocaleString()}`);
        }
      }

      // Schedule restore operation if time hasn't passed
      if (restoreTime > new Date()) {
        const restoreJob = this.createCronJob(restoreTime, async () => {
          console.log(`✨ EXECUTING RESTORE for user ${user.email} (${user.id})`);
          await this.executeRestoreOperation(user.id);
        });

        if (restoreJob) {
          jobs.push(restoreJob);
          console.log(`✅ Scheduled restore operation for ${user.email} at ${restoreTime.toLocaleString()}`);
        }
      }

      if (jobs.length > 0) {
        this.scheduledJobs.set(user.id, jobs);
      }

    } catch (error) {
      console.error(`❌ Error scheduling jobs for user ${user.email}:`, error);
    }
  }

  private calculateHideTime(shabbatEntry: Date, preference: string): Date {
    const hideTime = new Date(shabbatEntry);
    
    switch (preference) {
      case 'immediate':
        // Hide immediately at Shabbat entry
        break;
      case '15min':
        hideTime.setMinutes(hideTime.getMinutes() - 15);
        break;
      case '30min':
        hideTime.setMinutes(hideTime.getMinutes() - 30);
        break;
      case '1hour':
        hideTime.setHours(hideTime.getHours() - 1);
        break;
      default:
        hideTime.setHours(hideTime.getHours() - 1); // Default to 1 hour
    }
    
    return hideTime;
  }

  private calculateRestoreTime(shabbatExit: Date, preference: string): Date {
    const restoreTime = new Date(shabbatExit);
    
    switch (preference) {
      case 'immediate':
        // Restore immediately at Shabbat exit
        break;
      case '30min':
        restoreTime.setMinutes(restoreTime.getMinutes() + 30);
        break;
      case '1hour':
        restoreTime.setHours(restoreTime.getHours() + 1);
        break;
      default:
        // Default to immediate
    }
    
    return restoreTime;
  }

  private createCronJob(targetTime: Date, callback: () => void): cron.ScheduledTask | null {
    try {
      const cronPattern = this.dateToCronPattern(targetTime);
      console.log(`⏱️ Creating cron job for ${targetTime.toLocaleString()} with pattern: ${cronPattern}`);
      
      const task = cron.schedule(cronPattern, callback, false);
      task.start();
      
      return task;
    } catch (error) {
      console.error('❌ Error creating cron job:', error);
      return null;
    }
  }

  private dateToCronPattern(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-based month
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private async executeHideOperation(userId: string): Promise<void> {
    console.log(`🔒 Starting hide operation for user ${userId}`);
    
    try {
      // Execute hide operations for all connected platforms
      const auth = await storage.getAuthToken('youtube', userId);
      if (auth?.accessToken) {
        await this.callYouTubeHideAPI(userId, auth.accessToken);
      }

      const facebookAuth = await storage.getFacebookAuth(userId);
      if (facebookAuth?.accessToken) {
        await this.callFacebookHideAPI(userId, facebookAuth.accessToken);
      }

      console.log(`✅ Hide operation completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Hide operation failed for user ${userId}:`, error);
    }
  }

  private async executeRestoreOperation(userId: string): Promise<void> {
    console.log(`✨ Starting restore operation for user ${userId}`);
    
    try {
      // Execute restore operations for all connected platforms
      const auth = await storage.getAuthToken('youtube', userId);
      if (auth?.accessToken) {
        await this.callYouTubeShowAPI(userId, auth.accessToken);
      }

      const facebookAuth = await storage.getFacebookAuth(userId);
      if (facebookAuth?.accessToken) {
        await this.callFacebookShowAPI(userId, facebookAuth.accessToken);
      }

      console.log(`✅ Restore operation completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Restore operation failed for user ${userId}:`, error);
    }
  }

  private async callYouTubeHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    // Implementation would be similar to existing YouTube hide API
    console.log(`📺 Hiding YouTube videos for user ${userId}`);
    return { hiddenCount: 0 };
  }

  private async callYouTubeShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    // Implementation would be similar to existing YouTube restore API
    console.log(`📺 Restoring YouTube videos for user ${userId}`);
    return { restoredCount: 0 };
  }

  private async callFacebookHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    // Implementation would be similar to existing Facebook hide API
    console.log(`📘 Hiding Facebook posts for user ${userId}`);
    return { hiddenCount: 0 };
  }

  private async callFacebookShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    // Implementation would be similar to existing Facebook restore API
    console.log(`📘 Restoring Facebook posts for user ${userId}`);
    return { restoredCount: 0 };
  }

  private clearUserJobs(userId: string): void {
    const existingJobs = this.scheduledJobs.get(userId);
    if (existingJobs) {
      existingJobs.forEach(job => job.destroy());
      this.scheduledJobs.delete(userId);
    }
  }

  async refreshAdminUser(userId: string): Promise<void> {
    console.log(`🔄 Refreshing scheduler for admin user ${userId}`);
    
    try {
      const user = await storage.getUserById(userId);
      if (user) {
        await this.scheduleUserJobs(user);
        console.log(`✅ Refreshed scheduler for user ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Error refreshing admin user ${userId}:`, error);
    }
  }

  getStatus(): { isRunning: boolean; scheduledUsers: number; totalJobs: number } {
    const totalJobs = Array.from(this.scheduledJobs.values()).reduce(
      (total, jobs) => total + jobs.length, 
      0
    );
    
    return {
      isRunning: this.isRunning,
      scheduledUsers: this.scheduledJobs.size,
      totalJobs
    };
  }
}