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

import { hideAll, restoreAll } from "./simple-scheduler";

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
      console.log(`Total users in database: ${allUsers.length}`);

      const premiumUsers = allUsers.filter(user => 
        user.accountType === 'premium' || user.accountType === 'youtube_pro'
      );

      console.log(`Found ${premiumUsers.length} premium users for Shabbat scheduling`);

      for (const user of premiumUsers) {
        console.log(`Processing user ${user.id}:`, {
          accountType: user.accountType,
          shabbatCity: user.shabbatCity,
          shabbatCityId: user.shabbatCityId
        });

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

    // Special handling for admin users with manual times
    if (cityId === 'admin') {
      console.log(`User ${userId} is using admin location - checking manual times`);
      await this.scheduleAdminUser(userId);
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
      console.log("🕯️ SHABBAT SCHEDULER: Time to hide content for user", userId);
hideAll(userId);
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
      console.log("✨ SHABBAT SCHEDULER: Time to restore content for user", userId);
restoreAll(userId);
    }, null, true, 'Asia/Jerusalem');

    this.cronJobs.set(jobId, restoreJob);
    console.log(`Scheduled restore operation for user ${userId} at ${restoreTime.toLocaleString('he-IL')}`);
  }

  /**
   * Refresh scheduler for admin user when manual times change
   */
  async refreshAdminUser(userId: string): Promise<void> {
    console.log(`Refreshing admin user ${userId} scheduler`);
    await this.scheduleAdminUser(userId);
  }

  /**
   * Schedule operations for admin user based on manual times
   */
  private async scheduleAdminUser(userId: string): Promise<void> {
    try {
      const adminTimes = await storage.getAdminShabbatTimes();
      if (!adminTimes || !adminTimes.entryTime || !adminTimes.exitTime) {
        console.log(`User ${userId} has admin location but no manual times set, skipping`);
        return;
      }

      const entryTime = new Date(adminTimes.entryTime);
      const exitTime = new Date(adminTimes.exitTime);
      const now = new Date();

      console.log(`Scheduling admin user ${userId} with manual times:`);
      console.log(`  Entry: ${entryTime.toLocaleString('he-IL')}`);
      console.log(`  Exit: ${exitTime.toLocaleString('he-IL')}`);

      // Clear any existing jobs for this user
      this.clearUserJobs(userId);

      // Immediate check if we're currently in Shabbat time
      if (now >= entryTime && now <= exitTime) {
        console.log(`Current time is during admin Shabbat - HIDING content immediately for user ${userId}`);
        console.log("🕯️ SHABBAT SCHEDULER: Time to hide content for user", userId);
hideAll(userId);
      } else if (now > exitTime) {
        console.log(`Current time is after admin Shabbat - RESTORING content immediately for user ${userId}`);
        console.log("✨ SHABBAT SCHEDULER: Time to restore content for user", userId);
restoreAll(userId);
      }

      // Schedule future operations
      this.scheduleHideOperation(userId, entryTime);
      this.scheduleRestoreOperation(userId, exitTime);

    } catch (error) {
      console.error(`Failed to schedule admin user ${userId}:`, error);
    }
  }

  /**
   * Execute hide operation for a user - public method for manual triggering
   */
  async executeHideOperation(userId: string): Promise<void> {
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
   * Execute restore operation for a user - public method for manual triggering
   */
  async executeRestoreOperation(userId: string): Promise<void> {
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
    try {
      console.log(`Hiding Facebook posts for user ${userId}`);

      // Get Facebook posts using the storage
      const posts = storage.getCachedPosts();

      if (posts.length === 0) {
        console.log(`No Facebook posts found for user ${userId}`);
        return;
      }

      // Filter posts that should be hidden (visible posts only)
      const postsToHide = posts.filter(post => 
        !post.isHidden && !post.willBeHidden
      );

      if (postsToHide.length === 0) {
        console.log(`No Facebook posts to hide for user ${userId}`);
        return;
      }

      console.log(`Attempting to hide ${postsToHide.length} Facebook posts for user ${userId}`);

      let successCount = 0;

      // Process each post
      for (const post of postsToHide) {
        try {
          const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
          const formData = new URLSearchParams();
          formData.append('privacy', '{"value":"ONLY_ME"}');
          formData.append('access_token', accessToken);

          const updateResponse = await fetch(updateUrl, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
          });

          if (updateResponse.ok) {
            successCount++;
            console.log(`Successfully hid Facebook post ${post.id}`);
          } else {
            console.error(`Failed to hide Facebook post ${post.id}`);
          }
        } catch (error) {
          console.error(`Error hiding Facebook post ${post.id}:`, error);
        }
      }

      console.log(`Successfully hid ${successCount} Facebook posts for user ${userId}`);

      // Add to history
      storage.addHistoryEntry({
        platform: 'facebook',
        action: 'hide',
        timestamp: new Date(),
        details: `Automatic Shabbat hide: ${successCount} posts hidden`
      });
    } catch (error) {
      console.error(`Error hiding Facebook posts for user ${userId}:`, error);
    }
  }

  /**
   * Restore Facebook posts for a user
   */
  private async restoreFacebookPosts(userId: string, accessToken: string): Promise<void> {
    try {
      console.log(`Restoring Facebook posts for user ${userId}`);

      // Call the existing show-all endpoint
      const response = await fetch(`http://localhost:5000/api/facebook/show-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully restored Facebook posts for user ${userId}:`, data);

        // Add to history
        storage.addHistoryEntry({
          platform: 'facebook',
          action: 'restore',
          timestamp: new Date(),
          userId: userId,
          details: `Automatic Shabbat restore: ${data.restoredCount || 'all'} posts restored`
        });
      } else {
        console.error(`Failed to restore Facebook posts for user ${userId}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error restoring Facebook posts for user ${userId}:`, error);
    }
  }

  /**
   * Hide YouTube videos for a user
   */
  private async hideYouTubePosts(userId: string, accessToken: string): Promise<void> {
    try {
      console.log(`Hiding YouTube videos for user ${userId}`);

      // Get all user's videos from YouTube API
      let allVideos: any[] = [];
      let nextPageToken = '';

      do {
        const listUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&access_token=${accessToken}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

        const listResponse = await fetch(listUrl);

        if (!listResponse.ok) {
          console.error(`Failed to fetch YouTube videos for user ${userId}`);
          return;
        }

        const listData = await listResponse.json();
        allVideos = allVideos.concat(listData.items || []);
        nextPageToken = listData.nextPageToken || '';

      } while (nextPageToken);

      if (allVideos.length === 0) {
        console.log(`No YouTube videos found for user ${userId}`);
        return;
      }

      console.log(`Found ${allVideos.length} YouTube videos for user ${userId}`);

      let hiddenCount = 0;
      let errors: any[] = [];

      // Process each video
      for (const video of allVideos) {
        const videoId = video.id.videoId;

        try {
          // Check if video is already locked (excluded from automation)
          const lockStatus = await storage.getVideoLockStatus(userId, videoId);

          if (lockStatus?.isLocked) {
            console.log(`Skipping locked video ${videoId} for user ${userId}`);
            continue;
          }

          // Get current video details to check privacy status
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&access_token=${accessToken}`;
          const detailsResponse = await fetch(detailsUrl);

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const videoDetails = detailsData.items?.[0];

            if (videoDetails) {
              const currentPrivacyStatus = videoDetails.status.privacyStatus;

              // Only hide if not already private
              if (currentPrivacyStatus !== 'private') {
                // Save original status for restoration
                await storage.saveVideoOriginalStatus(videoId, currentPrivacyStatus, userId);

                // Update video to private
                const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${accessToken}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: videoId,
                    status: {
                      privacyStatus: 'private'
                    }
                  })
                });

                if (updateResponse.ok) {
                  hiddenCount++;
                  console.log(`Successfully hid YouTube video ${videoId} for user ${userId}`);
                } else {
                  const errorData = await updateResponse.json();
                  errors.push({ videoId, error: errorData.error?.message });
                  // Remove saved status if hiding failed
                  await storage.clearVideoOriginalStatus(videoId, userId);
                }
              }
            }
          }
        } catch (error) {
          errors.push({ videoId, error: (error as Error).message });
        }
      }

      console.log(`Successfully hid ${hiddenCount} YouTube videos for user ${userId}`);

      // Add to history
      storage.addHistoryEntry({
        platform: 'youtube',
        action: 'hide',
        timestamp: new Date(),
        details: `Automatic Shabbat hide: ${hiddenCount} videos hidden`
      });
    } catch (error) {
      console.error(`Error hiding YouTube videos for user ${userId}:`, error);
    }
  }

  /**
   * Restore YouTube videos for a user
   */
  private async restoreYouTubePosts(userId: string, accessToken: string): Promise<void> {
    try {
      console.log(`Restoring YouTube videos for user ${userId}`);

      // Call the existing show-all endpoint
      const response = await fetch(`http://localhost:5000/api/youtube/show-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully restored YouTube videos for user ${userId}:`, data);

        // Add to history
        storage.addHistoryEntry({
          platform: 'youtube',
          action: 'restore',
          timestamp: new Date(),
          details: `Automatic Shabbat restore: ${data.restoredCount || 'all'} videos restored`
        });
      } else {
        console.error(`Failed to restore YouTube videos for user ${userId}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error restoring YouTube videos for user ${userId}:`, error);
    }
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