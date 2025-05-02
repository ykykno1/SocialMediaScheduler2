/**
 * API service for Shabbat Robot
 * Handles API interactions with social media platforms
 */
import CONFIG from '../config';
import AuthService from './authService';
import Logger from '../utils/logger';
import StorageService from './storageService';

export class ApiService {
  /**
   * Make an authenticated API request
   * @param {string} platform - Platform name
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Promise resolving with API response
   */
  static async request(platform: string, endpoint: string, options: Record<string, any> = {}): Promise<any> {
    // Get access token
    const accessToken = AuthService.getAccessToken(platform);
    
    if (!accessToken) {
      throw new Error(`לא מחובר ל${this.getPlatformDisplayName(platform)}`);
    }
    
    try {
      // Get base URL
      const baseUrl = CONFIG.API[platform as keyof typeof CONFIG.API]?.base;
      
      if (!baseUrl) {
        throw new Error(`פלטפורמה לא תקינה: ${platform}`);
      }
      
      // Set up request options
      const requestOptions: Record<string, any> = {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...options.headers
        }
      };
      
      // Add body if provided
      if (options.body) {
        if (options.headers && options.headers['Content-Type'] === 'application/json') {
          requestOptions.body = JSON.stringify(options.body);
        } else {
          requestOptions.body = options.body;
        }
      }
      
      // Build URL
      const url = `${baseUrl}${endpoint}${options.params ? `?${new URLSearchParams(options.params)}` : ''}`;
      
      Logger.debug(`Making API request to ${platform}`, { url, method: requestOptions.method });
      
      // Make the request
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        Logger.error(`API request failed for ${platform}`, { 
          status: response.status, 
          statusText: response.statusText,
          url
        });
        throw new Error(`בקשת API נכשלה: ${response.status} ${response.statusText}`);
      }
      
      // Parse response
      const data = await response.json();
      
      Logger.debug(`API request succeeded for ${platform}`, { endpoint });
      
      return data;
    } catch (error) {
      Logger.error(`API request error for ${platform}`, { 
        endpoint, 
        error: (error as Error).message
      });
      throw error;
    }
  }
  
  /**
   * Get user profile information
   * @param {string} platform - Platform name
   * @returns {Promise} Promise resolving with user profile
   */
  static async getUserProfile(platform: string): Promise<any> {
    // If in development mode, return mock user profile for Facebook
    if (CONFIG.DEV_MODE && platform === 'facebook') {
      console.log('Using development mode for user profile');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Return mock user profile
      return {
        id: 'user123',
        name: 'משתמש לדוגמה',
        picture: {
          data: {
            url: 'https://via.placeholder.com/50'
          }
        }
      };
    }
    
    let endpoint = '';
    
    switch (platform) {
      case 'facebook':
        endpoint = '/me?fields=id,name,picture.type(large)';
        break;
      case 'instagram':
        endpoint = '/me?fields=id,username,account_type,media_count';
        break;
      case 'youtube':
        endpoint = '/channels?part=snippet,statistics&mine=true';
        break;
      case 'tiktok':
        endpoint = '/user/info/';
        break;
      default:
        throw new Error(`פלטפורמה לא נתמכת: ${platform}`);
    }
    
    return this.request(platform, endpoint);
  }
  
  /**
   * Get content items (posts, videos) from a platform
   * @param {string} platform - Platform name
   * @param {Object} options - Request options
   * @returns {Promise} Promise resolving with content items
   */
  static async getContent(platform: string, options: Record<string, any> = {}): Promise<any> {
    // If in development mode, return mock data for facebook
    if (CONFIG.DEV_MODE && platform === 'facebook') {
      console.log('Using development mode data for content');
      
      // Simulate a brief delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock posts
      return {
        data: [
          {
            id: 'post1',
            message: 'שלום עולם! פוסט לדוגמה 1',
            created_time: '2023-04-28T10:00:00+0000',
            privacy: { value: 'EVERYONE' },
            permalink_url: 'https://facebook.com/example/post1'
          },
          {
            id: 'post2',
            message: 'ברוכים הבאים לרובוט שבת! פוסט לדוגמה 2',
            created_time: '2023-04-29T14:30:00+0000',
            privacy: { value: 'EVERYONE' },
            permalink_url: 'https://facebook.com/example/post2'
          },
          {
            id: 'post3',
            message: 'פוסט לדוגמה 3 עם תמונה',
            created_time: '2023-04-30T08:15:00+0000',
            privacy: { value: 'EVERYONE' },
            permalink_url: 'https://facebook.com/example/post3'
          }
        ]
      };
    }
    
    let endpoint = '';
    
    switch (platform) {
      case 'facebook':
        endpoint = CONFIG.API.facebook.posts;
        break;
      case 'instagram':
        endpoint = CONFIG.API.instagram.media;
        break;
      case 'youtube':
        endpoint = CONFIG.API.youtube.videos;
        break;
      case 'tiktok':
        endpoint = CONFIG.API.tiktok.videos;
        break;
      default:
        throw new Error(`פלטפורמה לא נתמכת: ${platform}`);
    }
    
    const apiOptions: Record<string, any> = { ...options };
    
    // Add platform-specific query parameters
    if (!apiOptions.params) {
      apiOptions.params = {};
    }
    
    switch (platform) {
      case 'facebook':
        apiOptions.params.fields = 'id,message,created_time,privacy,permalink_url';
        apiOptions.params.limit = options.limit || 25;
        break;
      case 'instagram':
        apiOptions.params.fields = 'id,caption,media_type,media_url,permalink,timestamp';
        apiOptions.params.limit = options.limit || 25;
        break;
      case 'youtube':
        apiOptions.params.part = 'snippet,status';
        apiOptions.params.mine = 'true';
        apiOptions.params.maxResults = options.limit || 25;
        break;
      case 'tiktok':
        apiOptions.params.fields = 'id,share_url,video_status,thumbnail_url,title,create_time';
        apiOptions.params.cursor = options.cursor || 0;
        apiOptions.params.max_count = options.limit || 20;
        break;
    }
    
    return this.request(platform, endpoint, apiOptions);
  }
  
  /**
   * Update content visibility (hide or show)
   * @param {string} platform - Platform name
   * @param {string} contentId - Content ID
   * @param {string} action - Action ('hide' or 'restore')
   * @returns {Promise} Promise resolving when update is complete
   */
  static async updateContentVisibility(platform: string, contentId: string, action: 'hide' | 'restore'): Promise<any> {
    // If in development mode, simulate successful update
    if (CONFIG.DEV_MODE && platform === 'facebook') {
      console.log(`Development mode: ${action} content for ${platform}, ID: ${contentId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create development mode history entry
      
      // Add history entry
      const historyData = {
        platform: platform,
        action: action,
        itemCount: 1,
        status: CONFIG.STATUS.SUCCESS,
        details: `מצב פיתוח: ${action === 'hide' ? 'הסתרת' : 'שחזור'} פוסט בפלטפורמת ${this.getPlatformDisplayName(platform)}`
      };
      StorageService.addHistoryEntry(historyData);
      
      return { success: true };
    }
    
    const isHide = action === 'hide';
    let endpoint = '';
    let method = 'POST';
    let body: Record<string, any> = {};
    
    // Get privacy setting based on platform and action
    const privacySetting = isHide 
      ? CONFIG.PRIVACY_SETTINGS[platform as keyof typeof CONFIG.PRIVACY_SETTINGS].hide 
      : CONFIG.PRIVACY_SETTINGS[platform as keyof typeof CONFIG.PRIVACY_SETTINGS].restore;
    
    switch (platform) {
      case 'facebook':
        endpoint = CONFIG.API.facebook.updatePost.replace('{post-id}', contentId);
        body.privacy = { value: privacySetting };
        break;
        
      case 'instagram':
        // Instagram uses different endpoints for archive/unarchive
        if (isHide) {
          endpoint = `/media/${contentId}/archive`;
        } else {
          endpoint = `/media/${contentId}/unarchive`;
        }
        break;
        
      case 'youtube':
        endpoint = CONFIG.API.youtube.updateVideo.replace('{video-id}', contentId);
        method = 'PUT';
        body = {
          id: contentId,
          status: {
            privacyStatus: privacySetting
          }
        };
        break;
        
      case 'tiktok':
        endpoint = CONFIG.API.tiktok.updateVideo;
        body = {
          video_id: contentId,
          privacy_level: privacySetting
        };
        break;
        
      default:
        throw new Error(`פלטפורמה לא נתמכת: ${platform}`);
    }
    
    const options: Record<string, any> = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body
    };
    
    return this.request(platform, endpoint, options);
  }
  
  /**
   * Test connection to platform
   * @param {string} platform - Platform name
   * @returns {Promise} Promise resolving with connection status
   */
  static async testConnection(platform: string): Promise<{ success: boolean; message: string }> {
    // For development mode, simulate successful connection to Facebook
    if (CONFIG.DEV_MODE && platform === 'facebook') {
      console.log('Using development mode for connection test');
      
      // Update platform connection status in settings
      const updatedSettings = StorageService.getSettings();
      updatedSettings.platforms[platform].connected = true;
      StorageService.saveSettings(updatedSettings);
      
      // Simulate a brief delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return {
        success: true,
        message: `מחובר ל${this.getPlatformDisplayName(platform)} (מצב פיתוח)`
      };
    }
    
    try {
      await this.getUserProfile(platform);
      return {
        success: true,
        message: `מחובר ל${this.getPlatformDisplayName(platform)}`
      };
    } catch (error) {
      return {
        success: false,
        message: `לא ניתן להתחבר ל${this.getPlatformDisplayName(platform)}: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Get the default "Shabbat mode" post content
   * @param {string} platform - Platform name
   * @returns {Object} Default post content
   */
  static getDefaultPostContent(platform: string): Record<string, string> {
    const defaultContent = {
      title: 'שבת שלום',
      message: 'שבת שלום וברכה! אני לא זמין כעת בגלל שמירת שבת. אחזור לפעילות הרגילה במוצאי שבת.',
      imageUrl: '' // Could add default image URL if needed
    };
    
    // Platform-specific customizations could be added here
    
    return defaultContent;
  }

  /**
   * Helper function to get display name for platform
   * @param {string} platform - Platform name
   * @returns {string} Platform display name
   */
  private static getPlatformDisplayName(platform: string): string {
    const displayNames: Record<string, string> = {
      facebook: 'פייסבוק',
      instagram: 'אינסטגרם',
      youtube: 'יוטיוב',
      tiktok: 'טיקטוק'
    };
    
    return displayNames[platform] || platform;
  }
}

export default ApiService;