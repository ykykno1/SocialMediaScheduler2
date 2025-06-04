import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Simple in-memory storage for testing
const users: any[] = [];
const JWT_SECRET = 'shabbat-robot-secret-2024';

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const requireAuth = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  
  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }
  
  req.user = user;
  req.userId = user.id;
  next();
};

export function registerRoutes(app: Express): Server {
  
  // Register user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const user = {
        id: Date.now().toString(),
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        accountType: 'free',
        hideCount: 0,
        maxHides: 4,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      users.push(user);
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return response without password
      const { password: _, ...userResponse } = user;
      res.status(201).json({
        user: userResponse,
        token
      });
      
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Login user
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last active
      user.lastActive = new Date().toISOString();
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return response without password
      const { password: _, ...userResponse } = user;
      res.json({
        user: userResponse,
        token
      });
      
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get current user
  app.get('/api/user', requireAuth, (req: any, res: Response) => {
    const { password, ...userResponse } = req.user;
    res.json(userResponse);
  });
  
  // Logout (client-side token removal)
  app.post('/api/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  });
  
  // Get platform status
  app.get('/api/user/platforms', requireAuth, (req: any, res: Response) => {
    res.json({
      youtube: !!req.user.youtubeAccessToken,
      facebook: false,
      instagram: false,
      tiktok: false
    });
  });

  // YouTube OAuth - Get auth URL
  app.get('/api/youtube/auth-url', requireAuth, (req: any, res: Response) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'Google Client ID not configured' });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/youtube/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ].join(' ');

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: req.userId
      });

      const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  // YouTube OAuth callback
  app.get('/api/youtube/callback', async (req: Request, res: Response) => {
    try {
      const { code, state: userId } = req.query;
      
      if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Google OAuth credentials not configured' });
      }

      // Exchange code for tokens
      const redirectUri = `${req.protocol}://${req.get('host')}/api/youtube/callback`;
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }

      const tokens = await tokenResponse.json();

      // Get channel info
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` },
        }
      );

      let channelTitle = 'Unknown Channel';
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        if (channelData.items && channelData.items.length > 0) {
          channelTitle = channelData.items[0].snippet.title;
        }
      }

      // Update user with YouTube tokens
      const user = users.find(u => u.id === userId);
      if (user) {
        user.youtubeAccessToken = tokens.access_token;
        user.youtubeRefreshToken = tokens.refresh_token;
        user.youtubeChannelTitle = channelTitle;
        user.youtubeTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        user.lastActive = new Date().toISOString();
      }

      // Redirect to success page
      res.redirect('/?youtube=connected');
    } catch (error) {
      console.error('YouTube callback error:', error);
      res.redirect('/?youtube=error');
    }
  });

  // Get YouTube videos
  app.get('/api/youtube/videos', requireAuth, async (req: any, res: Response) => {
    try {
      if (!req.user.youtubeAccessToken) {
        return res.status(401).json({ error: 'YouTube not connected' });
      }

      // Get channel's uploads playlist
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
        {
          headers: { 'Authorization': `Bearer ${req.user.youtubeAccessToken}` },
        }
      );

      if (!channelResponse.ok) {
        return res.status(401).json({ error: 'YouTube access token invalid' });
      }

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.json([]);
      }

      // Get videos from uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`,
        {
          headers: { 'Authorization': `Bearer ${req.user.youtubeAccessToken}` },
        }
      );

      if (!videosResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch videos' });
      }

      const videosData = await videosResponse.json();
      const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

      // Get detailed video information
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${videoIds}`,
        {
          headers: { 'Authorization': `Bearer ${req.user.youtubeAccessToken}` },
        }
      );

      if (!detailsResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch video details' });
      }

      const detailsData = await detailsResponse.json();
      const videos = detailsData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnailUrl: video.snippet.thumbnails.default.url,
        publishedAt: video.snippet.publishedAt,
        privacyStatus: video.status.privacyStatus,
        viewCount: video.statistics?.viewCount,
        likeCount: video.statistics?.likeCount,
      }));

      res.json(videos);
    } catch (error) {
      console.error('YouTube videos error:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Hide YouTube videos
  app.post('/api/youtube/hide', requireAuth, async (req: any, res: Response) => {
    try {
      const { videoIds } = req.body;
      
      if (!req.user.youtubeAccessToken) {
        return res.status(401).json({ error: 'YouTube not connected' });
      }

      if (!videoIds || !Array.isArray(videoIds)) {
        return res.status(400).json({ error: 'videoIds array is required' });
      }

      // Update videos to private
      const results = [];
      for (const videoId of videoIds) {
        try {
          const response = await fetch(
            'https://www.googleapis.com/youtube/v3/videos?part=status',
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${req.user.youtubeAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: videoId,
                status: { privacyStatus: 'private' },
              }),
            }
          );

          results.push({
            videoId,
            success: response.ok,
            error: response.ok ? null : 'Failed to update video'
          });
        } catch (error) {
          results.push({
            videoId,
            success: false,
            error: 'Network error'
          });
        }
      }

      // Update user hide count
      req.user.hideCount = (req.user.hideCount || 0) + videoIds.length;

      res.json({ results, message: 'Videos hidden successfully' });
    } catch (error) {
      console.error('YouTube hide error:', error);
      res.status(500).json({ error: 'Failed to hide videos' });
    }
  });

  // Restore YouTube videos
  app.post('/api/youtube/restore', requireAuth, async (req: any, res: Response) => {
    try {
      const { videoIds } = req.body;
      
      if (!req.user.youtubeAccessToken) {
        return res.status(401).json({ error: 'YouTube not connected' });
      }

      if (!videoIds || !Array.isArray(videoIds)) {
        return res.status(400).json({ error: 'videoIds array is required' });
      }

      // Update videos to public
      const results = [];
      for (const videoId of videoIds) {
        try {
          const response = await fetch(
            'https://www.googleapis.com/youtube/v3/videos?part=status',
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${req.user.youtubeAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: videoId,
                status: { privacyStatus: 'public' },
              }),
            }
          );

          results.push({
            videoId,
            success: response.ok,
            error: response.ok ? null : 'Failed to update video'
          });
        } catch (error) {
          results.push({
            videoId,
            success: false,
            error: 'Network error'
          });
        }
      }

      res.json({ results, message: 'Videos restored successfully' });
    } catch (error) {
      console.error('YouTube restore error:', error);
      res.status(500).json({ error: 'Failed to restore videos' });
    }
  });

  // Disconnect YouTube
  app.post('/api/youtube/disconnect', requireAuth, (req: any, res: Response) => {
    req.user.youtubeAccessToken = undefined;
    req.user.youtubeRefreshToken = undefined;
    req.user.youtubeChannelTitle = undefined;
    req.user.youtubeTokenExpiresAt = undefined;
    
    res.json({ message: 'YouTube disconnected successfully' });
  });
  
  // Catch-all for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ 
      error: 'API endpoint not found', 
      code: 'NOT_FOUND',
      path: req.path 
    });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}