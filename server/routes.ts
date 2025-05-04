import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';
import { type FacebookPost } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Get Facebook app configuration
  app.get("/api/facebook-config", (req, res) => {
    // Use the new Facebook App ID directly
    const appId = "1598261231562840";
    
    // Log for debugging
    console.log(`Using Facebook App ID: ${appId}, from env: ${process.env.FACEBOOK_APP_ID}`);
    
    // Get domain from request
    const domain = req.headers.host;
    
    // Use the domain from headers by default
    const redirectUri = `https://${domain}/auth-callback.html`;
    
    // Log the redirectUri for debugging
    console.log(`Generated redirect URI: ${redirectUri}`);
    
    res.json({
      appId,
      redirectUri
    });
  });
  
  // Exchange Facebook code for token
  app.post("/api/auth-callback", async (req, res) => {
    try {
      const { code, redirectUri } = req.body;
      
      if (!code || !redirectUri) {
        return res.status(400).json({ error: "Missing code or redirectUri" });
      }
      
      // Use the new Facebook App ID directly
      const fbAppId = "1598261231562840";
      const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
      
      // Log for debugging
      console.log(`Using Facebook App ID: ${fbAppId} for token exchange`);
      
      if (!fbAppSecret) {
        return res.status(500).json({ error: "Facebook App Secret not configured" });
      }
      
      // Exchange code for token
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${fbAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${fbAppSecret}&` +
        `code=${code}`;
      
      const tokenResponse = await fetch(tokenUrl);
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Facebook token exchange error:", errorData);
        return res.status(400).json({ error: "Failed to exchange code for token", details: errorData });
      }
      
      const tokenData = await tokenResponse.json() as { access_token: string; expires_in: number };
      
      // Get user info to get their Facebook ID
      const userUrl = `https://graph.facebook.com/me?access_token=${tokenData.access_token}`;
      const userResponse = await fetch(userUrl);
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error("Facebook user info error:", errorData);
        return res.status(400).json({ error: "Failed to get user info", details: errorData });
      }
      
      const userData = await userResponse.json() as { id: string };
      
      // Save the auth token
      const auth = storage.saveFacebookAuth({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        timestamp: Date.now(),
        userId: userData.id
      });
      
      // Add a history entry for successful authentication
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore", // Use restore as this is making content visible again in a way
        platform: "facebook",
        success: true,
        affectedItems: 0,
        error: undefined
      });
      
      res.json({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        user_id: userData.id
      });
    } catch (error) {
      console.error("Auth callback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get user settings
  app.get("/api/settings", (req, res) => {
    const settings = storage.getSettings();
    res.json(settings);
  });
  
  // Save user settings
  app.post("/api/settings", (req, res) => {
    try {
      const settings = storage.saveSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Settings save error:", error);
      res.status(400).json({ error: "Invalid settings data" });
    }
  });
  
  // Get auth status
  app.get("/api/auth-status", (req, res) => {
    const auth = storage.getFacebookAuth();
    res.json({
      isAuthenticated: !!auth,
      // Don't send the token to the client for security
      platform: "facebook",
      authTime: auth ? new Date(auth.timestamp).toISOString() : null
    });
  });
  
  // Logout/disconnect
  app.post("/api/logout", (req, res) => {
    storage.removeFacebookAuth();
    storage.addHistoryEntry({
      timestamp: new Date(),
      action: "restore", // Same as auth since this is disabling automation
      platform: "facebook",
      success: true,
      affectedItems: 0,
      error: undefined
    });
    res.json({ success: true });
  });
  
  // Get history entries
  app.get("/api/history", (req, res) => {
    const history = storage.getHistoryEntries();
    res.json(history);
  });
  
  // Get Facebook posts - with simulated response when we don't have post permissions
  app.get("/api/facebook/posts", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Try to use cached posts first if available
      const cachedPosts = storage.getCachedPosts();
      if (cachedPosts.length > 0) {
        return res.json(cachedPosts);
      }
      
      // Since we don't have user_posts permission, we'll simulate a response
      // In a real app, you'd request permissions for feeds, but for testing we'll use demo data
      const simulatedPosts = [
        {
          id: `${auth.userId}_123456789`,
          message: "פוסט לדוגמה 1 - לא ניתן לקבל פוסטים אמיתיים ללא הרשאות",
          created_time: new Date(Date.now() - 86400000 * 3).toISOString(),
          privacy: { value: "EVERYONE" },
          isHidden: false
        },
        {
          id: `${auth.userId}_123456790`,
          message: "פוסט לדוגמה 2 - מדגים את הפונקציונליות של האפליקציה",
          created_time: new Date(Date.now() - 86400000 * 7).toISOString(),
          privacy: { value: "EVERYONE" },
          isHidden: false
        },
        {
          id: `${auth.userId}_123456791`,
          message: "פוסט לדוגמה 3 - הפוסט הזה ייעלם בשבת",
          created_time: new Date(Date.now() - 86400000 * 14).toISOString(),
          privacy: { value: "EVERYONE" },
          isHidden: false
        }
      ];
      
      // Save to cache
      storage.saveCachedPosts(simulatedPosts);
      
      res.json(simulatedPosts);
    } catch (error) {
      console.error("Facebook posts fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Hide Facebook posts (demo mode)
  app.post("/api/facebook/hide", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Get cached posts or create if empty
      let posts = storage.getCachedPosts();
      
      if (posts.length === 0) {
        // Create demo posts
        const simulatedPosts = [
          {
            id: `${auth.userId}_123456789`,
            message: "פוסט לדוגמה 1 - לא ניתן לקבל פוסטים אמיתיים ללא הרשאות",
            created_time: new Date(Date.now() - 86400000 * 3).toISOString(),
            privacy: { value: "EVERYONE" },
            isHidden: false
          },
          {
            id: `${auth.userId}_123456790`,
            message: "פוסט לדוגמה 2 - מדגים את הפונקציונליות של האפליקציה",
            created_time: new Date(Date.now() - 86400000 * 7).toISOString(),
            privacy: { value: "EVERYONE" },
            isHidden: false
          },
          {
            id: `${auth.userId}_123456791`,
            message: "פוסט לדוגמה 3 - הפוסט הזה ייעלם בשבת",
            created_time: new Date(Date.now() - 86400000 * 14).toISOString(), 
            privacy: { value: "EVERYONE" },
            isHidden: false
          }
        ];
        
        posts = simulatedPosts;
        storage.saveCachedPosts(posts);
      }
      
      // Get excepted post IDs from settings
      const settings = storage.getSettings();
      const exceptedPostIds = settings.exceptedPostIds || [];
      
      // Filter posts to hide (exclude excepted posts)
      const postsToHide = posts.filter(post => !exceptedPostIds.includes(post.id));
      
      // Simulate hiding posts - in demo mode we'll succeed with all posts
      const successCount = postsToHide.length;
      
      // Update cached posts to show they're hidden
      const updatedPosts = posts.map(post => {
        if (!exceptedPostIds.includes(post.id)) {
          return { ...post, privacy: { value: "SELF" }, isHidden: true };
        }
        return post;
      });
      
      // Update the cache with the modified posts
      storage.saveCachedPosts(updatedPosts);
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "facebook",
        success: true,
        affectedItems: successCount,
        error: undefined
      });
      
      // Update settings to record last hide operation
      storage.saveSettings({
        ...settings,
        lastHideOperation: new Date()
      });
      
      res.json({
        success: true,
        totalPosts: postsToHide.length,
        hiddenPosts: successCount,
        failedPosts: 0
      });
    } catch (error) {
      console.error("Hide posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Restore Facebook posts (demo mode)
  app.post("/api/facebook/restore", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Get cached posts or create demo posts
      let posts = storage.getCachedPosts();
      
      if (posts.length === 0) {
        // Create demo posts - with some posts already hidden
        const simulatedPosts = [
          {
            id: `${auth.userId}_123456789`,
            message: "פוסט לדוגמה 1 - לא ניתן לקבל פוסטים אמיתיים ללא הרשאות",
            created_time: new Date(Date.now() - 86400000 * 3).toISOString(),
            privacy: { value: "SELF" },
            isHidden: true
          },
          {
            id: `${auth.userId}_123456790`,
            message: "פוסט לדוגמה 2 - מדגים את הפונקציונליות של האפליקציה",
            created_time: new Date(Date.now() - 86400000 * 7).toISOString(),
            privacy: { value: "SELF" },
            isHidden: true
          },
          {
            id: `${auth.userId}_123456791`,
            message: "פוסט לדוגמה 3 - הפוסט הזה ייעלם בשבת",
            created_time: new Date(Date.now() - 86400000 * 14).toISOString(),
            privacy: { value: "SELF" },
            isHidden: true
          }
        ];
        
        posts = simulatedPosts;
        storage.saveCachedPosts(posts);
      }
      
      // Find posts with "SELF" privacy to restore
      const postsToRestore = posts.filter(post => 
        post.privacy && post.privacy.value === "SELF"
      );
      
      // Simulate restoring posts - in demo mode we'll succeed with all posts
      const successCount = postsToRestore.length;
      
      // Update cached posts to show they're restored
      const updatedPosts = posts.map(post => {
        if (post.privacy && post.privacy.value === "SELF") {
          return { ...post, privacy: { value: "EVERYONE" }, isHidden: false };
        }
        return post;
      });
      
      // Update the cache with the modified posts
      storage.saveCachedPosts(updatedPosts);
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "facebook",
        success: true,
        affectedItems: successCount,
        error: undefined
      });
      
      // Update settings to record last restore operation
      const settings = storage.getSettings();
      storage.saveSettings({
        ...settings,
        lastRestoreOperation: new Date()
      });
      
      res.json({
        success: true,
        totalPosts: postsToRestore.length,
        restoredPosts: successCount,
        failedPosts: 0
      });
    } catch (error) {
      console.error("Restore posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
