import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { 
  registerUser, 
  loginUser, 
  getCurrentUser, 
  logoutUser, 
  requireAuth,
  type AuthenticatedRequest 
} from './auth-new';
import { secureStorage } from './storage-new';
import { youtubeService } from './services/youtube-service';
import { facebookService } from './services/facebook-service';

export function registerRoutes(app: Express): Server {
  
  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  
  app.post('/api/register', registerUser);
  app.post('/api/login', loginUser);
  app.post('/api/logout', logoutUser);
  app.get('/api/user', requireAuth, getCurrentUser);

  // ==========================================
  // YOUTUBE INTEGRATION ROUTES
  // ==========================================
  
  // Get YouTube auth URL for OAuth flow
  app.get('/api/youtube/auth-url', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const authUrl = youtubeService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('YouTube auth URL error:', error);
      res.status(500).json({ error: 'Failed to generate YouTube auth URL' });
    }
  });

  // Handle YouTube OAuth callback
  app.post('/api/youtube/auth-callback', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { code, redirectUri } = req.body;
      
      if (!code) {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const tokenData = await youtubeService.exchangeCodeForTokens(code, redirectUri);
      
      // Save token for this user only
      secureStorage.savePlatformToken(req.userId, {
        platform: 'youtube',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expiry_date ? new Date(tokenData.expiry_date) : undefined,
        additionalData: {
          channelTitle: tokenData.channelTitle || 'Unknown Channel'
        }
      });

      res.json({ 
        success: true, 
        channelTitle: tokenData.channelTitle 
      });

    } catch (error) {
      console.error('YouTube auth callback error:', error);
      secureStorage.addActivityLog(req.userId, {
        action: 'auth',
        platform: 'youtube',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to connect YouTube account' });
    }
  });

  // Get YouTube authentication status
  app.get('/api/youtube/auth-status', requireAuth, (req: AuthenticatedRequest, res) => {
    const token = secureStorage.getPlatformToken(req.userId, 'youtube');
    
    if (!token) {
      res.json({ 
        isAuthenticated: false, 
        platform: 'youtube' 
      });
      return;
    }

    // Check if token is expired
    const isExpired = token.expiresAt && token.expiresAt < new Date();
    
    res.json({ 
      isAuthenticated: !isExpired, 
      platform: 'youtube',
      channelTitle: token.additionalData?.channelTitle || 'Unknown Channel',
      connectedAt: token.expiresAt,
      tokenExpiresAt: token.expiresAt
    });
  });

  // Get user's YouTube videos
  app.get('/api/youtube/videos', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const token = secureStorage.getPlatformToken(req.userId, 'youtube');
      
      if (!token) {
        res.status(401).json({ error: 'YouTube account not connected' });
        return;
      }

      const videos = await youtubeService.getUserVideos(token);
      res.json(videos);

    } catch (error) {
      console.error('YouTube videos fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube videos' });
    }
  });

  // Hide/show YouTube video
  app.post('/api/youtube/videos/:videoId/visibility', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { videoId } = req.params;
      const { action } = req.body; // 'hide' or 'show'
      
      const token = secureStorage.getPlatformToken(req.userId, 'youtube');
      
      if (!token) {
        res.status(401).json({ error: 'YouTube account not connected' });
        return;
      }

      // Check user's hide limit for free accounts
      if (req.user.accountType === 'free' && action === 'hide') {
        if (req.user.hideCount >= req.user.maxHides) {
          res.status(403).json({ 
            error: 'Hide limit reached. Upgrade to continue.',
            code: 'LIMIT_REACHED' 
          });
          return;
        }
      }

      const result = await youtubeService.updateVideoVisibility(token, videoId, action);
      
      // Update user's hide count
      if (action === 'hide') {
        secureStorage.updateUser(req.userId, { 
          hideCount: req.user.hideCount + 1 
        });
      }

      // Log the action
      secureStorage.addActivityLog(req.userId, {
        action: action === 'hide' ? 'hide' : 'restore',
        platform: 'youtube',
        success: true,
        affectedItems: 1,
        details: { videoId, action }
      });

      res.json(result);

    } catch (error) {
      console.error('YouTube video visibility error:', error);
      secureStorage.addActivityLog(req.userId, {
        action: 'hide',
        platform: 'youtube',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to update video visibility' });
    }
  });

  // Disconnect YouTube account
  app.delete('/api/youtube/disconnect', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const removed = secureStorage.removePlatformToken(req.userId, 'youtube');
      
      if (removed) {
        secureStorage.addActivityLog(req.userId, {
          action: 'auth',
          platform: 'youtube',
          success: true,
          details: { action: 'disconnected' }
        });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'YouTube account was not connected' });
      }
    } catch (error) {
      console.error('YouTube disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect YouTube account' });
    }
  });

  // ==========================================
  // FACEBOOK INTEGRATION ROUTES
  // ==========================================
  
  // Get Facebook app configuration
  app.get('/api/facebook/config', (req, res) => {
    const config = facebookService.getAppConfig(req.headers.host || 'localhost');
    res.json(config);
  });

  // Handle Facebook OAuth callback
  app.post('/api/facebook/auth-callback', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { code, redirectUri } = req.body;
      
      if (!code) {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const tokenData = await facebookService.exchangeCodeForTokens(code, redirectUri);
      
      // Save token for this user only
      secureStorage.savePlatformToken(req.userId, {
        platform: 'facebook',
        accessToken: tokenData.access_token,
        expiresAt: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        additionalData: {
          userId: tokenData.userId,
          pageAccess: tokenData.pageAccess || false
        }
      });

      res.json({ 
        success: true, 
        pageAccess: tokenData.pageAccess 
      });

    } catch (error) {
      console.error('Facebook auth callback error:', error);
      secureStorage.addActivityLog(req.userId, {
        action: 'auth',
        platform: 'facebook',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to connect Facebook account' });
    }
  });

  // ==========================================
  // USER ACTIVITY & LOGS
  // ==========================================
  
  // Get user's activity logs
  app.get('/api/user/activity', requireAuth, (req: AuthenticatedRequest, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = secureStorage.getActivityLogs(req.userId, limit);
    res.json(logs);
  });

  // Get user's platform status
  app.get('/api/user/platforms', requireAuth, (req: AuthenticatedRequest, res) => {
    const platforms = {
      youtube: secureStorage.getPlatformToken(req.userId, 'youtube') ? true : false,
      facebook: secureStorage.getPlatformToken(req.userId, 'facebook') ? true : false,
      instagram: secureStorage.getPlatformToken(req.userId, 'instagram') ? true : false,
      tiktok: secureStorage.getPlatformToken(req.userId, 'tiktok') ? true : false
    };
    
    res.json(platforms);
  });

  // ==========================================
  // ADMIN ROUTES (Future)
  // ==========================================
  
  // Admin stats - will be protected later
  app.get('/api/admin/stats', requireAuth, (req: AuthenticatedRequest, res) => {
    // For now, allow any authenticated user - will add admin check later
    const stats = secureStorage.getUserStats();
    res.json(stats);
  });

  // ==========================================
  // ERROR HANDLING
  // ==========================================
  
  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR' 
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      code: 'NOT_FOUND' 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}