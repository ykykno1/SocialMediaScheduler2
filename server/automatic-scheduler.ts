import * as cron from 'node-cron';
import { enhancedStorage as storage } from './enhanced-storage';

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
    for (const [userId, jobs] of Array.from(this.scheduledJobs.entries())) {
      jobs.forEach((job: ScheduledJob) => job.task.destroy());
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
        // Use location-based Shabbat times (prefer Chabad from cache)
        shabbatTimes = await this.getShabbatTimesForLocation(user.shabbatCityId, user.shabbatCity, user.id);
      }

      if (!shabbatTimes) {
        console.log(`⚠️ No Shabbat times found for user ${user.email}`);
        return;
      }

      // Calculate hide and restore times based on user preferences
      const hideTime = this.calculateHideTime(shabbatTimes.entryTime, user.hideTimingPreference || '1hour');
      const restoreTime = this.calculateRestoreTime(shabbatTimes.exitTime, user.restoreTimingPreference || 'immediate');

      console.log(`⏰ User ${user.email} scheduling:
        🕯️ Shabbat entry: ${shabbatTimes.entryTime.toLocaleString('he-IL')}
        ✨ Shabbat exit: ${shabbatTimes.exitTime.toLocaleString('he-IL')}
        📱 Hide preference: ${user.hideTimingPreference || '1hour'} → Hide at: ${hideTime.toLocaleString('he-IL')}
        🔓 Restore preference: ${user.restoreTimingPreference || 'immediate'} → Restore at: ${restoreTime.toLocaleString('he-IL')}`);

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

          // Store the jobs (only if they were successfully created)
          const jobs: ScheduledJob[] = [];
          if (hideJob) {
            jobs.push({ task: hideJob, type: 'hide' as const, userId: user.id, scheduledTime: hideTime });
          }
          if (restoreJob) {
            jobs.push({ task: restoreJob, type: 'restore' as const, userId: user.id, scheduledTime: restoreTime });
          }
          
          if (jobs.length > 0) {
            this.scheduledJobs.set(user.id, jobs);
            console.log(`✅ Scheduled ${jobs.length} operations for ${user.email}`);
          }
        } else {
          // Only store hide job if restore time has passed and hide job was created
          if (hideJob) {
            this.scheduledJobs.set(user.id, [
              { task: hideJob, type: 'hide' as const, userId: user.id, scheduledTime: hideTime }
            ]);
            console.log(`✅ Scheduled hide operation for ${user.email} (restore time has passed)`);
          }
        }
      } else {
        console.log(`⚠️ Hide time has passed for user ${user.email}, checking if restore is needed`);
        
        // If hide time passed but restore time hasn't, schedule only restore
        console.log(`🔍 Checking restore time: ${restoreTime.toLocaleString('he-IL')} vs current: ${new Date().toLocaleString('he-IL')}`);
        if (restoreTime > new Date()) {
          console.log(`⏰ Restore time is in the future, creating cron job...`);
          const restoreJob = this.createCronJob(restoreTime, async () => {
            console.log(`✨ EXECUTING AUTOMATIC RESTORE for user ${user.email} (${user.id})`);
            await this.executeRestoreOperation(user.id);
          });

          if (restoreJob) {
            this.scheduledJobs.set(user.id, [
              { task: restoreJob, type: 'restore', userId: user.id, scheduledTime: restoreTime }
            ]);
            console.log(`✅ Scheduled restore operation for ${user.email} at ${restoreTime.toLocaleString('he-IL')}`);
          } else {
            console.log(`❌ Failed to create restore job for ${user.email} - cron job creation failed`);
          }
        } else {
          console.log(`⚠️ Restore time ${restoreTime.toLocaleString('he-IL')} has already passed, checking if immediate restore is needed`);
          
          // Check if user has hidden content that needs restoring
          const hiddenVideos = await storage.getAllVideoOriginalStatuses(user.id);
          const hiddenCount = Object.keys(hiddenVideos).length;
          
          if (hiddenCount > 0) {
            console.log(`🔧 Found ${hiddenCount} hidden videos for ${user.email} - executing immediate restore`);
            await this.executeRestoreOperation(user.id);
          } else {
            console.log(`✅ No hidden content found for ${user.email} - restore not needed`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error scheduling jobs for user ${user.email}:`, error);
    }
  }

  /**
   * Get Shabbat times for a location - prefer Chabad times from cache
   */
  private async getShabbatTimesForLocation(cityId: string, cityName: string, userId?: string): Promise<ShabbatTimes | null> {
    try {
      // First check if we have authentic Chabad times in cache
      if (userId && global.chabadTimesCache) {
        const cacheKey = `${userId}-${cityId}`;
        const cachedTimes = global.chabadTimesCache.get(cacheKey);
        
        if (cachedTimes && (Date.now() - cachedTimes.timestamp) < 24 * 60 * 60 * 1000) { // 24 hours cache
          console.log(`🕯️ Using authentic Chabad times for ${cityName}: ${cachedTimes.candleLighting} / ${cachedTimes.havdalah}`);
          
          // Convert times to Date objects for current Shabbat cycle
          const now = new Date();
          const friday = new Date(now);
          const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          
          // Logic: Only move to next Shabbat AFTER current Shabbat restore time has passed
          let daysUntilFriday = (5 - currentDay + 7) % 7;
          
          if (currentDay === 6) { // Saturday
            // If it's Saturday, check if restore time has passed
            const [exitHour, exitMin] = cachedTimes.havdalah.split(':').map(Number);
            const restoreHour = exitHour + 1; // 1 hour after havdalah
            
            if (now.getHours() > restoreHour || (now.getHours() === restoreHour && now.getMinutes() >= 0)) {
              // Restore time has passed, move to next Shabbat
              daysUntilFriday = 6; // Next Friday
            } else {
              // Still in current Shabbat cycle, use yesterday (Friday)
              daysUntilFriday = -1;
            }
          } else if (currentDay === 0 && now.getHours() < 2) { // Early Sunday morning
            // Might still be in previous Shabbat's restore window
            daysUntilFriday = -2; // Use previous Friday
          }
          
          friday.setDate(now.getDate() + daysUntilFriday);
          
          const saturday = new Date(friday);
          saturday.setDate(friday.getDate() + 1);
          
          // Parse Chabad times (format: HH:MM)
          const [entryHour, entryMin] = cachedTimes.candleLighting.split(':').map(Number);
          const [exitHour, exitMin] = cachedTimes.havdalah.split(':').map(Number);
          
          const entryTime = new Date(friday);
          entryTime.setHours(entryHour, entryMin, 0, 0);
          
          const exitTime = new Date(saturday);
          exitTime.setHours(exitHour, exitMin, 0, 0);
          
          return {
            entryTime,
            exitTime,
            cityName,
            cityId
          };
        }
      }
      
      // Fallback to HebCal API if no Chabad times available
      console.log(`🌍 Fetching Shabbat times for ${cityName} (${cityId}) using HebCal API (fallback)`);
      
      // City mapping from Chabad IDs to HebCal geonames or coordinates
      const cityMapping: Record<string, { geo?: string; lat?: number; lng?: number; name: string }> = {
        '531': { geo: 'geoname:293397', name: 'Tel Aviv' }, // Tel Aviv
        '281': { geo: 'geoname:281184', name: 'Jerusalem' }, // Jerusalem
        '280': { geo: 'geoname:294117', name: 'Haifa' }, // Haifa
        '543': { geo: 'geoname:295629', name: 'Eilat' }, // Eilat
        '294': { geo: 'geoname:294751', name: 'Beersheba' }, // Beersheba
        // Add fallback coordinates for unmapped cities
        'default': { lat: 32.0853, lng: 34.7818, name: 'Tel Aviv' } // Default to Tel Aviv
      };

      const cityInfo = cityMapping[cityId] || cityMapping['default'];
      
      // Get current date and appropriate Friday (current cycle vs next)
      const now = new Date();
      const friday = new Date(now);
      const currentDay = now.getDay();
      
      // Logic: Only move to next Shabbat AFTER current Shabbat cycle is complete
      let daysUntilFriday = (5 - currentDay + 7) % 7;
      
      if (currentDay === 6) { // Saturday
        // If it's Saturday, check if it's past typical restore time (22:00)
        if (now.getHours() >= 22) {
          // Late Saturday night - move to next Shabbat
          daysUntilFriday = 6;
        } else {
          // Still in current Shabbat cycle
          daysUntilFriday = -1;
        }
      } else if (currentDay === 0 && now.getHours() < 2) { // Early Sunday
        daysUntilFriday = -2; // Previous Friday
      }
      
      if (daysUntilFriday === 0 && now.getHours() >= 20) {
        friday.setDate(now.getDate() + 7); // Next Friday if it's already late Friday
      } else {
        friday.setDate(now.getDate() + daysUntilFriday);
      }

      // Format date for API (YYYY-MM-DD)
      const dateStr = friday.toISOString().split('T')[0];
      
      // Build HebCal API URL
      let apiUrl: string;
      if (cityInfo.geo) {
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=${cityInfo.geo.split(':')[1]}&date=${dateStr}`;
      } else {
        apiUrl = `https://www.hebcal.com/shabbat?cfg=json&latitude=${cityInfo.lat}&longitude=${cityInfo.lng}&date=${dateStr}`;
      }

      console.log(`📡 Calling HebCal API: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Shabbat-Robot/1.0 (https://shabbat-robot.replit.app)',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        console.log(`⚠️ HebCal API failed for ${cityName} (${cityId}): ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log(`⚠️ No Shabbat times in HebCal response for ${cityName}`);
        return null;
      }

      // Find candle lighting and havdalah times
      let candleLighting: Date | null = null;
      let havdalah: Date | null = null;

      for (const item of data.items) {
        if (item.category === 'candles' || item.title?.includes('Candle lighting')) {
          candleLighting = new Date(item.date);
        } else if (item.category === 'havdalah' || item.title?.includes('Havdalah')) {
          havdalah = new Date(item.date);
        }
      }

      if (!candleLighting) {
        console.log(`⚠️ Could not find candle lighting time for ${cityName}`);
        return null;
      }

      // If no havdalah found, estimate it (usually 42-72 minutes after sunset on Saturday)
      if (!havdalah) {
        havdalah = new Date(candleLighting);
        havdalah.setDate(havdalah.getDate() + 1); // Next day (Saturday)
        havdalah.setMinutes(havdalah.getMinutes() + 60); // Approximate havdalah time
        console.log(`📝 Estimated havdalah time for ${cityName}`);
      }

      console.log(`✅ Got HebCal times for ${cityName}: Entry ${candleLighting.toTimeString().slice(0,5)}, Exit ${havdalah.toTimeString().slice(0,5)}`);

      return {
        entryTime: candleLighting,
        exitTime: havdalah,
        cityName,
        cityId
      };

    } catch (error) {
      console.error(`❌ Error fetching HebCal times for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Calculate hide time based on user preference - with proper timezone handling
   */
  private calculateHideTime(shabbatEntry: Date, preference: string): Date {
    // Convert to Israeli time for accurate calculation
    const israelTime = this.convertToIsraeliTime(shabbatEntry);
    const hideTime = new Date(israelTime);
    
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
   * Calculate restore time based on user preference - with proper timezone handling
   */
  private calculateRestoreTime(shabbatExit: Date, preference: string): Date {
    // Convert to Israeli time for accurate calculation
    const israelTime = this.convertToIsraeliTime(shabbatExit);
    const restoreTime = new Date(israelTime);
    
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
   * Convert UTC time to Israeli time properly
   */
  private convertToIsraeliTime(utcDate: Date): Date {
    // If the date is already in Israeli timezone (like admin manual times), return as is
    if (this.isIsraeliTime(utcDate)) {
      return utcDate;
    }
    const israelTime = new Date(utcDate.toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));
    return israelTime;
  }

  /**
   * Convert Israeli time back to UTC for cron scheduling
   */
  private convertToUTC(israelTime: Date): Date {
    // Create a new date in UTC from Israeli time components
    const utcTime = new Date(Date.UTC(
      israelTime.getFullYear(),
      israelTime.getMonth(),
      israelTime.getDate(),
      israelTime.getHours(),
      israelTime.getMinutes(),
      israelTime.getSeconds()
    ));
    
    // Adjust for Israeli timezone offset (UTC+2 or UTC+3 depending on DST)
    const israelOffset = this.getIsraeliTimezoneOffset();
    return new Date(utcTime.getTime() - (israelOffset * 60 * 60 * 1000));
  }

  /**
   * Check if a date is already in Israeli timezone format
   */
  private isIsraeliTime(date: Date): boolean {
    // Check if this looks like a manually set Israeli time
    // Manual times from admin usually come with Israeli timezone already applied
    return true; // For now, assume admin times are correct
  }

  /**
   * Get current Israeli timezone offset in hours
   */
  private getIsraeliTimezoneOffset(): number {
    const now = new Date();
    const israelTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));
    const utcTime = new Date(now.toISOString());
    
    const diffMs = israelTime.getTime() - utcTime.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  }

  /**
   * Create a cron job for a specific date/time
   */
  private createCronJob(targetTime: Date, callback: () => void): cron.ScheduledTask | null {
    const cronPattern = this.dateToCronPattern(targetTime);
    
    if (!cronPattern) {
      // Time has already passed, don't create a job
      return null;
    }
    
    console.log(`⏱️ Creating cron job for ${targetTime.toLocaleString('he-IL')} with pattern: ${cronPattern}`);
    
    return cron.schedule(cronPattern, callback, {
      timezone: 'Asia/Jerusalem'
    });
  }

  /**
   * Convert Date to cron pattern - with proper timezone handling
   */
  private dateToCronPattern(date: Date): string | null {
    const now = new Date();
    
    // For admin manual times, treat the input date as already being in Israeli time
    // Don't double-convert it
    const targetTime = new Date(date);
    
    // Check if time has passed (compare in same timezone)
    if (targetTime <= now) {
      console.log(`⚠️ Time ${targetTime.toLocaleString('he-IL')} has already passed (current: ${now.toLocaleString('he-IL')}), skipping...`);
      return null;
    }
    
    // Use the target time directly for cron scheduling
    const minute = targetTime.getMinutes();
    const hour = targetTime.getHours();
    const day = targetTime.getDate();
    const month = targetTime.getMonth() + 1;
    
    console.log(`📅 Scheduling cron job for: ${targetTime.toLocaleString('he-IL')} (${hour}:${minute.toString().padStart(2, '0')})`);
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Execute hide operation for a user - public method for manual triggering
   */
  async executeHideOperation(userId: string): Promise<void> {
    try {
      console.log(`\n🔥 =================================`);
      console.log(`🔥 MANUAL HIDE OPERATION FOR USER: ${userId}`);
      console.log(`🔥 =================================`);
      console.log(`🕯️ HIDE: Starting hide operation for user ${userId}`);
      
      let totalHidden = 0;

      // Hide YouTube videos
      try {
        console.log(`🔍 Getting valid YouTube token for user ${userId}...`);
        const validToken = await this.getValidYouTubeToken(userId);
        
        if (validToken) {
          console.log(`📺 Hiding YouTube videos for user ${userId}`);
          
          // Call the existing YouTube hide API endpoint directly
          const result = await this.callYouTubeHideAPI(userId, validToken);
          totalHidden += result.hiddenCount || 0;
          console.log(`✅ YouTube: Hidden ${result.hiddenCount || 0} videos`);
        } else {
          console.log(`⚠️ No valid YouTube token available for user ${userId}`);
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
        platform: "youtube",
        success: totalHidden > 0,
        affectedItems: totalHidden,
        error: totalHidden === 0 ? "No content was hidden" : undefined
      });

      console.log(`✅ HIDE COMPLETE: User ${userId}, Total hidden: ${totalHidden}`);
      
    } catch (error) {
      console.error(`❌ Hide operation failed for user ${userId}:`, error);
    }
  }

  /**
   * Execute restore operation for a user - public method for manual triggering
   */
  async executeRestoreOperation(userId: string): Promise<void> {
    try {
      console.log(`✨ RESTORE: Starting restore operation for user ${userId}`);
      
      let totalRestored = 0;

      // Restore YouTube videos
      try {
        const validToken = await this.getValidYouTubeToken(userId);
        if (validToken) {
          console.log(`📺 Restoring YouTube videos for user ${userId}`);
          
          const result = await this.callYouTubeShowAPI(userId, validToken);
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
        platform: "youtube",
        success: totalRestored > 0,
        affectedItems: totalRestored,
        error: totalRestored === 0 ? "No content was restored" : undefined
      });

      console.log(`✅ RESTORE COMPLETE: User ${userId}, Total restored: ${totalRestored}`);
      
    } catch (error) {
      console.error(`❌ Restore operation failed for user ${userId}:`, error);
    }
  }

  /**
   * Get and refresh YouTube token if needed
   */
  private async getValidYouTubeToken(userId: string): Promise<string | null> {
    try {
      const ytToken = await storage.getAuthToken('youtube', userId);
      if (!ytToken?.accessToken) {
        console.log(`⚠️ No YouTube token found for user ${userId}`);
        return null;
      }

      // Check if token is expired and needs refresh
      const now = Date.now();
      const expiresAt = ytToken.expiresAt || 0;
      
      if (expiresAt <= now && ytToken.refreshToken) {
        console.log(`🔄 YouTube token expired for user ${userId}, attempting refresh...`);
        
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: ytToken.refreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (refreshResponse.ok) {
          const tokens = await refreshResponse.json();
          const updatedAuth = {
            ...ytToken,
            accessToken: tokens.access_token,
            expiresAt: Date.now() + (tokens.expires_in * 1000)
          };
          
          await storage.saveAuthToken(updatedAuth, userId);
          console.log(`✅ YouTube token refreshed successfully for user ${userId}`);
          return tokens.access_token;
        } else {
          console.error(`❌ Failed to refresh YouTube token for user ${userId}`);
          return null;
        }
      }
      
      return ytToken.accessToken;
    } catch (error) {
      console.error(`❌ Error getting valid YouTube token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Hide YouTube videos using existing API logic
   */
  private async callYouTubeHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    try {
      console.log(`📺 Hiding YouTube videos for user ${userId}`);
      
      // First get channel ID to fetch user's videos
      const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!channelResponse.ok) {
        throw new Error(`Failed to get channel info: ${channelResponse.status}`);
      }
      
      const channelData = await channelResponse.json() as any;
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist');
      }
      
      // Get videos from uploads playlist
      const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`;
      const videosResponse = await fetch(videosUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!videosResponse.ok) {
        const errorText = await videosResponse.text();
        console.error(`📺 YouTube API error response:`, {
          status: videosResponse.status,
          statusText: videosResponse.statusText,
          body: errorText
        });
        throw new Error(`YouTube API error: ${videosResponse.status} - ${errorText}`);
      }

      const playlistData = await videosResponse.json() as any;
      console.log(`📺 Got playlist items: ${playlistData.items?.length || 0} items`);
      
      // Extract video IDs from playlist items
      const videoIds = playlistData.items?.map((item: any) => {
        // In playlist items, video ID is in snippet.resourceId.videoId
        return item.snippet?.resourceId?.videoId;
      }).filter(Boolean) || [];
      
      if (videoIds.length === 0) {
        console.log(`📺 No videos found for user ${userId}`);
        return { hiddenCount: 0 };
      }
      
      console.log(`📺 Found ${videoIds.length} video IDs: ${videoIds.slice(0, 3).join(', ')}...`);
      
      // Now get full video details including privacy status
      const videos = await this.getVideoDetails(videoIds, accessToken);
      
      let hiddenCount = 0;
      
      console.log(`📺 Found ${videos.length} videos to process`);
      
      for (const video of videos) {
        try {
          // In videos API, the ID is directly in video.id (not video.id.videoId)
          const videoId = video.id;
          if (!videoId) {
            console.log(`❌ No video ID found for video:`, video);
            continue;
          }

          console.log(`\n📺 Processing video: ${videoId} (${video.snippet?.title})`);
          
          // Check if video is locked (protected from automation) - skip completely
          const lockStatus = await storage.getVideoLockStatus(userId, videoId);
          if (lockStatus?.isLocked) {
            console.log(`🔒 Skipping locked video: ${videoId} - protected from automation`);
            continue; // Skip locked videos completely - they should not be touched
          }

          // Check if video is already private/unlisted
          const currentStatus = video.status?.privacyStatus;
          console.log(`📺 Video ${videoId} current status: ${currentStatus}`);
          
          if (currentStatus === 'private') {
            console.log(`⏭️ Video ${videoId} already private, skipping`);
            continue;
          }
          
          // Save original status before hiding
          await storage.saveVideoOriginalStatus(videoId, currentStatus || 'public', userId);
          
          // Hide the video by setting it to private
          const updateUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: videoId,
              snippet: {
                title: video.snippet?.title || 'Video',
                description: video.snippet?.description || '',
                categoryId: video.snippet?.categoryId || '22'
              },
              status: { privacyStatus: 'private' }
            })
          });

          if (updateResponse.ok) {
            hiddenCount++;
            console.log(`✅ Hidden YouTube video: ${videoId}`);
          } else {
            const errorText = await updateResponse.text();
            console.error(`❌ Failed to hide video ${videoId}:`, updateResponse.status, errorText);
          }
        } catch (error) {
          console.error(`❌ Failed to hide YouTube video:`, error);
        }
      }

      return { hiddenCount };
    } catch (error) {
      console.error(`❌ YouTube hide operation failed:`, error);
      return { hiddenCount: 0 };
    }
  }

  /**
   * Restore YouTube videos using existing API logic
   */
  private async callYouTubeShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    try {
      console.log(`📺 Restoring YouTube videos for user ${userId}`);
      
      // Get all video original statuses for this user
      const originalStatuses = await storage.getAllVideoOriginalStatuses(userId);
      console.log(`📺 Found ${Object.keys(originalStatuses).length} videos to restore:`, originalStatuses);
      let restoredCount = 0;

      for (const [videoId, originalStatus] of Object.entries(originalStatuses)) {
        try {
          console.log(`📺 Processing restore for video: ${videoId} to ${originalStatus}`);
          
          // Check if video is locked (protected from automation) - skip completely
          const lockStatus = await storage.getVideoLockStatus(userId, videoId);
          if (lockStatus?.isLocked) {
            console.log(`🔒 Skipping locked video: ${videoId} - protected from automation`);
            continue; // Skip locked videos completely - they should not be touched
          }

          // Restore to original privacy status
          const updateUrl = `https://www.googleapis.com/youtube/v3/videos?part=status`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: videoId,
              status: { privacyStatus: originalStatus }
            })
          });

          if (updateResponse.ok) {
            restoredCount++;
            // Clear the original status after successful restoration
            await storage.clearVideoOriginalStatus(videoId, userId);
            console.log(`✅ Restored YouTube video: ${videoId} to ${originalStatus}`);
          } else {
            const errorText = await updateResponse.text();
            console.error(`❌ Failed to restore video ${videoId}:`, updateResponse.status, errorText);
          }
        } catch (error) {
          console.error(`❌ Failed to restore YouTube video ${videoId}:`, error);
        }
      }

      return { restoredCount };
    } catch (error) {
      console.error(`❌ YouTube restore operation failed:`, error);
      return { restoredCount: 0 };
    }
  }

  /**
   * Hide Facebook posts using existing API logic
   */
  private async callFacebookHideAPI(userId: string, accessToken: string): Promise<{ hiddenCount: number }> {
    try {
      console.log(`📘 Hiding Facebook posts for user ${userId}`);
      
      // Get user's posts
      const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&access_token=${accessToken}`;
      const postsResponse = await fetch(postsUrl);

      if (!postsResponse.ok) {
        throw new Error(`Facebook API error: ${postsResponse.status}`);
      }

      const postsData = await postsResponse.json() as any;
      const posts = postsData.data || [];
      
      let hiddenCount = 0;
      
      for (const post of posts) {
        try {
          // Skip already hidden posts
          if (post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")) {
            continue;
          }

          // Hide the post
          const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
          const updateResponse = await fetch(updateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `privacy=${encodeURIComponent(JSON.stringify({ value: 'ONLY_ME' }))}&access_token=${accessToken}`
          });

          if (updateResponse.ok) {
            hiddenCount++;
            console.log(`✅ Hidden Facebook post: ${post.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to hide Facebook post ${post.id}:`, error);
        }
      }

      return { hiddenCount };
    } catch (error) {
      console.error(`❌ Facebook hide operation failed:`, error);
      return { hiddenCount: 0 };
    }
  }

  /**
   * Restore Facebook posts using existing API logic
   */
  private async callFacebookShowAPI(userId: string, accessToken: string): Promise<{ restoredCount: number }> {
    try {
      console.log(`📘 Restoring Facebook posts for user ${userId}`);
      
      // Get user's posts
      const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&access_token=${accessToken}`;
      const postsResponse = await fetch(postsUrl);

      if (!postsResponse.ok) {
        throw new Error(`Facebook API error: ${postsResponse.status}`);
      }

      const postsData = await postsResponse.json() as any;
      const posts = postsData.data || [];
      
      let restoredCount = 0;
      
      for (const post of posts) {
        try {
          // Only restore hidden posts
          if (post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")) {
            // Restore the post to public
            const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
            const updateResponse = await fetch(updateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `privacy=${encodeURIComponent(JSON.stringify({ value: 'EVERYONE' }))}&access_token=${accessToken}`
            });

            if (updateResponse.ok) {
              restoredCount++;
              console.log(`✅ Restored Facebook post: ${post.id}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to restore Facebook post ${post.id}:`, error);
        }
      }

      return { restoredCount };
    } catch (error) {
      console.error(`❌ Facebook restore operation failed:`, error);
      return { restoredCount: 0 };
    }
  }

  /**
   * Get video details including privacy status
   */
  private async getVideoDetails(videoIds: string[], accessToken: string): Promise<any[]> {
    const idsParam = videoIds.join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${idsParam}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get video details: ${response.status}`);
    }
    
    const data = await response.json() as any;
    return data.items || [];
  }

  /**
   * Get YouTube channel ID for the authenticated user
   */
  private async getYouTubeChannelId(accessToken: string): Promise<string> {
    const channelUrl = 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true';
    const response = await fetch(channelUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get YouTube channel ID');
    }
    
    const data = await response.json() as any;
    return data.items[0]?.id || '';
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