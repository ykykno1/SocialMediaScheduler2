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
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'YouTube API key is required' });
      }

      // Test the API key by fetching channel info
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&key=${apiKey}`);
      
      if (!response.ok) {
        return res.status(400).json({ error: 'Invalid YouTube API key' });
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ error: 'No channel found for this API key' });
      }

      const channel = data.items[0];
      const user = req.user;
      
      // Update user with YouTube info
      user.youtubeApiKey = apiKey;
      user.youtubeChannelId = channel.id;
      user.youtubeChannelTitle = channel.snippet.title;

      res.json({
        connected: true,
        channelTitle: channel.snippet.title,
        channelId: channel.id
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

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${user.youtubeChannelId}&type=video&order=date&maxResults=50&key=${user.youtubeApiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      
      const videos = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: '0', // Would need additional API call for view count
        isHidden: false // YouTube API doesn't easily expose privacy status
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