import type { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { 
  registerUser, 
  loginUser, 
  getCurrentUser, 
  logoutUser, 
  requireAuth
} from './auth-new';
import { secureStorage } from './storage-new';

// Type assertion helper for authenticated routes
const withAuth = (handler: (req: any, res: Response) => void | Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req as any, res, next);
    if (!res.headersSent) {
      handler(req, res);
    }
  };
};

export function registerRoutes(app: Express): Server {
  
  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  
  app.post('/api/register', registerUser);
  app.post('/api/login', loginUser);
  app.post('/api/logout', logoutUser);
  app.get('/api/user', withAuth(getCurrentUser));

  // ==========================================
  // PLATFORM STATUS ROUTES (No OAuth yet)
  // ==========================================
  
  // Get user's platform status
  app.get('/api/user/platforms', withAuth((req: any, res: Response) => {
    const platforms = {
      youtube: false, // Will be true when OAuth is connected
      facebook: false,
      instagram: false,
      tiktok: false
    };
    
    res.json(platforms);
  }));

  // Get user's activity logs
  app.get('/api/user/activity', withAuth((req: any, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = secureStorage.getActivityLogs(req.userId, limit);
    res.json(logs);
  }));

  // ==========================================
  // PLACEHOLDER ROUTES FOR FUTURE OAUTH
  // ==========================================
  
  // YouTube placeholder routes
  app.get('/api/youtube/auth-url', withAuth((req: any, res: Response) => {
    res.status(501).json({ 
      error: 'YouTube integration requires API keys. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      authUrl: null 
    });
  }));

  app.get('/api/youtube/videos', withAuth((req: any, res: Response) => {
    res.status(501).json({ 
      error: 'YouTube integration not configured. Please provide API keys.',
      videos: [] 
    });
  }));

  // Facebook placeholder routes
  app.get('/api/facebook/config', (req: Request, res: Response) => {
    if (!process.env.FACEBOOK_APP_ID) {
      res.status(501).json({ 
        error: 'Facebook integration requires FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.',
        config: null 
      });
      return;
    }
    
    res.json({
      appId: process.env.FACEBOOK_APP_ID,
      redirectUri: `https://${req.headers.host}/auth-callback.html`
    });
  });

  // ==========================================
  // ADMIN/STATS ROUTES
  // ==========================================
  
  app.get('/api/admin/stats', withAuth((req: any, res: Response) => {
    // Simple stats that work without external APIs
    const stats = secureStorage.getUserStats();
    res.json(stats);
  }));

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