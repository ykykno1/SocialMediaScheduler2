import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from './enhanced-storage.js';
import { generateToken } from './middleware.js';
import fetch from 'node-fetch';
import { SupportedPlatform } from "@shared/schema";

interface SessionData {
  userId?: string;
}

export function registerOAuthRoutes(app: Express) {
  // OAuth callback handler
  app.post("/api/auth-callback", async (req, res) => {
    try {
      console.log("OAuth callback received:", req.body);

      const { platform, code, state, error, error_description } = req.body;

      if (error) {
        console.error("OAuth error:", error, error_description);
        return res.status(400).json({ 
          error: "OAuth authorization failed", 
          details: error_description || error 
        });
      }

      if (!platform || !code) {
        return res.status(400).json({ error: "Platform and code required" });
      }

      // Validate platform
      if (!['facebook', 'youtube', 'instagram'].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      // Get user ID from session or token
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = decoded.userId;
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      const sessionData = req.session as SessionData;
      if (!userId && sessionData?.userId) {
        userId = sessionData.userId;
      }

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      let tokenData: any;

      if (platform === 'facebook') {
        // Exchange Facebook code for access token
        const tokenUrl = 'https://graph.facebook.com/v22.0/oauth/access_token';
        const params = new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID || '',
          client_secret: process.env.FACEBOOK_APP_SECRET || '',
          redirect_uri: process.env.NODE_ENV === 'production' 
            ? 'https://shabbat-robot.replit.app/facebook' 
            : 'http://localhost:5000/facebook',
          code: code
        });

        const tokenResponse = await fetch(`${tokenUrl}?${params}`);
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json() as any;
          console.error("Facebook token exchange error:", errorData);
          return res.status(tokenResponse.status).json({ 
            error: "Failed to exchange code for token",
            details: errorData?.error?.message || "Token exchange failed"
          });
        }

        const tokens = await tokenResponse.json() as any;
        
        tokenData = {
          platform: 'facebook' as SupportedPlatform,
          accessToken: tokens.access_token,
          expiresIn: tokens.expires_in || 3600,
          timestamp: Date.now(),
          userId: userId
        };

      } else if (platform === 'youtube') {
        // Exchange YouTube/Google code for access token
        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: process.env.NODE_ENV === 'production' 
            ? 'https://shabbat-robot.replit.app/youtube-oauth' 
            : 'http://localhost:5000/youtube-oauth',
          grant_type: 'authorization_code',
          code: code
        });

        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json() as any;
          console.error("YouTube token exchange error:", errorData);
          return res.status(tokenResponse.status).json({ 
            error: "Failed to exchange code for token",
            details: errorData?.error_description || errorData?.error || "Token exchange failed"
          });
        }

        const tokens = await tokenResponse.json() as any;
        
        tokenData = {
          platform: 'youtube' as SupportedPlatform,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in || 3600,
          expiresAt: Date.now() + (tokens.expires_in * 1000),
          timestamp: Date.now(),
          userId: userId
        };
      }

      if (!tokenData) {
        return res.status(400).json({ error: "Unsupported platform for token exchange" });
      }

      // Save the token
      await storage.saveAuthToken(tokenData, userId);

      // Test the connection
      let testResult = false;
      try {
        if (platform === 'facebook') {
          const testResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${tokenData.accessToken}`);
          testResult = testResponse.ok;
        } else if (platform === 'youtube') {
          const testResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${tokenData.accessToken}`);
          testResult = testResponse.ok;
        }
      } catch (error) {
        console.error("Connection test failed:", error);
      }

      // Log the authentication
      storage.addHistoryEntry({
        platform: platform as SupportedPlatform,
        action: 'auth',
        contentId: `${platform}_auth_${Date.now()}`,
        success: testResult,
        timestamp: new Date(),
        details: `${platform} connected ${testResult ? 'successfully' : 'with warnings'}`
      }, userId);

      res.json({
        success: true,
        platform: platform,
        connected: testResult,
        message: `${platform} connected successfully`,
        expiresIn: tokenData.expiresIn
      });

    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ 
        error: "OAuth callback failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Manual token input route
  app.post("/api/manual-token", async (req, res) => {
    try {
      const { platform, accessToken } = req.body;

      if (!platform || !accessToken) {
        return res.status(400).json({ error: "Platform and access token required" });
      }

      // Validate platform
      if (!['facebook', 'youtube', 'instagram'].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      // Get user ID from auth header
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = decoded.userId;
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Test the token before saving
      let testResult = false;
      try {
        if (platform === 'facebook') {
          const testResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${accessToken}`);
          testResult = testResponse.ok;
          
          if (!testResult) {
            const errorData = await testResponse.json() as any;
            return res.status(400).json({ 
              error: "Invalid Facebook token", 
              details: errorData?.error?.message || "Token validation failed" 
            });
          }
        } else if (platform === 'youtube') {
          const testResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}`);
          testResult = testResponse.ok;
          
          if (!testResult) {
            const errorData = await testResponse.json() as any;
            return res.status(400).json({ 
              error: "Invalid YouTube token", 
              details: errorData?.error?.message || "Token validation failed" 
            });
          }
        }
      } catch (error) {
        console.error("Token validation error:", error);
        return res.status(400).json({ 
          error: "Token validation failed", 
          details: error instanceof Error ? error.message : "Unknown error" 
        });
      }

      // Save the manual token
      const tokenData = {
        platform: platform as SupportedPlatform,
        accessToken: accessToken,
        timestamp: Date.now(),
        userId: userId,
        isManualToken: true
      };

      await storage.saveAuthToken(tokenData, userId);

      // Log the manual token addition
      storage.addHistoryEntry({
        platform: platform as SupportedPlatform,
        action: 'manual_token',
        contentId: `${platform}_manual_${Date.now()}`,
        success: true,
        timestamp: new Date(),
        details: `Manual ${platform} token added`
      }, userId);

      res.json({
        success: true,
        platform: platform,
        message: `${platform} token added successfully`,
        isManualToken: true
      });

    } catch (error) {
      console.error("Manual token error:", error);
      res.status(500).json({ 
        error: "Failed to add manual token", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Instagram auth route (using Facebook token)
  app.get("/api/auth/instagram", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = decoded.userId;
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user has Facebook token
      const facebookAuth = await storage.getAuthToken('facebook' as SupportedPlatform, userId);
      if (!facebookAuth?.accessToken) {
        return res.status(400).json({ 
          error: "Facebook connection required first", 
          details: "Instagram access requires Facebook Business account connection"
        });
      }

      // Try to get Instagram business account info
      const instagramUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=instagram_business_account&access_token=${facebookAuth.accessToken}`;
      const response = await fetch(instagramUrl);

      if (!response.ok) {
        const errorData = await response.json() as any;
        return res.status(response.status).json({ 
          error: "Failed to fetch Instagram account", 
          details: errorData?.error?.message || "Instagram API error" 
        });
      }

      const data = await response.json() as any;
      const instagramAccounts = data.data?.filter((page: any) => page.instagram_business_account) || [];

      if (instagramAccounts.length === 0) {
        return res.status(400).json({ 
          error: "No Instagram business accounts found", 
          details: "Connect your Instagram business account to your Facebook page first" 
        });
      }

      // Save Instagram connection info (using Facebook token)
      const instagramTokenData = {
        platform: 'instagram' as SupportedPlatform,
        accessToken: facebookAuth.accessToken,
        timestamp: Date.now(),
        userId: userId,
        additionalData: {
          instagramAccounts: instagramAccounts,
          facebookPageId: instagramAccounts[0]?.id
        }
      };

      await storage.saveAuthToken(instagramTokenData, userId);

      // Log the Instagram connection
      storage.addHistoryEntry({
        platform: 'instagram' as SupportedPlatform,
        action: 'auth',
        contentId: `instagram_auth_${Date.now()}`,
        success: true,
        timestamp: new Date(),
        details: `Instagram connected via Facebook (${instagramAccounts.length} accounts)`
      }, userId);

      res.json({
        success: true,
        platform: 'instagram',
        accounts: instagramAccounts,
        message: `Instagram connected successfully (${instagramAccounts.length} business accounts)`
      });

    } catch (error) {
      console.error("Instagram auth error:", error);
      res.status(500).json({ 
        error: "Instagram authentication failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Instagram media route
  app.get("/api/instagram/media", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId: string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = decoded.userId;
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get Instagram auth token
      const instagramAuth = await storage.getAuthToken('instagram' as SupportedPlatform, userId);
      if (!instagramAuth?.accessToken) {
        return res.status(401).json({ error: "Instagram not connected" });
      }

      const instagramAccounts = instagramAuth.additionalData?.instagramAccounts || [];
      if (instagramAccounts.length === 0) {
        return res.status(400).json({ error: "No Instagram accounts found" });
      }

      // Get media for the first Instagram account
      const instagramAccountId = instagramAccounts[0].instagram_business_account?.id;
      if (!instagramAccountId) {
        return res.status(400).json({ error: "Instagram account ID not found" });
      }

      const mediaUrl = `https://graph.facebook.com/v22.0/${instagramAccountId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=10&access_token=${instagramAuth.accessToken}`;
      const mediaResponse = await fetch(mediaUrl);

      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json() as any;
        return res.status(mediaResponse.status).json({ 
          error: "Failed to fetch Instagram media", 
          details: errorData?.error?.message || "Instagram API error" 
        });
      }

      const mediaData = await mediaResponse.json() as any;

      res.json({
        media: mediaData.data || [],
        account: instagramAccounts[0],
        total: mediaData.data?.length || 0
      });

    } catch (error) {
      console.error("Instagram media error:", error);
      res.status(500).json({ 
        error: "Failed to fetch Instagram media", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}