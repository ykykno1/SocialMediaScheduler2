import { Express } from "express";
import { google } from "googleapis";
import { storage } from "./storage";
import { AuthToken } from "@shared/schema";

export const registerYouTubeRoutes = (app: Express): void => {
  // Get YouTube auth URL for login
  app.get("/api/youtube/auth-url", (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      // Use the correct Replit domain for redirect
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Google credentials not configured" });
      }
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      // Generate auth URL with basic scopes first
      const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly'
      ];
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
      });
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating YouTube auth URL:', error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // Handle YouTube auth callback
  app.post("/api/youtube-auth-callback", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        return res.status(400).json({ error: "Failed to obtain access token" });
      }
      
      // Get user info
      oauth2Client.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      try {
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
          expiresAt: tokens.expiry_date ? Number(tokens.expiry_date) : undefined,
          timestamp: Date.now(),
          userId,
          additionalData: {
            channelTitle
          }
        };
        
        storage.saveAuthToken(token);
        
        res.json({ success: true, channelTitle });
      } catch (apiError) {
        console.error('YouTube API error:', apiError);
        res.status(400).json({ error: "Failed to get channel info" });
      }
    } catch (error) {
      console.error('YouTube auth callback error:', error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get YouTube auth status
  app.get("/api/youtube/auth-status", (req, res) => {
    const auth = storage.getAuthToken('youtube');
    
    if (!auth) {
      return res.json({ 
        isAuthenticated: false, 
        platform: 'youtube' 
      });
    }
    
    res.json({ 
      isAuthenticated: true, 
      platform: 'youtube',
      channelTitle: auth.additionalData?.channelTitle || 'Unknown Channel'
    });
  });

  // Get YouTube videos
  app.get("/api/youtube/videos", async (req, res) => {
    try {
      const auth = storage.getAuthToken('youtube');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      oauth2Client.setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Get user's uploaded videos
      const channelsResponse = await youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });
      
      if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
        return res.json({ videos: [] });
      }
      
      const uploadsPlaylistId = channelsResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        return res.json({ videos: [] });
      }
      
      // Get videos from uploads playlist
      const videosResponse = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 50
      });
      
      const videos = videosResponse.data.items?.map(item => ({
        id: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        publishedAt: item.snippet?.publishedAt,
        thumbnails: item.snippet?.thumbnails,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        privacyStatus: 'public' // Default, we'll get actual status separately if needed
      })) || [];
      
      res.json({ videos });
      
    } catch (error) {
      console.error('YouTube videos error:', error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Update video privacy
  app.post("/api/youtube/videos/:videoId/privacy", async (req, res) => {
    try {
      const { videoId } = req.params;
      const { privacyStatus } = req.body;
      
      const auth = storage.getAuthToken('youtube');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      oauth2Client.setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Update video privacy status
      await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: privacyStatus
          }
        }
      });
      
      res.json({ 
        success: true, 
        message: `Video privacy updated to ${privacyStatus}` 
      });
      
    } catch (error) {
      console.error('YouTube privacy update error:', error);
      res.status(500).json({ error: "Failed to update video privacy" });
    }
  });

  // Hide all videos
  app.post("/api/youtube/videos/hide-all", async (req, res) => {
    try {
      const auth = storage.getAuthToken('youtube');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      oauth2Client.setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Get all videos first
      const channelsResponse = await youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });
      
      if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
        return res.json({ hiddenCount: 0, message: "No videos found" });
      }
      
      const uploadsPlaylistId = channelsResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        return res.json({ hiddenCount: 0, message: "No uploads playlist found" });
      }
      
      const videosResponse = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 50
      });
      
      const videos = videosResponse.data.items || [];
      let hiddenCount = 0;
      
      // Hide each public video
      for (const item of videos) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) {
          try {
            await youtube.videos.update({
              part: ['status'],
              requestBody: {
                id: videoId,
                status: {
                  privacyStatus: 'private'
                }
              }
            });
            hiddenCount++;
          } catch (videoError) {
            console.error(`Failed to hide video ${videoId}:`, videoError);
          }
        }
      }
      
      res.json({ 
        success: true, 
        hiddenCount,
        message: `${hiddenCount} videos hidden` 
      });
      
    } catch (error) {
      console.error('YouTube hide all error:', error);
      res.status(500).json({ error: "Failed to hide videos" });
    }
  });

  // Restore all videos
  app.post("/api/youtube/videos/restore-all", async (req, res) => {
    try {
      const auth = storage.getAuthToken('youtube');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/auth-callback.html`;
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      oauth2Client.setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      // Get all videos first
      const channelsResponse = await youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });
      
      if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
        return res.json({ restoredCount: 0, message: "No videos found" });
      }
      
      const uploadsPlaylistId = channelsResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        return res.json({ restoredCount: 0, message: "No uploads playlist found" });
      }
      
      const videosResponse = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 50
      });
      
      const videos = videosResponse.data.items || [];
      let restoredCount = 0;
      
      // Restore each private video to public
      for (const item of videos) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (videoId) {
          try {
            await youtube.videos.update({
              part: ['status'],
              requestBody: {
                id: videoId,
                status: {
                  privacyStatus: 'public'
                }
              }
            });
            restoredCount++;
          } catch (videoError) {
            console.error(`Failed to restore video ${videoId}:`, videoError);
          }
        }
      }
      
      res.json({ 
        success: true, 
        restoredCount,
        message: `${restoredCount} videos restored` 
      });
      
    } catch (error) {
      console.error('YouTube restore all error:', error);
      res.status(500).json({ error: "Failed to restore videos" });
    }
  });

  // YouTube logout
  app.post("/api/youtube/logout", (req, res) => {
    storage.removeAuthToken('youtube');
    res.json({ success: true });
  });
};