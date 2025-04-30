import AuthService from './authService';
import StorageService from './storageService';
import CONFIG from '../config';
import Logger from '../utils/logger';

export class ApiService {
  /**
   * Make an authenticated API request
   * @param {string} platform - Platform name
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Promise resolving with API response
   */
  static async request(platform: string, endpoint: string, options: RequestInit = {}): Promise<any> {
    const accessToken = AuthService.getAccessToken(platform);
    
    if (!accessToken) {
      throw new Error(`Not authenticated with ${platform}`);
    }
    
    // For testing/development purposes
    // Simulate API responses when no real API keys are available
    if (accessToken.startsWith('sim_')) {
      console.log('[DEV MODE] Using simulated API response for', platform, endpoint);
      return this.getSimulatedResponse(platform, endpoint);
    }
    
    let baseUrl: string;
    let headers: HeadersInit = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    };
    
    switch (platform) {
      case 'facebook':
        baseUrl = CONFIG.API.facebook.base;
        break;
      case 'instagram':
        baseUrl = CONFIG.API.instagram.base;
        break;
      case 'youtube':
        baseUrl = CONFIG.API.youtube.base;
        break;
      case 'tiktok':
        baseUrl = CONFIG.API.tiktok.base;
        headers = {
          ...headers,
          'Content-Type': 'application/json'
        };
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Replace any path parameters in the endpoint
    endpoint = endpoint.replace(/\{([^}]+)\}/g, (match, param) => {
      if (options.params && options.params[param]) {
        return options.params[param];
      }
      return match;
    });
    
    const url = new URL(endpoint, baseUrl);
    
    // Add query parameters if provided
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }
      
      // Some endpoints might not return JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      Logger.error('API request failed', { platform, endpoint, error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Get simulated API response for testing
   * @param {string} platform - Platform name
   * @param {string} endpoint - API endpoint
   * @returns {Object} Simulated response object
   */
  static getSimulatedResponse(platform: string, endpoint: string): any {
    // Generate a random ID
    const generateId = () => Math.random().toString(36).substring(2, 15);
    
    // Get current timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Simulated user profiles
    if (endpoint.includes('/me') || endpoint.includes('/user/info') || endpoint.includes('/channels')) {
      switch (platform) {
        case 'facebook':
          return {
            id: '12345678901234567',
            name: 'דוגמה ישראלי'
          };
        case 'instagram':
          return {
            id: '98765432101234567',
            username: 'israel_example'
          };
        case 'youtube':
          return {
            items: [{
              id: 'UC' + generateId(),
              snippet: {
                title: 'My Test Channel',
                description: 'This is a test channel for development'
              }
            }]
          };
        case 'tiktok':
          return {
            data: {
              user: {
                id: 'user' + generateId(),
                display_name: 'TikTok User',
                bio_description: 'This is a test account'
              }
            }
          };
      }
    }
    
    // Simulated content lists
    if (endpoint.includes('posts') || endpoint.includes('media') || endpoint.includes('/videos') || endpoint.includes('/video/list')) {
      // Generate sample items based on platform
      switch (platform) {
        case 'facebook':
          return {
            data: Array(5).fill(null).map((_, i) => ({
              id: generateId(),
              message: `This is test post #${i + 1}`,
              created_time: new Date(now.getTime() - i * 86400000).toISOString()
            })),
            paging: {
              cursors: {
                before: 'QVFIUjNES...',
                after: 'QVFIUmhFNW...'
              },
              next: 'https://graph.facebook.com/v18.0/me/posts?limit=25&after=QVFIUmhFNW...'
            }
          };
        case 'instagram':
          return {
            data: Array(5).fill(null).map((_, i) => ({
              id: generateId(),
              caption: `Instagram test post #${i + 1}`,
              media_url: `https://example.com/image${i + 1}.jpg`,
              permalink: `https://instagram.com/p/${generateId()}`,
              timestamp: new Date(now.getTime() - i * 86400000).toISOString(),
              media_type: 'IMAGE'
            })),
            paging: {
              cursors: {
                before: 'QVFIUjNES...',
                after: 'QVFIUmhFNW...'
              },
              next: 'https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp,media_type&limit=25&after=QVFIUmhFNW...'
            }
          };
        case 'youtube':
          return {
            items: Array(5).fill(null).map((_, i) => ({
              id: generateId(),
              snippet: {
                title: `YouTube test video #${i + 1}`,
                description: `This is a test video description #${i + 1}`,
                publishedAt: new Date(now.getTime() - i * 86400000).toISOString(),
                thumbnails: {
                  default: {
                    url: `https://example.com/thumbnail${i + 1}.jpg`
                  }
                }
              },
              status: {
                privacyStatus: 'public'
              }
            })),
            pageInfo: {
              totalResults: 5,
              resultsPerPage: 5
            }
          };
        case 'tiktok':
          return {
            data: {
              videos: Array(5).fill(null).map((_, i) => ({
                id: generateId(),
                share_url: `https://tiktok.com/@user/video/${generateId()}`,
                title: `TikTok test video #${i + 1}`,
                create_time: Math.floor((now.getTime() - i * 86400000) / 1000)
              })),
              cursor: 5,
              has_more: false
            }
          };
      }
    }
    
    // Simulated update responses
    if (endpoint.includes('update') || endpoint.includes('archive') || endpoint.includes('visibility')) {
      return { success: true };
    }
    
    // Default fallback
    return { message: 'Simulated API response', timestamp };
  }
  
  /**
   * Get user profile information
   * @param {string} platform - Platform name
   * @returns {Promise} Promise resolving with user profile
   */
  static async getUserProfile(platform: string): Promise<any> {
    switch (platform) {
      case 'facebook':
        return this.request(platform, '/me?fields=id,name');
      case 'instagram':
        return this.request(platform, '/me?fields=id,username');
      case 'youtube':
        return this.request(platform, '/channels?part=snippet&mine=true');
      case 'tiktok':
        return this.request(platform, '/user/info/');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  /**
   * Get content items (posts, videos) from a platform
   * @param {string} platform - Platform name
   * @param {Object} options - Request options
   * @returns {Promise} Promise resolving with content items
   */
  static async getContentItems(platform: string, options: any = {}): Promise<any> {
    switch (platform) {
      case 'facebook':
        return this.request(platform, CONFIG.API.facebook.posts, {
          query: { limit: options.limit || 25 }
        });
        
      case 'instagram':
        return this.request(platform, CONFIG.API.instagram.media, {
          query: { 
            fields: 'id,caption,media_url,permalink,timestamp,media_type',
            limit: options.limit || 25
          }
        });
        
      case 'youtube':
        return this.request(platform, '/videos', {
          query: {
            part: 'snippet,status',
            maxResults: options.limit || 25,
            mine: 'true'
          }
        });
        
      case 'tiktok':
        return this.request(platform, '/video/list/', {
          query: {
            fields: 'id,share_url,title,create_time',
            cursor: options.cursor || 0,
            max_count: options.limit || 25
          }
        });
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  /**
   * Update content visibility (hide or show)
   * @param {string} platform - Platform name
   * @param {string} contentId - Content ID
   * @param {string} action - Action ('hide' or 'restore')
   * @returns {Promise} Promise resolving when update is complete
   */
  static async updateContentVisibility(platform: string, contentId: string, action: string): Promise<any> {
    const settings = StorageService.getSettings();
    const isHide = action === CONFIG.ACTIONS.HIDE;
    
    switch (platform) {
      case 'facebook':
        // For Facebook, we update the privacy setting
        return this.request(platform, CONFIG.API.facebook.updatePost.replace('{post-id}', contentId), {
          method: 'POST',
          body: new URLSearchParams({
            privacy: isHide ? CONFIG.PRIVACY_SETTINGS.facebook.hide : CONFIG.PRIVACY_SETTINGS.facebook.restore
          })
        });
        
      case 'instagram':
        // For Instagram, we use different endpoints for archive/unarchive
        if (isHide) {
          // Archive the media
          return this.request(platform, `/media/${contentId}/archive`, {
            method: 'POST'
          });
        } else {
          // Unarchive the media
          return this.request(platform, `/media/${contentId}/unarchive`, {
            method: 'POST'
          });
        }
        
      case 'youtube':
        // For YouTube, we update the privacyStatus
        return this.request(platform, `/videos?part=status`, {
          method: 'PUT',
          body: JSON.stringify({
            id: contentId,
            status: {
              privacyStatus: isHide ? CONFIG.PRIVACY_SETTINGS.youtube.hide : CONFIG.PRIVACY_SETTINGS.youtube.restore
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
      case 'tiktok':
        // For TikTok, we update the visibility setting
        return this.request(platform, `/video/visibility/`, {
          method: 'POST',
          body: JSON.stringify({
            video_id: contentId,
            privacy_level: isHide ? CONFIG.PRIVACY_SETTINGS.tiktok.hide : CONFIG.PRIVACY_SETTINGS.tiktok.restore
          })
        });
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  /**
   * Test connection to platform
   * @param {string} platform - Platform name
   * @returns {Promise} Promise resolving with connection status
   */
  static async testConnection(platform: string): Promise<any> {
    try {
      const profile = await this.getUserProfile(platform);
      return {
        success: true,
        profile
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}

export default ApiService;