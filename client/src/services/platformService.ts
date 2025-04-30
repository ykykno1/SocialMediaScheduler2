/**
 * Platform-specific service for Shabbat Robot
 * Provides platform-specific implementations for content management
 */
import CONFIG from '../config';
import AuthService from './authService';
import ApiService from './apiService';
import Logger from '../utils/logger';
import StorageService from './storageService';

export class PlatformService {
  /**
   * Check if platform is enabled in settings
   * @param {string} platform - Platform name
   * @returns {boolean} True if platform is enabled
   */
  static isPlatformEnabled(platform: string): boolean {
    const settings = StorageService.getSettings();
    return settings.platforms[platform]?.enabled || false;
  }
  
  /**
   * Get all enabled platforms
   * @returns {string[]} Array of enabled platform names
   */
  static getEnabledPlatforms(): string[] {
    const settings = StorageService.getSettings();
    
    return Object.keys(settings.platforms).filter(platform => 
      settings.platforms[platform].enabled
    );
  }
  
  /**
   * Check if platform is configured (has API credentials)
   * @param {string} platform - Platform name
   * @returns {boolean} True if configured
   */
  static isPlatformConfigured(platform: string): boolean {
    const settings = StorageService.getSettings();
    const platformConfig = settings.platforms[platform];
    
    if (!platformConfig) {
      return false;
    }
    
    return Boolean(platformConfig.apiKey && platformConfig.apiSecret);
  }
  
  /**
   * Check if authenticated with platform
   * @param {string} platform - Platform name
   * @returns {boolean} True if authenticated
   */
  static isPlatformAuthenticated(platform: string): boolean {
    return AuthService.isAuthenticated(platform);
  }
  
  /**
   * Get user's content from platform
   * @param {string} platform - Platform name
   * @param {Object} options - Request options
   * @returns {Promise} Promise resolving with content items
   */
  static async getContent(platform: string, options: Record<string, any> = {}): Promise<any> {
    if (!this.isPlatformEnabled(platform)) {
      throw new Error(`Platform ${platform} is not enabled`);
    }
    
    if (!this.isPlatformAuthenticated(platform)) {
      throw new Error(`Not authenticated with ${platform}`);
    }
    
    return ApiService.getContent(platform, options);
  }
  
  /**
   * Hide content on platform
   * @param {string} platform - Platform name
   * @param {Object} options - Options for hiding content
   * @returns {Promise} Promise resolving with operation results
   */
  static async hideContent(platform: string, options: Record<string, any> = {}): Promise<any> {
    if (!this.isPlatformEnabled(platform)) {
      Logger.info(`Skipping disabled platform: ${platform}`);
      return { success: true, platform, status: 'skipped', reason: 'Platform disabled' };
    }
    
    if (!this.isPlatformAuthenticated(platform)) {
      Logger.error(`Not authenticated with ${platform}`);
      return { success: false, platform, status: 'error', reason: 'Not authenticated' };
    }
    
    try {
      Logger.info(`Hiding content on ${platform}`);
      
      // Get content
      const contentItems = await this.getContent(platform);
      
      // Parse platform-specific response
      const normalizedItems = this.normalizeContentItems(platform, contentItems);
      
      // Get excepted posts to not hide
      const settings = StorageService.getSettings();
      const exceptedPosts = settings.exceptedPosts || [];
      
      // Hide each item except those in the excepted list
      const results = await Promise.all(normalizedItems.map(async (item) => {
        // Skip excepted posts
        if (exceptedPosts.includes(item.id)) {
          return { 
            id: item.id, 
            success: true, 
            status: 'skipped', 
            reason: 'Excepted post' 
          };
        }
        
        try {
          await ApiService.updateContentVisibility(platform, item.id, 'hide');
          
          return {
            id: item.id,
            success: true,
            status: 'hidden'
          };
        } catch (error) {
          Logger.error(`Failed to hide content item on ${platform}`, { 
            id: item.id, 
            error: (error as Error).message 
          });
          
          return {
            id: item.id,
            success: false,
            status: 'error',
            reason: (error as Error).message
          };
        }
      }));
      
      // Count successful operations
      const successCount = results.filter(r => r.success && r.status === 'hidden').length;
      const skippedCount = results.filter(r => r.success && r.status === 'skipped').length;
      const errorCount = results.filter(r => !r.success).length;
      
      return {
        platform,
        success: true,
        totalProcessed: results.length,
        hidden: successCount,
        skipped: skippedCount,
        errors: errorCount,
        details: results
      };
    } catch (error) {
      Logger.error(`Failed to hide content on ${platform}`, { error: (error as Error).message });
      
      return {
        platform,
        success: false,
        reason: (error as Error).message
      };
    }
  }
  
  /**
   * Restore content on platform
   * @param {string} platform - Platform name
   * @param {Object} options - Options for restoring content
   * @returns {Promise} Promise resolving with operation results
   */
  static async restoreContent(platform: string, options: Record<string, any> = {}): Promise<any> {
    if (!this.isPlatformEnabled(platform)) {
      Logger.info(`Skipping disabled platform: ${platform}`);
      return { success: true, platform, status: 'skipped', reason: 'Platform disabled' };
    }
    
    if (!this.isPlatformAuthenticated(platform)) {
      Logger.error(`Not authenticated with ${platform}`);
      return { success: false, platform, status: 'error', reason: 'Not authenticated' };
    }
    
    try {
      Logger.info(`Restoring content on ${platform}`);
      
      // Get content including hidden/archived posts if possible
      const apiOptions: Record<string, any> = { includeHidden: true };
      const contentItems = await this.getContent(platform, apiOptions);
      
      // Parse platform-specific response
      const normalizedItems = this.normalizeContentItems(platform, contentItems);
      
      // Restore each item
      const results = await Promise.all(normalizedItems.map(async (item) => {
        try {
          await ApiService.updateContentVisibility(platform, item.id, 'restore');
          
          return {
            id: item.id,
            success: true,
            status: 'restored'
          };
        } catch (error) {
          Logger.error(`Failed to restore content item on ${platform}`, { 
            id: item.id, 
            error: (error as Error).message 
          });
          
          return {
            id: item.id,
            success: false,
            status: 'error',
            reason: (error as Error).message
          };
        }
      }));
      
      // Count successful operations
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      return {
        platform,
        success: true,
        totalProcessed: results.length,
        restored: successCount,
        errors: errorCount,
        details: results
      };
    } catch (error) {
      Logger.error(`Failed to restore content on ${platform}`, { error: (error as Error).message });
      
      return {
        platform,
        success: false,
        reason: (error as Error).message
      };
    }
  }
  
  /**
   * Normalize content items from different platforms to a common format
   * @param {string} platform - Platform name
   * @param {Object} data - Platform-specific content data
   * @returns {Array} Array of normalized content items
   */
  static normalizeContentItems(platform: string, data: any): Array<{
    id: string;
    platform: string;
    type: string;
    title: string;
    description?: string;
    url?: string;
    timestamp: string;
    privacy?: string;
  }> {
    if (!data) {
      return [];
    }
    
    switch (platform) {
      case 'facebook': {
        // Facebook response format: { data: [{ id, message, created_time, permalink_url, privacy }] }
        const posts = data.data || [];
        
        return posts.map((post: any) => ({
          id: post.id,
          platform: 'facebook',
          type: 'post',
          title: post.message?.substring(0, 50) || 'No message',
          description: post.message,
          url: post.permalink_url,
          timestamp: post.created_time,
          privacy: post.privacy?.value
        }));
      }
      
      case 'instagram': {
        // Instagram response format: { data: [{ id, caption, media_type, media_url, permalink, timestamp }] }
        const posts = data.data || [];
        
        return posts.map((post: any) => ({
          id: post.id,
          platform: 'instagram',
          type: post.media_type?.toLowerCase() || 'post',
          title: post.caption?.substring(0, 50) || 'No caption',
          description: post.caption,
          url: post.permalink,
          timestamp: post.timestamp
        }));
      }
      
      case 'youtube': {
        // YouTube response format: { items: [{ id, snippet: { title, description }, status: { privacyStatus } }] }
        const videos = data.items || [];
        
        return videos.map((video: any) => ({
          id: video.id,
          platform: 'youtube',
          type: 'video',
          title: video.snippet?.title || 'No title',
          description: video.snippet?.description,
          url: `https://youtube.com/watch?v=${video.id}`,
          timestamp: video.snippet?.publishedAt,
          privacy: video.status?.privacyStatus
        }));
      }
      
      case 'tiktok': {
        // TikTok response format: { data: { videos: [{ id, title, create_time, share_url, video_status }] } }
        const videos = (data.data?.videos) || [];
        
        return videos.map((video: any) => ({
          id: video.id,
          platform: 'tiktok',
          type: 'video',
          title: video.title || 'No title',
          url: video.share_url,
          timestamp: video.create_time,
          privacy: video.video_status
        }));
      }
      
      default:
        return [];
    }
  }
  
  /**
   * Test connection to platform and report status
   * @param {string} platform - Platform name 
   * @returns {Promise} Promise resolving with connection status
   */
  static async testPlatform(platform: string): Promise<Record<string, any>> {
    try {
      // Check if platform is enabled
      if (!this.isPlatformEnabled(platform)) {
        return {
          platform,
          enabled: false,
          configured: this.isPlatformConfigured(platform),
          authenticated: false,
          connected: false,
          message: 'פלטפורמה מושבתת'
        };
      }
      
      // Check if platform is configured
      if (!this.isPlatformConfigured(platform)) {
        return {
          platform,
          enabled: true,
          configured: false,
          authenticated: false,
          connected: false,
          message: 'פלטפורמה לא מוגדרת, יש להזין מפתחות API'
        };
      }
      
      // Check if authenticated
      if (!this.isPlatformAuthenticated(platform)) {
        return {
          platform,
          enabled: true,
          configured: true,
          authenticated: false,
          connected: false,
          message: 'לא מחובר, יש לבצע הרשאה'
        };
      }
      
      // Test API connection
      const connectionTest = await ApiService.testConnection(platform);
      
      return {
        platform,
        enabled: true,
        configured: true,
        authenticated: true,
        connected: connectionTest.success,
        message: connectionTest.message
      };
    } catch (error) {
      return {
        platform,
        connected: false,
        message: (error as Error).message
      };
    }
  }
}

export default PlatformService;