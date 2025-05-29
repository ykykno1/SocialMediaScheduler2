import type { Express } from "express";
import { storage } from "./storage";
import fetch from 'node-fetch';
import { AuthToken, YouTubeVideo, SupportedPlatform, PrivacyStatus } from "@shared/schema";
import { google } from 'googleapis';

// Define a more specific type to help with TypeScript errors
type PrivacyStatusType = 'public' | 'private' | 'unlisted';

// Get YouTube client with authenticated credentials
const getYouTubeClient = async () => {
  const authToken = storage.getAuthToken('youtube');
  
  if (!authToken) {
    throw new Error("Not authenticated with YouTube");
  }
  
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    undefined // redirect URI not needed for API calls
  );
  
  // Set credentials
  auth.setCredentials({
    access_token: authToken.accessToken,
    refresh_token: authToken.refreshToken,
    expiry_date: authToken.expiresAt || undefined
  });
  
  // Setup token refresh callback
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      // Update stored token with new values
      const updatedToken: AuthToken = {
        ...authToken,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || authToken.refreshToken,
        expiresAt: tokens.expiry_date || undefined,
        timestamp: Date.now()
      };
      
      storage.saveAuthToken(updatedToken);
      console.log('YouTube token refreshed and saved');
    }
  });
  
  return google.youtube({ version: 'v3', auth });
};

export const registerYouTubeRoutes = (app: Express): void => {
  // Get YouTube auth URL for login
  app.get("/api/youtube/auth-url", (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/auth-callback.html`;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Google credentials not configured" });
      }
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      // Generate auth URL with required scopes
      const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ];
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent' // Force to get refresh token
      });
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating YouTube auth URL:', error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });
  
  // Handle OAuth callback
  app.get("/api/youtube/auth-callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${req.protocol}://${req.get('host')}/auth-callback.html`
      );
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      
      if (!tokens.access_token) {
        return res.status(400).json({ error: "Failed to obtain access token" });
      }
      
      // Get user info
      oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const channelsResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true
      });
      
      const channel = channelsResponse.data.items?.[0];
      const userId = channel?.id || 'unknown';
      const channelTitle = channel?.snippet?.title || 'Unknown Channel';
      
      // Save token
      const token: AuthToken = {
        platform: 'youtube',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date,
        expiresIn: tokens.expires_in,
        timestamp: Date.now(),
        userId,
        additionalData: {
          channelTitle
        }
      };
      
      storage.saveAuthToken(token);
      
      // Add history entry
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: 'auth',
        platform: 'youtube',
        success: true,
        affectedItems: 0
      });
      
      // Redirect to dashboard with success message
      res.redirect('/dashboard?youtube_auth=success');
    } catch (error) {
      console.error('YouTube auth callback error:', error);
      res.redirect('/dashboard?youtube_auth=error');
    }
  });
  
  // Get auth status
  app.get("/api/youtube/auth-status", (req, res) => {
    const auth = storage.getAuthToken('youtube');
    
    res.json({
      isAuthenticated: !!auth,
      platform: "youtube",
      authTime: auth ? new Date(auth.timestamp).toISOString() : null,
      channelTitle: auth?.additionalData?.channelTitle || null
    });
  });
  
  // Logout/disconnect
  app.post("/api/youtube/logout", (req, res) => {
    storage.removeAuthToken('youtube');
    
    storage.addHistoryEntry({
      timestamp: new Date(),
      action: "restore",
      platform: "youtube",
      success: true,
      affectedItems: 0
    });
    
    res.json({ success: true });
  });
  
  // Get YouTube videos
  app.get("/api/youtube/videos", async (req, res) => {
    try {
      // Check auth
      const auth = storage.getAuthToken('youtube');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }
      
      // Try to get cached videos first
      const cachedVideos = storage.getCachedYouTubeVideos();
      if (cachedVideos.length > 0) {
        return res.json(cachedVideos);
      }
      
      // Fetch videos if not in cache
      const youtube = await getYouTubeClient();
      
      const videosResponse = await youtube.videos.list({
        part: ['snippet', 'status', 'contentDetails'],
        mine: true,
        maxResults: 50
      });
      
      if (!videosResponse.data.items || videosResponse.data.items.length === 0) {
        return res.json([]);
      }
      
      // Map response to our schema
      const videos: YouTubeVideo[] = videosResponse.data.items.map(video => ({
        id: video.id!,
        title: video.snippet?.title || 'Untitled Video',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        privacyStatus: (video.status?.privacyStatus as 'public' | 'private' | 'unlisted') || 'public',
        isHidden: video.status?.privacyStatus === 'private'
      }));
      
      // Cache the videos
      storage.saveCachedYouTubeVideos(videos);
      
      res.json(videos);
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });
  
  // Update video privacy
  app.post("/api/youtube/videos/:videoId/privacy", async (req, res) => {
    try {
      const { videoId } = req.params;
      const { privacyStatus } = req.body;
      
      if (!videoId || !privacyStatus) {
        return res.status(400).json({ error: "Missing video ID or privacy status" });
      }
      
      if (!['public', 'private', 'unlisted'].includes(privacyStatus)) {
        return res.status(400).json({ error: "Invalid privacy status. Must be 'public', 'private', or 'unlisted'" });
      }
      
      // Get YouTube client
      const youtube = await getYouTubeClient();
      
      // Update the video
      await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus
          }
        }
      });
      
      // Update cache
      const videos = storage.getCachedYouTubeVideos();
      const updatedVideos = videos.map(video => {
        if (video.id === videoId) {
          return {
            ...video,
            privacyStatus: privacyStatus as 'public' | 'private' | 'unlisted',
            isHidden: privacyStatus === 'private'
          };
        }
        return video;
      });
      
      storage.saveCachedYouTubeVideos(updatedVideos);
      
      // Add history entry
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: privacyStatus === 'private' ? 'hide' : 'restore',
        platform: 'youtube',
        success: true,
        affectedItems: 1
      });
      
      res.json({ success: true, videoId, privacyStatus });
    } catch (error) {
      console.error('Error updating video privacy:', error);
      res.status(500).json({ error: "Failed to update video privacy" });
    }
  });
  
  // Hide all videos (make private)
  app.post("/api/youtube/videos/hide-all", async (req, res) => {
    try {
      // Get settings for excluded videos
      const settings = storage.getSettings();
      const exceptedIds = settings.exceptedContentIds?.youtube || [];
      
      // Get videos
      const videos = storage.getCachedYouTubeVideos();
      
      if (videos.length === 0) {
        // Fetch if cache is empty
        const youtube = await getYouTubeClient();
        
        const videosResponse = await youtube.videos.list({
          part: ['snippet', 'status', 'contentDetails'],
          mine: true,
          maxResults: 50
        });
        
        if (videosResponse.data.items) {
          const fetchedVideos: YouTubeVideo[] = videosResponse.data.items.map(video => ({
            id: video.id!,
            title: video.snippet?.title || 'Untitled Video',
            description: video.snippet?.description || '',
            publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
            thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
            privacyStatus: (video.status?.privacyStatus as 'public' | 'private' | 'unlisted') || 'public',
            isHidden: video.status?.privacyStatus === 'private'
          }));
          
          storage.saveCachedYouTubeVideos(fetchedVideos);
        }
      }
      
      // Get videos again (now they should be in cache)
      const allVideos = storage.getCachedYouTubeVideos();
      
      // Filter videos to hide (public videos that are not excepted)
      const videosToHide = allVideos.filter(video => 
        !exceptedIds.includes(video.id) && 
        video.privacyStatus !== 'private'
      );
      
      if (videosToHide.length === 0) {
        return res.json({
          success: true,
          message: "No videos found to hide",
          hiddenCount: 0
        });
      }
      
      // Save original status for later restore
      const originalStatuses: PrivacyStatus[] = videosToHide.map(video => ({
        platform: 'youtube',
        contentId: video.id,
        originalStatus: video.privacyStatus,
        timestamp: Date.now()
      }));
      
      storage.savePrivacyStatuses('youtube', originalStatuses);
      
      // Get YouTube client
      const youtube = await getYouTubeClient();
      
      // Update videos
      let successCount = 0;
      let failureCount = 0;
      let lastError = "";
      
      for (const video of videosToHide) {
        try {
          await youtube.videos.update({
            part: ['status'],
            requestBody: {
              id: video.id,
              status: {
                privacyStatus: 'private'
              }
            }
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error hiding video ${video.id}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Update cache
      const updatedVideos = allVideos.map(video => {
        if (videosToHide.some(v => v.id === video.id)) {
          return {
            ...video,
            privacyStatus: 'private',
            isHidden: true
          };
        }
        return video;
      });
      
      storage.saveCachedYouTubeVideos(updatedVideos);
      
      // Add history entry
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "youtube",
        success: successCount > 0,
        affectedItems: successCount,
        error: failureCount > 0 ? lastError : undefined
      });
      
      // Update settings with last hide operation time
      storage.saveSettings({
        ...settings,
        lastHideOperation: new Date()
      });
      
      res.json({
        success: successCount > 0,
        message: successCount > 0 
          ? `${successCount} videos were successfully hidden` 
          : "Failed to hide videos",
        totalVideos: videosToHide.length,
        hiddenCount: successCount,
        failedCount: failureCount,
        error: failureCount > 0 ? lastError : undefined
      });
    } catch (error) {
      console.error('Error hiding all videos:', error);
      res.status(500).json({ error: "Failed to hide videos" });
    }
  });
  
  // Restore all videos
  app.post("/api/youtube/videos/restore-all", async (req, res) => {
    try {
      // Get saved original statuses
      const originalStatuses = storage.getPrivacyStatuses('youtube');
      
      if (originalStatuses.length === 0) {
        return res.json({
          success: true,
          message: "No videos found to restore",
          restoredCount: 0
        });
      }
      
      // Get YouTube client
      const youtube = await getYouTubeClient();
      
      // Restore videos
      let successCount = 0;
      let failureCount = 0;
      let lastError = "";
      
      for (const status of originalStatuses) {
        try {
          await youtube.videos.update({
            part: ['status'],
            requestBody: {
              id: status.contentId,
              status: {
                privacyStatus: status.originalStatus
              }
            }
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error restoring video ${status.contentId}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Update cache
      const videos = storage.getCachedYouTubeVideos();
      const updatedVideos = videos.map(video => {
        const originalStatus = originalStatuses.find(s => s.contentId === video.id);
        if (originalStatus) {
          return {
            ...video,
            privacyStatus: originalStatus.originalStatus as 'public' | 'private' | 'unlisted',
            isHidden: originalStatus.originalStatus === 'private'
          };
        }
        return video;
      });
      
      storage.saveCachedYouTubeVideos(updatedVideos);
      
      // Clear saved statuses
      storage.clearPrivacyStatuses('youtube');
      
      // Add history entry
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "youtube",
        success: successCount > 0,
        affectedItems: successCount,
        error: failureCount > 0 ? lastError : undefined
      });
      
      // Update settings with last restore operation time
      const settings = storage.getSettings();
      storage.saveSettings({
        ...settings,
        lastRestoreOperation: new Date()
      });
      
      res.json({
        success: successCount > 0,
        message: successCount > 0 
          ? `${successCount} videos were successfully restored` 
          : "Failed to restore videos",
        totalVideos: originalStatuses.length,
        restoredCount: successCount,
        failedCount: failureCount,
        error: failureCount > 0 ? lastError : undefined
      });
    } catch (error) {
      console.error('Error restoring all videos:', error);
      res.status(500).json({ error: "Failed to restore videos" });
    }
  });
};