import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// In-memory storage for users
const users: any[] = [];

const requireAuth = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
  
  const user = users.find(u => u.token === token);
  if (!user) {
    return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }
  
  req.user = user;
  next();
};

export function registerRoutes(app: Express): Server {
  // Authentication routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, username, password } = req.body;
      
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const token = Date.now().toString();
      const user = {
        id: token,
        email,
        username,
        password,
        token,
        youtubeApiKey: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        createdAt: new Date()
      };
      
      users.push(user);
      res.status(201).json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      res.json({ user: { id: user.id, email: user.email, username: user.username }, token: user.token });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/user', requireAuth, (req: any, res: Response) => {
    const { password, token, ...userData } = req.user;
    res.json(userData);
  });

  app.post('/api/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  });

  // YouTube routes
  app.get('/api/youtube/status', requireAuth, (req: any, res: Response) => {
    const user = req.user;
    res.json({
      connected: !!user.youtubeApiKey,
      channelTitle: user.youtubeChannelTitle || null,
      channelId: user.youtubeChannelId || null
    });
  });

  app.post('/api/youtube/connect', requireAuth, async (req: any, res: Response) => {
    try {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      
      if (!youtubeApiKey) {
        return res.status(500).json({ error: 'YouTube API not configured' });
      }

      // Test the API key by fetching a public video (we'll use a sample channel instead of 'mine')
      // Since we're using API key instead of OAuth, we can't use 'mine=true'
      // We'll connect the user and let them proceed to view videos
      const user = req.user;
      
      // Update user with YouTube info (mark as connected)
      user.youtubeApiKey = youtubeApiKey;
      user.youtubeChannelId = 'connected'; // We'll handle this differently
      user.youtubeChannelTitle = 'YouTube מחובר';

      res.json({
        connected: true,
        channelTitle: 'YouTube מחובר',
        channelId: 'connected'
      });
    } catch (error) {
      console.error('YouTube connect error:', error);
      res.status(500).json({ error: 'Failed to connect to YouTube' });
    }
  });

  app.get('/api/youtube/videos', requireAuth, async (req: any, res: Response) => {
    try {
      const user = req.user;
      
      if (!user.youtubeApiKey) {
        return res.status(400).json({ error: 'YouTube not connected' });
      }

      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      
      if (!youtubeApiKey) {
        return res.status(500).json({ error: 'YouTube API not configured' });
      }

      // For demonstration, let's fetch popular videos from a known channel
      // In production, this would fetch from the user's actual channel
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=שבת&type=video&order=relevance&maxResults=10&key=${youtubeApiKey}`
      );

      if (!response.ok) {
        console.error('YouTube API error:', response.status, await response.text());
        return res.status(500).json({ error: 'Failed to fetch videos from YouTube API' });
      }

      const data = await response.json();
      
      const videos = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: Math.floor(Math.random() * 10000).toString(), // Random view count for demo
        isHidden: Math.random() > 0.7 // Random hidden status for demo
      })) || [];

      res.json({ videos });
    } catch (error) {
      console.error('YouTube videos error:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.post('/api/youtube/videos/:videoId/hide', requireAuth, async (req: any, res: Response) => {
    try {
      const { videoId } = req.params;
      const user = req.user;
      
      if (!user.youtubeApiKey) {
        return res.status(400).json({ error: 'YouTube not connected' });
      }

      // Note: YouTube API v3 doesn't allow changing video privacy status directly
      // This would require OAuth2 and the videos.update method
      // For now, we'll simulate the action
      
      res.json({ 
        success: true, 
        message: 'Video hidden successfully',
        note: 'This is a simulated action. Full implementation requires OAuth2 authentication.'
      });
    } catch (error) {
      console.error('YouTube hide video error:', error);
      res.status(500).json({ error: 'Failed to hide video' });
    }
  });

  app.post('/api/youtube/videos/:videoId/show', requireAuth, async (req: any, res: Response) => {
    try {
      const { videoId } = req.params;
      const user = req.user;
      
      if (!user.youtubeApiKey) {
        return res.status(400).json({ error: 'YouTube not connected' });
      }

      // Note: YouTube API v3 doesn't allow changing video privacy status directly
      // This would require OAuth2 and the videos.update method
      // For now, we'll simulate the action
      
      res.json({ 
        success: true, 
        message: 'Video shown successfully',
        note: 'This is a simulated action. Full implementation requires OAuth2 authentication.'
      });
    } catch (error) {
      console.error('YouTube show video error:', error);
      res.status(500).json({ error: 'Failed to show video' });
    }
  });

  app.post('/api/youtube/hide-all', requireAuth, async (req: any, res: Response) => {
    try {
      const user = req.user;
      
      if (!user.youtubeApiKey) {
        return res.status(400).json({ error: 'YouTube not connected' });
      }

      // This would require OAuth2 to actually hide videos
      // For now, simulate the action
      
      res.json({ 
        success: true, 
        hiddenCount: 10,
        message: 'All videos hidden successfully',
        note: 'This is a simulated action. Full implementation requires OAuth2 authentication.'
      });
    } catch (error) {
      console.error('YouTube hide all error:', error);
      res.status(500).json({ error: 'Failed to hide all videos' });
    }
  });

  app.post('/api/youtube/show-all', requireAuth, async (req: any, res: Response) => {
    try {
      const user = req.user;
      
      if (!user.youtubeApiKey) {
        return res.status(400).json({ error: 'YouTube not connected' });
      }

      // This would require OAuth2 to actually show videos
      // For now, simulate the action
      
      res.json({ 
        success: true, 
        shownCount: 10,
        message: 'All videos shown successfully',
        note: 'This is a simulated action. Full implementation requires OAuth2 authentication.'
      });
    } catch (error) {
      console.error('YouTube show all error:', error);
      res.status(500).json({ error: 'Failed to show all videos' });
    }
  });

  // Catch-all for undefined API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}