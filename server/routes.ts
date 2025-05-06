import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';
import { type FacebookPost, SupportedPlatform } from "@shared/schema";
import { registerFacebookPagesRoutes } from "./facebook-pages";
import { registerYouTubeRoutes } from "./youtube-videos";

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
      const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?` +
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
      
      // Try to get page access information as well
      let pageAccess = false;
      try {
        // Using the correct API version and endpoint per Claude's advice
        const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=name,access_token,category&access_token=${tokenData.access_token}`;
        const pagesResponse = await fetch(pagesUrl);
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json() as any;
          if (pagesData.data && pagesData.data.length > 0) {
            pageAccess = true;
            console.log(`Found ${pagesData.data.length} Facebook pages for user with the correct permissions`);
          }
        } else {
          const errorData = await pagesResponse.json();
          console.error("Facebook pages API error:", errorData);
        }
      } catch (pagesError) {
        console.error("Error fetching user pages:", pagesError);
      }
      
      // Save the auth token
      const auth = storage.saveFacebookAuth({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        timestamp: Date.now(),
        userId: userData.id,
        pageAccess
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
      authTime: auth ? new Date(auth.timestamp).toISOString() : null,
      pageAccess: auth?.pageAccess || false
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
      console.log("Fetching posts from Facebook API...");
      const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
      
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
      console.log("Got posts from Facebook API:", postsData);
      
      if (!postsData.data || !Array.isArray(postsData.data)) {
        return res.status(400).json({ error: "Invalid response format from Facebook" });
      }
      
      // Add isHidden property to all posts - checking for both SELF and ONLY_ME values
      const postsWithIsHidden = postsData.data.map(post => ({
        ...post,
        isHidden: post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")
      }));
      
      // Save posts to cache
      storage.saveCachedPosts(postsWithIsHidden);
      
      res.json(postsWithIsHidden);
    } catch (error) {
      console.error("Facebook posts fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Hide Facebook posts - Try to use real API for admin users
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
        const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
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
          isHidden: post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")
        }));
        storage.saveCachedPosts(posts);
      }
      
      // Get excepted post IDs from settings
      const settings = storage.getSettings();
      const exceptedPostIds = settings.exceptedContentIds?.facebook || [];
      
      // Filter posts to hide (exclude excepted posts)
      const postsToHide = posts.filter(post => 
        !exceptedPostIds.includes(post.id) && 
        (!post.isHidden) && 
        post.privacy && 
        post.privacy.value !== "SELF" && 
        post.privacy.value !== "ONLY_ME"
      );
      
      console.log(`Attempting to hide ${postsToHide.length} posts using direct API calls`);
      
      // Attempt to actually update posts with the Facebook API
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each post
      for (const post of postsToHide) {
        try {
          console.log(`Attempting to hide post ${post.id}`);
          
          // שיטה מעודכנת לעדכון פרטיות לפי API של פייסבוק v22.0
          const privacyObject = { value: 'ONLY_ME' };  
          const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
          const updateResponse = await fetch(updateUrl, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privacy: privacyObject,
              access_token: auth.accessToken
            })
          });
          
          if (updateResponse.ok) {
            // Success!
            console.log(`Successfully hid post ${post.id}`);
            successCount++;
          } else {
            // Failed to update post privacy
            const errorData = await updateResponse.json() as { error?: { message: string; code: number } };
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
      
      // Update our local cache to reflect changes
      const updatedPosts = posts.map(post => {
        if (postsToHide.some(p => p.id === post.id)) {
          return {
            ...post,
            isHidden: true,
            privacy: { value: "ONLY_ME", description: "רק אני" }
          };
        }
        return post;
      });
      
      // Save modified posts to cache
      storage.saveCachedPosts(updatedPosts);
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "facebook",
        success: successCount > 0,
        affectedItems: successCount,
        error: failureCount > 0 ? (lastError || "שגיאה לא ידועה") : undefined
      });
      
      // Update settings to record last hide operation
      storage.saveSettings({
        ...settings,
        lastHideOperation: new Date()
      });
      
      const needsManualInstructions = failureCount > 0;
      
      // Send response based on results
      res.json({
        success: successCount > 0,
        totalPosts: postsToHide.length,
        hiddenPosts: successCount,
        failedPosts: failureCount,
        error: lastError,
        manualInstructions: needsManualInstructions,
        message: needsManualInstructions 
          ? "חלק מהפוסטים הוסתרו אוטומטית, אך היו כאלה שנכשלו. אנא הסתר את שאר הפוסטים באופן ידני באתר פייסבוק."
          : successCount > 0 
            ? `${successCount} פוסטים הוסתרו בהצלחה באופן אוטומטי!`
            : "לא נמצאו פוסטים להסתרה"
      });
    } catch (error) {
      console.error("Hide posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Restore Facebook posts - Try to use real API for admin users
  app.post("/api/facebook/restore", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Get cached posts
      let posts = storage.getCachedPosts();
      
      if (posts.length === 0) {
        // Fetch posts if not in cache
        const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&access_token=${auth.accessToken}`;
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
          isHidden: post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")
        }));
        storage.saveCachedPosts(posts);
      }
      
      // Find posts marked as hidden to restore - using updated ONLY_ME value
      const postsToRestore = posts.filter(post => 
        post.isHidden && 
        post.privacy && 
        (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")
      );
      
      console.log(`Attempting to restore ${postsToRestore.length} posts using direct API calls`);
      
      // Attempt to actually update posts with the Facebook API
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each post
      for (const post of postsToRestore) {
        try {
          console.log(`Attempting to restore post ${post.id}`);
          
          // שיטה מעודכנת לשחזור פרטיות לפי API של פייסבוק v22.0
          const privacyObject = { value: 'EVERYONE' };  
          const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
          const updateResponse = await fetch(updateUrl, { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privacy: privacyObject,
              access_token: auth.accessToken
            })
          });
          
          if (updateResponse.ok) {
            // Success!
            console.log(`Successfully restored post ${post.id}`);
            successCount++;
          } else {
            // Failed to update post privacy
            const errorData = await updateResponse.json() as { error?: { message: string; code: number } };
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
      
      // Update our local cache to reflect changes
      const updatedPosts = posts.map(post => {
        if (postsToRestore.some(p => p.id === post.id)) {
          return {
            ...post,
            isHidden: false,
            privacy: { value: "EVERYONE", description: "ציבורי" }
          };
        }
        return post;
      });
      
      // Save modified posts to cache
      storage.saveCachedPosts(updatedPosts);
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "facebook",
        success: successCount > 0,
        affectedItems: successCount,
        error: failureCount > 0 ? (lastError || "שגיאה לא ידועה") : undefined
      });
      
      // Update settings to record last restore operation
      const settings = storage.getSettings();
      storage.saveSettings({
        ...settings,
        lastRestoreOperation: new Date()
      });
      
      const needsManualInstructions = failureCount > 0;
      
      // Send response based on results
      res.json({
        success: successCount > 0,
        totalPosts: postsToRestore.length,
        restoredPosts: successCount,
        failedPosts: failureCount,
        error: lastError,
        manualInstructions: needsManualInstructions,
        message: needsManualInstructions 
          ? "חלק מהפוסטים שוחזרו אוטומטית, אך היו כאלה שנכשלו. אנא שחזר את שאר הפוסטים באופן ידני באתר פייסבוק."
          : successCount > 0 
            ? `${successCount} פוסטים שוחזרו בהצלחה באופן אוטומטי!`
            : "לא נמצאו פוסטים מוסתרים לשחזור"
      });
    } catch (error) {
      console.error("Restore posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register Facebook Pages routes
  // Handle manual token input
  app.post("/api/facebook/manual-token", (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      
      // First validate the token by making a request to get user info
      fetch(`https://graph.facebook.com/me?access_token=${token}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Invalid token");
          }
          return response.json();
        })
        .then((userData: any) => {
          if (!userData.id) {
            throw new Error("Token response missing user ID");
          }
          
          // Check for page access with this token
          return fetch(`https://graph.facebook.com/v22.0/me/accounts?fields=name,access_token&access_token=${token}`)
            .then(pagesResponse => {
              let pageAccess = false;
              
              if (pagesResponse.ok) {
                return pagesResponse.json().then((pagesData: any) => {
                  if (pagesData.data && pagesData.data.length > 0) {
                    pageAccess = true;
                    console.log(`Manual token has access to ${pagesData.data.length} Facebook pages`);
                  }
                  
                  // Save the manual token
                  const auth = storage.saveFacebookAuth({
                    accessToken: token,
                    expiresIn: 5184000, // Set a long expiration (60 days) since we don't know the actual expiration
                    timestamp: Date.now(),
                    userId: userData.id,
                    pageAccess,
                    isManualToken: true
                  });
                  
                  // Add a history entry
                  storage.addHistoryEntry({
                    timestamp: new Date(),
                    action: "manual_token",
                    platform: "facebook",
                    success: true,
                    affectedItems: 0,
                    error: undefined
                  });
                  
                  res.json({
                    success: true,
                    message: "טוקן נשמר בהצלחה",
                    pageAccess
                  });
                });
              } else {
                console.log("No page access with manual token");
                
                // Still save the token even without page access
                const auth = storage.saveFacebookAuth({
                  accessToken: token,
                  expiresIn: 5184000,
                  timestamp: Date.now(),
                  userId: userData.id,
                  pageAccess: false,
                  isManualToken: true
                });
                
                storage.addHistoryEntry({
                  timestamp: new Date(),
                  action: "manual_token",
                  platform: "facebook",
                  success: true,
                  affectedItems: 0,
                  error: undefined
                });
                
                res.json({
                  success: true,
                  message: "טוקן נשמר בהצלחה (ללא גישה לעמודים)",
                  pageAccess: false
                });
              }
            });
        })
        .catch(error => {
          console.error("Error validating manual token:", error);
          res.status(400).json({ 
            error: "טוקן לא תקין או פג תוקף", 
            message: error.message
          });
        });
    } catch (error) {
      console.error("Manual token error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Register Facebook Pages routes
  registerFacebookPagesRoutes(app);
  
  // Register YouTube routes
  registerYouTubeRoutes(app);
  
  // Get auth status for all platforms (replacing the Facebook-specific one)
  app.get("/api/auth-status", (req, res) => {
    // Get all platform auth statuses
    const facebookAuth = storage.getAuthToken('facebook');
    const youtubeAuth = storage.getAuthToken('youtube');
    
    // Return the first authorized platform or facebook as default
    let platform: SupportedPlatform = 'facebook';
    let isAuthenticated = false;
    let authTime = null;
    let additionalData = {};
    
    if (facebookAuth) {
      platform = 'facebook';
      isAuthenticated = true;
      authTime = new Date(facebookAuth.timestamp).toISOString();
      additionalData = {
        pageAccess: facebookAuth.additionalData?.pageAccess || false
      };
    } else if (youtubeAuth) {
      platform = 'youtube';
      isAuthenticated = true;
      authTime = new Date(youtubeAuth.timestamp).toISOString();
      additionalData = {
        channelTitle: youtubeAuth.additionalData?.channelTitle || null
      };
    }
    
    res.json({
      isAuthenticated,
      platform,
      authTime,
      ...additionalData
    });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
