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
      const redirectUri = `https://workspace.ykykyair.repl.co/auth-callback.html`;
      
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
      const redirectUri = `https://workspace.ykykyair.repl.co/auth-callback.html`;
      
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

  // YouTube logout
  app.post("/api/youtube/logout", (req, res) => {
    storage.removeAuthToken('youtube');
    res.json({ success: true });
  });
};