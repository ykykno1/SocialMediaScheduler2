/**
 * Facebook SDK service for Shabbat Robot
 * Handles all Facebook SDK interactions
 */
import CONFIG from '../config';
import Logger from '../utils/logger';
import StorageService from './storageService';

// Define Facebook SDK types
declare global {
  interface Window {
    FB: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (callback: (response: any) => void, options: { scope: string }) => void;
      getLoginStatus: (callback: (response: any) => void) => void;
      api: (path: string, method: string, params: any, callback: (response: any) => void) => void;
    };
  }
}

export class FacebookSdkService {
  private static initialized = false;

  /**
   * Initialize the Facebook SDK
   * @param {string} appId - Facebook App ID
   * @returns {Promise} Promise resolving when SDK is initialized
   */
  static async initialize(appId: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Check if FB is already loaded and initialized by the index.html script
        if (window.FB) {
          this.initialized = true;
          Logger.info('Facebook SDK initialized', { appId });
          resolve();
          return;
        }
        
        // If not loaded yet, wait for FB SDK to load (it should be loading via the script in index.html)
        const checkFB = setInterval(() => {
          if (window.FB) {
            clearInterval(checkFB);
            this.initialized = true;
            Logger.info('Facebook SDK initialized', { appId });
            resolve();
          }
        }, 100);
        
        // Set timeout for SDK loading
        setTimeout(() => {
          clearInterval(checkFB);
          reject(new Error('Facebook SDK failed to load'));
        }, 10000); // 10 seconds timeout
      } catch (error) {
        Logger.error('Failed to initialize Facebook SDK', { error: (error as Error).message });
        reject(error);
      }
    });
  }
  
  /**
   * Check login status with Facebook
   * @returns {Promise} Promise resolving with login status
   */
  static async checkLoginStatus(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Facebook SDK not initialized');
    }
    
    return new Promise((resolve, reject) => {
      try {
        window.FB.getLoginStatus((response) => {
          if (response.status === 'connected') {
            // User is logged in and has authorized your app
            Logger.info('User already logged in to Facebook', {
              userId: response.authResponse.userID
            });
            
            // Save token
            const tokenData = {
              accessToken: response.authResponse.accessToken,
              userId: response.authResponse.userID,
              expiresIn: response.authResponse.expiresIn || 3600,
              timestamp: Date.now()
            };
            
            StorageService.saveAuthToken('facebook', tokenData);
            
            // Update connection status
            const settings = StorageService.getSettings();
            settings.platforms.facebook.connected = true;
            StorageService.saveSettings(settings);
            
            resolve(response);
          } else {
            // User either not logged in or not authorized app
            Logger.info('User not logged in or not authorized', { status: response.status });
            resolve(null);
          }
        });
      } catch (error) {
        Logger.error('Failed to check login status', { error: (error as Error).message });
        reject(error);
      }
    });
  }
  
  /**
   * Perform Facebook login
   * @returns {Promise} Promise resolving with login result
   */
  static async login(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Facebook SDK not initialized');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Required permissions according to Facebook documentation
        const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts';
        
        // Use Facebook SDK login directly - this avoids domain restriction issues
        window.FB.login((response) => {
          if (response.status === 'connected') {
            // User logged in and granted permissions
            Logger.info('Facebook login successful', {
              userId: response.authResponse.userID
            });
            
            // Save token data
            const tokenData = {
              accessToken: response.authResponse.accessToken,
              userId: response.authResponse.userID,
              expiresIn: response.authResponse.expiresIn || 3600,
              timestamp: Date.now()
            };
            
            StorageService.saveAuthToken('facebook', tokenData);
            
            // Update connection status
            const settings = StorageService.getSettings();
            settings.platforms.facebook.connected = true;
            StorageService.saveSettings(settings);
            
            // Resolve with the token data
            resolve(tokenData);
          } else {
            // User either cancelled login or didn't authorize all scopes
            Logger.error('Facebook login failed or cancelled', { 
              status: response.status 
            });
            reject(new Error('Facebook login failed or was cancelled'));
          }
        }, { scope: scope });
      } catch (error) {
        Logger.error('Failed to initiate Facebook login', { error: (error as Error).message });
        reject(error);
      }
    });
  }
  
  /**
   * Get user's posts from Facebook
   * @param {number} limit - Maximum number of posts to fetch
   * @returns {Promise} Promise resolving with posts
   */
  static async getPosts(limit: number = 10): Promise<any[]> {
    if (!this.initialized) {
      throw new Error('Facebook SDK not initialized');
    }
    
    const accessToken = StorageService.getAuthTokens().facebook?.accessToken;
    
    if (!accessToken) {
      throw new Error('Not authenticated with Facebook');
    }
    
    return new Promise((resolve, reject) => {
      try {
        window.FB.api(
          '/me/posts',
          'GET',
          { 
            limit: limit,
            fields: 'id,message,created_time,permalink_url,status_type'
          },
          (response) => {
            if (response && !response.error) {
              Logger.info('Successfully fetched Facebook posts', {
                count: response.data?.length || 0
              });
              
              resolve(response.data || []);
            } else {
              Logger.error('Failed to fetch Facebook posts', { 
                error: response.error?.message 
              });
              
              reject(new Error(response.error?.message || 'Failed to fetch posts'));
            }
          }
        );
      } catch (error) {
        Logger.error('Failed to get Facebook posts', { error: (error as Error).message });
        reject(error);
      }
    });
  }
  
  /**
   * Update post privacy settings
   * @param {string} postId - Post ID
   * @param {string} privacy - Privacy setting ('SELF' or 'EVERYONE')
   * @returns {Promise} Promise resolving when update is complete
   */
  static async updatePostPrivacy(postId: string, privacy: string): Promise<any> {
    if (!this.initialized) {
      throw new Error('Facebook SDK not initialized');
    }
    
    const accessToken = StorageService.getAuthTokens().facebook?.accessToken;
    
    if (!accessToken) {
      throw new Error('Not authenticated with Facebook');
    }
    
    return new Promise((resolve, reject) => {
      try {
        window.FB.api(
          `/${postId}`,
          'POST',
          { 
            privacy: { value: privacy }
          },
          (response) => {
            if (response && !response.error) {
              Logger.info('Successfully updated Facebook post privacy', {
                postId,
                privacy
              });
              
              resolve(response);
            } else {
              Logger.error('Failed to update Facebook post privacy', { 
                postId,
                privacy,
                error: response.error?.message 
              });
              
              reject(new Error(response.error?.message || 'Failed to update post privacy'));
            }
          }
        );
      } catch (error) {
        Logger.error('Failed to update Facebook post privacy', { 
          error: (error as Error).message,
          postId,
          privacy
        });
        reject(error);
      }
    });
  }
  
  /**
   * Hide a post (set privacy to 'Only Me')
   * @param {string} postId - Post ID
   * @returns {Promise} Promise resolving when post is hidden
   */
  static hidePost(postId: string): Promise<any> {
    return this.updatePostPrivacy(postId, 'SELF');
  }
  
  /**
   * Restore a post (set privacy to 'Public')
   * @param {string} postId - Post ID
   * @returns {Promise} Promise resolving when post is restored
   */
  static restorePost(postId: string): Promise<any> {
    return this.updatePostPrivacy(postId, 'EVERYONE');
  }
  
  /**
   * Hide all posts except the specified ones
   * @param {string[]} exceptPostIds - Post IDs to exclude
   * @returns {Promise} Promise resolving when all posts are hidden
   */
  static async hideAllPosts(exceptPostIds: string[] = []): Promise<any> {
    const posts = await this.getPosts(50); // Get up to 50 posts
    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process posts one by one
    for (const post of posts) {
      // Skip posts in the exception list
      if (exceptPostIds.includes(post.id)) {
        results.skipped++;
        continue;
      }
      
      try {
        await this.hidePost(post.id);
        results.success++;
      } catch (error) {
        Logger.error('Failed to hide post', { postId: post.id });
        results.failed++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }
  
  /**
   * Restore all posts
   * @returns {Promise} Promise resolving when all posts are restored
   */
  static async restoreAllPosts(): Promise<any> {
    const posts = await this.getPosts(50); // Get up to 50 posts
    const results = {
      success: 0,
      failed: 0
    };
    
    // Process posts one by one
    for (const post of posts) {
      try {
        await this.restorePost(post.id);
        results.success++;
      } catch (error) {
        Logger.error('Failed to restore post', { postId: post.id });
        results.failed++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }
}

export default FacebookSdkService;