/**
 * Authentication service for Shabbat Robot
 * Handles authentication with social media platforms
 */
import CONFIG from '../config';
import Logger from '../utils/logger';
import StorageService from '../services/storageService';

export class AuthService {
  /**
   * Check if token is expired
   * @param {Object} tokenData - Token data with expiry information
   * @returns {boolean} True if token is expired
   */
  static isTokenExpired(tokenData: any): boolean {
    if (!tokenData || !tokenData.timestamp || !tokenData.expiresIn) {
      return true;
    }
    
    const expiryTime = tokenData.timestamp + (tokenData.expiresIn * 1000);
    return Date.now() > expiryTime;
  }
  
  /**
   * Check if user is authenticated with a platform
   * @param {string} platform - Platform name
   * @returns {boolean} True if authenticated
   */
  static isAuthenticated(platform: string): boolean {
    const tokens = StorageService.getAuthTokens();
    const tokenData = tokens[platform];
    
    if (!tokenData || !tokenData.accessToken) {
      return false;
    }
    
    return !this.isTokenExpired(tokenData);
  }
  
  /**
   * Get access token for a platform
   * @param {string} platform - Platform name
   * @returns {string|null} Access token or null if not authenticated
   */
  static getAccessToken(platform: string): string | null {
    const tokens = StorageService.getAuthTokens();
    const tokenData = tokens[platform];
    
    if (!tokenData || !tokenData.accessToken) {
      return null;
    }
    
    if (this.isTokenExpired(tokenData)) {
      // Try to refresh token
      if (tokenData.refreshToken) {
        this.refreshToken(platform, tokenData.refreshToken)
          .then(() => {
            Logger.info('Token refreshed successfully', { platform });
          })
          .catch(error => {
            Logger.error('Failed to refresh token', { platform, error });
            StorageService.removeAuthToken(platform);
          });
      } else {
        StorageService.removeAuthToken(platform);
      }
      return null;
    }
    
    return tokenData.accessToken;
  }
  
  /**
   * Refresh authentication token
   * @param {string} platform - Platform name
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} Promise resolving with new token data
   */
  static async refreshToken(platform: string, refreshToken: string): Promise<any> {
    const settings = StorageService.getSettings();
    const platformConfig = settings.platforms[platform];
    
    if (!platformConfig) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    let url, params;
    
    switch (platform) {
      case 'facebook':
        url = CONFIG.API.facebook.token;
        params = {
          grant_type: 'refresh_token',
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          refresh_token: refreshToken
        };
        break;
        
      case 'instagram':
        url = CONFIG.API.instagram.token;
        params = {
          grant_type: 'refresh_token',
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          refresh_token: refreshToken
        };
        break;
        
      case 'youtube':
        url = CONFIG.API.youtube.token;
        params = {
          grant_type: 'refresh_token',
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          refresh_token: refreshToken
        };
        break;
        
      case 'tiktok':
        url = CONFIG.API.tiktok.token;
        params = {
          grant_type: 'refresh_token',
          client_key: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          refresh_token: refreshToken
        };
        break;
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format may vary by platform, normalize it
      const tokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep old refresh token if not provided
        expiresIn: data.expires_in || 3600 // Default to 1 hour
      };
      
      // Save the token
      StorageService.saveAuthToken(platform, tokenData);
      
      return tokenData;
    } catch (error) {
      Logger.error('Token refresh failed', { platform, error: (error as Error).message });
      throw error;
    }
  }
  
  /**
   * Initialize OAuth authentication flow
   * @param {string} platform - Platform name
   * @returns {Promise} Promise resolving when auth window is opened
   */
  static authenticate(platform: string): Promise<any> {
    const settings = StorageService.getSettings();
    const platformConfig = settings.platforms[platform];
    
    if (!platformConfig) {
      return Promise.reject(new Error(`Invalid platform: ${platform}`));
    }
    
    let authUrl, redirectUri, scope;
    
    // Set common redirect URI
    redirectUri = `${window.location.origin}/auth-callback.html`;
    
    switch (platform) {
      case 'facebook':
        authUrl = CONFIG.API.facebook.auth;
        scope = 'pages_show_list,pages_read_engagement,pages_manage_posts';
        break;
        
      case 'instagram':
        authUrl = CONFIG.API.instagram.auth;
        scope = 'user_profile,user_media';
        break;
        
      case 'youtube':
        authUrl = CONFIG.API.youtube.auth;
        scope = 'https://www.googleapis.com/auth/youtube';
        break;
        
      case 'tiktok':
        authUrl = CONFIG.API.tiktok.auth;
        scope = 'user.info.basic,video.list,video.upload';
        break;
        
      default:
        return Promise.reject(new Error(`Unsupported platform: ${platform}`));
    }
    
    // Build the full auth URL with params
    const urlParams = new URLSearchParams({
      client_id: platformConfig.apiKey,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: platform // Store platform in state to identify callback
    });
    
    const fullAuthUrl = `${authUrl}?${urlParams.toString()}`;
    
    // Open the auth window
    return new Promise((resolve, reject) => {
      const authWindow = window.open(fullAuthUrl, '_blank', 'width=600,height=700');
      
      if (!authWindow) {
        reject(new Error('Failed to open authentication window. Please disable popup blocker.'));
        return;
      }
      
      // Set up message event listener for callback
      const handleCallback = (event: MessageEvent) => {
        // Validate origin for security
        if (event.origin !== window.location.origin) {
          return;
        }
        
        const { platform, code, error } = event.data;
        
        if (error) {
          reject(new Error(`Authentication failed: ${error}`));
          return;
        }
        
        if (code && platform) {
          // Exchange code for token
          this.exchangeCodeForToken(platform, code, redirectUri)
            .then(resolve)
            .catch(reject);
        }
        
        // Clean up
        window.removeEventListener('message', handleCallback);
      };
      
      window.addEventListener('message', handleCallback);
      
      // Set timeout to handle case when user closes window without completing auth
      setTimeout(() => {
        if (authWindow.closed) {
          window.removeEventListener('message', handleCallback);
          reject(new Error('Authentication window was closed'));
        }
      }, 1000);
    });
  }
  
  /**
   * Exchange authorization code for token
   * @param {string} platform - Platform name
   * @param {string} code - Authorization code
   * @param {string} redirectUri - Redirect URI used for auth
   * @returns {Promise} Promise resolving with token data
   */
  static async exchangeCodeForToken(platform: string, code: string, redirectUri: string): Promise<any> {
    const settings = StorageService.getSettings();
    const platformConfig = settings.platforms[platform];
    
    if (!platformConfig) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    
    let url, params;
    
    switch (platform) {
      case 'facebook':
        url = CONFIG.API.facebook.token;
        params = {
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          code: code,
          redirect_uri: redirectUri
        };
        break;
        
      case 'instagram':
        url = CONFIG.API.instagram.token;
        params = {
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        };
        break;
        
      case 'youtube':
        url = CONFIG.API.youtube.token;
        params = {
          client_id: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        };
        break;
        
      case 'tiktok':
        url = CONFIG.API.tiktok.token;
        params = {
          client_key: platformConfig.apiKey,
          client_secret: platformConfig.apiSecret,
          code: code,
          grant_type: 'authorization_code'
        };
        break;
        
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format may vary by platform, normalize it
      const tokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600 // Default to 1 hour
      };
      
      // Save the token
      StorageService.saveAuthToken(platform, tokenData);
      
      // Update platform connection status
      const updatedSettings = StorageService.getSettings();
      updatedSettings.platforms[platform].connected = true;
      StorageService.saveSettings(updatedSettings);
      
      return tokenData;
    } catch (error) {
      Logger.error('Token exchange failed', { platform, error: (error as Error).message });
      throw error;
    }
  }
}

export default AuthService;
