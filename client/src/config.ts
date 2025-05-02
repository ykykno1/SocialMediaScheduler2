/**
 * Configuration file for Shabbat Robot application
 * Contains constants and app-wide settings
 */

export const CONFIG = {
  // App information
  APP_NAME: 'רובוט שבת',
  APP_VERSION: '1.0.0',
  
  // Development mode flag - set to true for development without real Facebook auth
  DEV_MODE: true,
  
  // Facebook Developer Credentials
  FACEBOOK: {
    APP_ID: '', // Will be fetched from server
    APP_SECRET: '' // Should never be exposed in frontend
  },
  
  // Default settings
  DEFAULT_SETTINGS: {
    autoSchedule: true,
    hideTime: '18:30',
    restoreTime: '19:45',
    timeZone: 'Asia/Jerusalem',
    defaultPost: true,
    platforms: {
      facebook: {
        enabled: false,
        connected: false
      }
    },
    exceptedPosts: []
  },

  // Storage keys
  STORAGE_KEYS: {
    SETTINGS: 'shabbat_robot_settings',
    AUTH_TOKENS: 'shabbat_robot_auth_tokens',
    HISTORY: 'shabbat_robot_history'
  },
  
  // API endpoints
  API: {
    facebook: {
      base: 'https://graph.facebook.com/v18.0',
      auth: 'https://www.facebook.com/v18.0/dialog/oauth',
      token: 'https://graph.facebook.com/v18.0/oauth/access_token',
      posts: '/me/posts',
      updatePost: '/{post-id}'
    },
    instagram: {
      base: 'https://graph.instagram.com',
      auth: 'https://api.instagram.com/oauth/authorize',
      token: 'https://api.instagram.com/oauth/access_token',
      media: '/me/media',
      updateMedia: '/{media-id}'
    }, 
    youtube: {
      base: 'https://www.googleapis.com/youtube/v3',
      auth: 'https://accounts.google.com/o/oauth2/auth',
      token: 'https://oauth2.googleapis.com/token',
      videos: '/videos',
      updateVideo: '/videos/{video-id}'
    },
    tiktok: {
      base: 'https://open-api.tiktok.com',
      auth: 'https://www.tiktok.com/auth/authorize/',
      token: 'https://open-api.tiktok.com/oauth/access_token/',
      videos: '/video/list/',
      updateVideo: '/video/visibility/'
    }
  },
  
  // Action types
  ACTIONS: {
    HIDE: 'hide',
    RESTORE: 'restore',
    TEST: 'test'
  },
  
  // Status codes
  STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending'
  },
  
  // Privacy settings by platform
  PRIVACY_SETTINGS: {
    facebook: {
      hide: 'SELF', // Only me
      restore: 'EVERYONE' // Public
    },
    instagram: {
      hide: 'archive',
      restore: 'unarchive'
    },
    youtube: {
      hide: 'private',
      restore: 'public'
    },
    tiktok: {
      hide: 'private',
      restore: 'public'
    }
  },
  
  // Log levels
  LOG_LEVELS: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug'
  },

  // Default log level
  DEFAULT_LOG_LEVEL: 'info',
  
  // Maximum number of excepted posts
  MAX_EXCEPTED_POSTS: 3,

  // Scheduler check interval (in milliseconds)
  SCHEDULER_INTERVAL: 60000 // 1 minute
};

// Freeze the config object to prevent modifications
Object.freeze(CONFIG);

export default CONFIG;
