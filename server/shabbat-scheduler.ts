/**
 * Shabbat Scheduler - Automatic content hiding and restoration
 * Handles automatic hiding 1 hour before Shabbat and restoration at Shabbat exit
 */

import { storage } from './database-storage';
import { CronJob } from 'cron';
import { hideAll, restoreAll } from './simple-scheduler';

interface ShabbatTimes {
  entryTime: Date;
  exitTime: Date;
  cityName: string;
  cityId: string;
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

  async start(): Promise<void> {
    if (this.isRunning) return;
    console.log('Starting Shabbat scheduler...');
    this.isRunning = true;

    const scheduleJob = new CronJob('0 * * * *', async () => {
      await this.calculateAndScheduleForAllUsers();
    });

    scheduleJob.start();
    this.cronJobs.set('schedule-calculator', scheduleJob);

    await this.calculateAndScheduleForAllUsers();

    console.log('Shabbat scheduler started successfully');
  }

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

  private async calculateAndScheduleForAllUsers(): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      const premiumUsers = users.filter(u => u.accountType === 'premium' || u.accountType === 'youtube_pro');

      for (const user of premiumUsers) {
        await this.scheduleForUser(user.id, user.shabbatCity, user.shabbatCityId);
      }
    } catch (error) {
      console.error('Error in calculateAndScheduleForAllUsers:', error);
    }
  }

  private async scheduleForUser(userId: string, cityName: string | null, cityId: string | null): Promise<void> {
    if (!cityName || !cityId) return;
    if (cityId === 'admin') return this.scheduleAdminUser(userId);

    const times = await this.getShabbatTimesForCity(cityId);
    if (!times) return;

    const hideTime = new Date(times.entryTime.getTime() - 60 * 60 * 1000);
    const restoreTime = times.exitTime;

    this.clearUserJobs(userId);
    this.scheduleHideOperation(userId, hideTime);
    this.scheduleRestoreOperation(userId, restoreTime);
  }

  private async getShabbatTimesForCity(cityId: string): Promise<ShabbatTimes | null> {
    try {
      const coordinates = this.getCityCoordinates(cityId);
      if (!coordinates) return null;

      const times = await storage.getShabbatTimes(coordinates.lat, coordinates.lng);
      if (!times) return null;

      return {
        entryTime: new Date(times.candleLighting),
        exitTime: new Date(times.havdalah),
        cityName: times.location || 'Unknown',
        cityId
      };
    } catch (err) {
      console.error(`Error getting times for city ${cityId}`, err);
      return null;
    }
  }

  private getCityCoordinates(cityId: string): { lat: number; lng: number } | null {
    const coords: Record<string, { lat: number; lng: number }> = {
      '531': { lat: 32.0853, lng: 34.7818 },
      '281': { lat: 31.7683, lng: 35.2137 },
      '294': { lat: 32.7940, lng: 34.9896 },
      '179': { lat: 31.2518, lng: 34.7915 },
      '233': { lat: 32.3215, lng: 34.8532 },
    };
    return coords[cityId] || null;
  }

  private scheduleHideOperation(userId: string, time: Date): void {
    if (time <= new Date()) return;
    const jobId = `hide-${userId}`;
    const pattern = this.dateToCronPattern(time);
    const job = new CronJob(pattern, () => hideAll(userId), null, true, 'Asia/Jerusalem');
    this.cronJobs.set(jobId, job);
  }

  private scheduleRestoreOperation(userId: string, time: Date): void {
    if (time <= new Date()) return;
    const jobId = `restore-${userId}`;
    const pattern = this.dateToCronPattern(time);
    const job = new CronJob(pattern, () => restoreAll(userId), null, true, 'Asia/Jerusalem');
    this.cronJobs.set(jobId, job);
  }

  async refreshAdminUser(userId: string): Promise<void> {
    await this.scheduleAdminUser(userId);
  }

  private async scheduleAdminUser(userId: string): Promise<void> {
    try {
      const adminTimes = await storage.getAdminShabbatTimes();
      if (!adminTimes?.entryTime || !adminTimes?.exitTime) return;

      const entryTime = new Date(adminTimes.entryTime);
      const exitTime = new Date(adminTimes.exitTime);
      const now = new Date();

      this.clearUserJobs(userId);

      if (now >= entryTime && now <= exitTime) await hideAll(userId);
      else if (now > exitTime) await restoreAll(userId);

      this.scheduleHideOperation(userId, entryTime);
      this.scheduleRestoreOperation(userId, exitTime);
    } catch (err) {
      console.error(`Failed admin scheduling for ${userId}`, err);
    }
  }

  private dateToCronPattern(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  private clearUserJobs(userId: string): void {
    for (const id of [`hide-${userId}`, `restore-${userId}`]) {
      const job = this.cronJobs.get(id);
      if (job) {
        job.stop();
        job.destroy();
        this.cronJobs.delete(id);
      }
    }
  }

  getStatus(): { isRunning: boolean; activeJobs: number; jobs: string[] } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.cronJobs.size,
      jobs: Array.from(this.cronJobs.keys())
    };
  }
}

export default ShabbatScheduler;
