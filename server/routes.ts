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
  
  // Get Facebook posts
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
      
      // Request posts from Facebook Graph API
      const postsUrl = `https://graph.facebook.com/v19.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
      
      const postsResponse = await fetch(postsUrl);
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.json() as { error?: { code: number; message: string } };
        console.error("Facebook posts fetch error:", errorData);
        
        // Check if the token has expired or is invalid
        if (errorData.error && (errorData.error.code === 190 || errorData.error.code === 104)) {
          // Token is invalid, clear it
          storage.removeFacebookAuth();
          return res.status(401).json({ error: "Facebook authentication expired", details: errorData.error });
        }
        
        return res.status(400).json({ error: "Failed to fetch Facebook posts", details: errorData });
      }
      
      const postsData = await postsResponse.json() as { data: FacebookPost[] };
      
      if (!postsData.data || !Array.isArray(postsData.data)) {
        return res.status(400).json({ error: "Invalid response format from Facebook" });
      }
      
      // Add isHidden property to all posts
      const postsWithIsHidden = postsData.data.map(post => ({
        ...post,
        isHidden: post.privacy && post.privacy.value === "SELF"
      }));
      
      // Save posts to cache
      storage.saveCachedPosts(postsWithIsHidden);
      
      res.json(postsWithIsHidden);
    } catch (error) {
      console.error("Facebook posts fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Hide Facebook posts
  app.post("/api/facebook/hide", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Get cached posts or fetch if empty
      let posts = storage.getCachedPosts();
      
      if (posts.length === 0) {
        // Fetch posts if not in cache
        const postsUrl = `https://graph.facebook.com/v19.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
        const postsResponse = await fetch(postsUrl);
        
        if (!postsResponse.ok) {
          const errorData = await postsResponse.json() as { error?: { code: number; message: string } };
          console.error("Facebook posts fetch error:", errorData);
          return res.status(400).json({ error: "Failed to fetch Facebook posts", details: errorData });
        }
        
        const postsData = await postsResponse.json() as { data: FacebookPost[] };
        
        if (!postsData.data || !Array.isArray(postsData.data)) {
          return res.status(400).json({ error: "Invalid response format from Facebook" });
        }
        
        posts = postsData.data.map(post => ({
          ...post,
          isHidden: post.privacy && post.privacy.value === "SELF"
        }));
        storage.saveCachedPosts(posts);
      }
      
      // Get excepted post IDs from settings
      const settings = storage.getSettings();
      const exceptedPostIds = settings.exceptedPostIds || [];
      
      // Filter posts to hide (exclude excepted posts)
      const postsToHide = posts.filter(post => !exceptedPostIds.includes(post.id));
      
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each post to hide
      for (const post of postsToHide) {
        try {
          // Change privacy to "SELF" (only me)
          const updateUrl = `https://graph.facebook.com/v19.0/${post.id}?privacy={"value":"SELF"}&access_token=${auth.accessToken}`;
          const updateResponse = await fetch(updateUrl, { method: 'POST' });
          
          if (updateResponse.ok) {
            successCount++;
          } else {
            const errorData = await updateResponse.json() as { error?: { message: string } };
            console.error(`Failed to hide post ${post.id}:`, errorData);
            failureCount++;
            lastError = errorData.error?.message || "Unknown error";
          }
        } catch (error) {
          console.error(`Error hiding post ${post.id}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "facebook",
        success: failureCount === 0,
        affectedItems: successCount,
        error: lastError || undefined
      });
      
      // Update settings to record last hide operation
      storage.saveSettings({
        ...settings,
        lastHideOperation: new Date()
      });
      
      // Clear cache to force refresh on next fetch
      storage.clearCachedPosts();
      
      res.json({
        success: failureCount === 0,
        totalPosts: postsToHide.length,
        hiddenPosts: successCount,
        failedPosts: failureCount,
        error: lastError
      });
    } catch (error) {
      console.error("Hide posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Restore Facebook posts
  app.post("/api/facebook/restore", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Get fresh posts from API to find hidden ones
      const postsUrl = `https://graph.facebook.com/v19.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
      const postsResponse = await fetch(postsUrl);
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.json() as { error?: { code: number; message: string } };
        console.error("Facebook posts fetch error:", errorData);
        return res.status(400).json({ error: "Failed to fetch Facebook posts", details: errorData });
      }
      
      const postsData = await postsResponse.json() as { data: FacebookPost[] };
      
      if (!postsData.data || !Array.isArray(postsData.data)) {
        return res.status(400).json({ error: "Invalid response format from Facebook" });
      }
      
      // Normalize posts with isHidden property
      const posts = postsData.data.map(post => ({
        ...post,
        isHidden: post.privacy && post.privacy.value === "SELF"
      }));
      
      // Update the cache with fresh data
      storage.saveCachedPosts(posts);
      
      // Find posts with "SELF" privacy to restore
      const postsToRestore = posts.filter(post => 
        post.privacy && post.privacy.value === "SELF"
      );
      
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each post to restore
      for (const post of postsToRestore) {
        try {
          // Change privacy back to "EVERYONE"
          const updateUrl = `https://graph.facebook.com/v19.0/${post.id}?privacy={"value":"EVERYONE"}&access_token=${auth.accessToken}`;
          const updateResponse = await fetch(updateUrl, { method: 'POST' });
          
          if (updateResponse.ok) {
            successCount++;
          } else {
            const errorData = await updateResponse.json() as { error?: { message: string } };
            console.error(`Failed to restore post ${post.id}:`, errorData);
            failureCount++;
            lastError = errorData.error?.message || "Unknown error";
          }
        } catch (error) {
          console.error(`Error restoring post ${post.id}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "facebook",
        success: failureCount === 0,
        affectedItems: successCount,
        error: lastError || undefined
      });
      
      // Update settings to record last restore operation
      const settings = storage.getSettings();
      storage.saveSettings({
        ...settings,
        lastRestoreOperation: new Date()
      });
      
      // Clear cache to force refresh on next fetch
      storage.clearCachedPosts();
      
      res.json({
        success: failureCount === 0,
        totalPosts: postsToRestore.length,
        restoredPosts: successCount,
        failedPosts: failureCount,
        error: lastError
      });
    } catch (error) {
      console.error("Restore posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
