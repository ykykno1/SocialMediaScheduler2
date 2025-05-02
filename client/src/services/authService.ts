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
    if (platform !== 'facebook') {
      return Promise.reject(new Error(`Only Facebook is supported at this time`));
    }
    
    // If in development mode, use mock authentication
    if (CONFIG.DEV_MODE) {
      console.log('Using development mode authentication');
      
      return new Promise((resolve) => {
        // Simulate a brief delay
        setTimeout(() => {
          // Create mock token data
          const tokenData = {
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token',
            expiresIn: 3600 * 24 * 7, // 7 days
            timestamp: Date.now()
          };
          
          // Save the token
          StorageService.saveAuthToken(platform, tokenData);
          
          // Update platform connection status
          const updatedSettings = StorageService.getSettings();
          updatedSettings.platforms[platform].connected = true;
          StorageService.saveSettings(updatedSettings);
          
          // Log success
          Logger.info('Mock authentication successful', { platform });
          
          // Resolve with token data
          resolve(tokenData);
        }, 1500);
      });
    }
    
    // Real authentication flow for production
    console.log('Attempting to authenticate with facebook...');
    
    // Fetch Facebook App ID and redirect URI from server
    return fetch('/api/facebook-config')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching Facebook config: ${response.status}`);
        }
        return response.json();
      })
      .then(config => {
        console.log('Received config from server:', config.appId ? 'App ID present' : 'No App ID');
        
        if (!config.appId) {
          throw new Error('Facebook App ID not configured on server');
        }
        
        // Use the redirectUri from server which has the correct domain for Replit
        const redirectUri = config.redirectUri;
        
        // Get Facebook auth URL and credentials
        const authUrl = CONFIG.API.facebook.auth;
        // According to latest Facebook documentation
        const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts';
        
        // Build the full auth URL with params - use App ID and redirectUri from server
        const urlParams = new URLSearchParams({
          client_id: config.appId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: scope,
          state: platform // Store platform in state to identify callback
        });
        
        const fullAuthUrl = `${authUrl}?${urlParams.toString()}`;
        console.log('Auth URL:', fullAuthUrl);
        
        // Open the auth window
        return new Promise<any>((resolve, reject) => {
          const authWindow = window.open(fullAuthUrl, '_blank', 'width=600,height=700');
          
          if (!authWindow) {
            reject(new Error('Failed to open authentication window. Please disable popup blocker.'));
            return;
          }
          
          // Set up message event listener for callback
          const handleCallback = (event: MessageEvent) => {
            console.log('Received message event:', event);
            
            // Validate origin for security
            if (event.origin !== window.location.origin) {
              console.warn('Origin mismatch:', event.origin, window.location.origin);
              return;
            }
            
            const { platform, code, error } = event.data;
            console.log('Message data:', { platform, code: code ? 'present' : 'missing', error });
            
            if (error) {
              reject(new Error(`Authentication failed: ${error}`));
              return;
            }
            
            if (code && platform) {
              // Exchange code for token
              AuthService.exchangeCodeForToken(platform, code, redirectUri)
                .then(resolve)
                .catch(reject);
            }
            
            // Clean up
            window.removeEventListener('message', handleCallback);
          };
          
          window.addEventListener('message', handleCallback);
          
          // Set up interval to check if auth window is closed
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleCallback);
              reject(new Error('Authentication window was closed before completion'));
            }
          }, 1000);
          
          // Add a timeout of 5 minutes for the entire auth process
          setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleCallback);
            if (!authWindow.closed) {
              authWindow.close();
            }
            reject(new Error('Authentication timed out'));
          }, 300000); // 5 minutes
        });
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
    if (platform !== 'facebook') {
      throw new Error(`Only Facebook is supported at this time`);
    }
    
    try {
      console.log(`Exchanging code for token, redirectUri: ${redirectUri}`);
      
      // Use server endpoint to exchange code for token
      const response = await fetch('/api/auth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          code,
          redirectUri
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format may vary by platform, normalize it
      const tokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600, // Default to 1 hour
        timestamp: Date.now()
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