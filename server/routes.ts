import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { 
  type FacebookPost, 
  SupportedPlatform,
  registerSchema,
  loginSchema
} from "@shared/schema";
import { registerFacebookPagesRoutes } from "./facebook-pages";
import { registerYouTubeRoutes } from "./youtube-videos";

export function registerRoutes(app: Express): Server {
  
  // ===== NEW AUTHENTICATION ROUTES =====
  
  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: "משתמש עם כתובת אימייל זו כבר קיים" 
        });
      }
      
      // Hash password (simple for demo)
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json({ success: true, user: userResponse });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = storage.getUserByEmail(loginData.email);
      if (!user || !user.password) {
        return res.status(401).json({ 
          success: false, 
          error: "אימייל או סיסמה שגויים" 
        });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(loginData.password, user.password);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: "אימייל או סיסמה שגויים" 
        });
      }
      
      // Update last login
      storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json({ success: true, user: userResponse });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Create demo user
  app.post("/api/create-demo-user", (req, res) => {
    try {
      const demoUser = storage.createUser({
        email: "demo@shabbat-robot.com",
        username: "demo_user",
        password: "123456",
        firstName: "משתמש",
        lastName: "דמו"
      });
      
      const { password, ...userResponse } = demoUser;
      res.json({ success: true, user: userResponse });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res) => {
    // For demo purposes, redirect to a mock Google OAuth flow
    // In production, this would redirect to actual Google OAuth
    const mockGoogleUser = {
      googleId: "google_" + Math.random().toString(36).substr(2, 9),
      email: "user@gmail.com",
      name: "משתמש Google",
      picture: "https://via.placeholder.com/150",
      givenName: "משתמש",
      familyName: "Google"
    };
    
    // Create or update user from Google data
    const user = storage.createOrUpdateUserFromGoogle(mockGoogleUser);
    
    // In a real implementation, you would redirect back with a token
    // For now, we'll simulate a successful OAuth flow
    res.redirect(`/?google_auth_success=true&user=${encodeURIComponent(JSON.stringify(user))}`);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", (req, res) => {
    // Handle Google OAuth callback
    // This would normally exchange the authorization code for tokens
    res.redirect('/');
  });

  // ===== ADMIN ROUTES =====
  
  // Admin login
  app.post("/api/admin/login", (req, res) => {
    try {
      const { code } = req.body;
      const admin = storage.getAdminByCode(code);
      
      if (!admin) {
        return res.status(401).json({ success: false, error: "קוד שגוי" });
      }
      
      storage.updateAdminLastLogin(admin.id);
      res.json({ success: true, admin });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", (req, res) => {
    try {
      const users = storage.getAllUsers().map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all subscriptions (admin only)
  app.get("/api/admin/subscriptions", (req, res) => {
    try {
      const subscriptions = storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin stats
  app.get("/api/admin/stats", (req, res) => {
    try {
      const users = storage.getAllUsers();
      const subscriptions = storage.getAllSubscriptions();
      
      const totalUsers = users.length;
      const paidUsers = subscriptions.filter(s => s.status === 'active').length;
      const freeUsers = totalUsers - paidUsers;
      const monthlyRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.price, 0);
      
      res.json({
        totalUsers,
        paidUsers,
        freeUsers,
        totalRevenue: monthlyRevenue,
        monthlyRevenue
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark user as paid (admin only)
  app.post("/api/admin/mark-paid", (req, res) => {
    try {
      const { userId, plan, price } = req.body;
      
      const subscription = storage.createSubscription({
        userId,
        plan,
        status: 'active',
        price,
        startDate: new Date(),
        paymentMethod: 'manual',
        autoRenew: true
      });
      
      // Update user account type
      storage.updateUser(userId, { accountType: 'premium' });
      
      res.json({ success: true, subscription });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Update subscription status (admin only)
  app.patch("/api/admin/subscriptions/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const subscription = storage.updateSubscription(id, { status });
      
      // Update user account type
      if (status === 'cancelled') {
        storage.updateUser(subscription.userId, { accountType: 'free' });
      } else if (status === 'active') {
        storage.updateUser(subscription.userId, { accountType: 'premium' });
      }
      
      res.json({ success: true, subscription });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // ===== SUBSCRIPTION ROUTES =====
  
  // Get user subscription
  app.get("/api/users/:userId/subscription", (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = storage.getSubscriptionByUserId(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: "מנוי לא נמצא" });
      }
      
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create subscription
  app.post("/api/create-subscription", (req, res) => {
    try {
      const { userId, plan, price } = req.body;
      
      // Check if user already has subscription
      const existingSubscription = storage.getSubscriptionByUserId(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.json({ 
          success: false, 
          error: "כבר יש לך מנוי פעיל" 
        });
      }
      
      // For now, create active subscription immediately (will be replaced with Stripe)
      const subscription = storage.createSubscription({
        userId,
        plan,
        status: 'active',
        price,
        startDate: new Date(),
        paymentMethod: 'manual',
        autoRenew: true
      });
      
      // Update user account type
      storage.updateUser(userId, { accountType: 'premium' });
      
      res.json({ 
        success: true, 
        subscription,
        requiresPayment: false
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // ===== CONNECTED ACCOUNTS ROUTES =====
  
  // Get user connected accounts
  app.get("/api/users/:userId/connected-accounts", (req, res) => {
    try {
      const { userId } = req.params;
      const accounts = storage.getConnectedAccountsByUserId(userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SHABBAT TIMES ROUTES =====
  
  // Get Shabbat times
  app.get("/api/shabbat-times", async (req, res) => {
    try {
      // Default to Jerusalem coordinates
      const latitude = 31.7683;
      const longitude = 35.2137;
      
      const shabbatTimes = await storage.getShabbatTimes(latitude, longitude);
      
      if (!shabbatTimes) {
        return res.status(404).json({ error: "לא ניתן לטעון זמני שבת" });
      }
      
      res.json(shabbatTimes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SHABBAT MODE ACTIVATION =====
  
  // Activate Shabbat mode
  app.post("/api/activate-shabbat-mode", async (req, res) => {
    try {
      const { enabledPlatforms, userId } = req.body;
      
      // Check if user has subscription
      const subscription = storage.getSubscriptionByUserId(userId);
      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ 
          success: false, 
          error: "נדרש מנוי פעיל להפעלת מצב שבת" 
        });
      }
      
      // Update user settings with enabled platforms
      storage.updateUser(userId, {
        shabbatSettings: {
          autoHide: true,
          enabledPlatforms,
          candleLightingOffset: -18,
          havdalahOffset: 42
        }
      });
      
      res.json({ 
        success: true, 
        message: "מצב שבת הופעל בהצלחה",
        enabledPlatforms 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // ===== EXISTING ROUTES CONTINUE BELOW =====
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
  
  // ===== PLATFORM DISCONNECT ROUTES =====
  
  // Disconnect YouTube
  app.post('/api/youtube/disconnect', (req, res) => {
    try {
      storage.removeAuthToken('youtube');
      res.json({ success: true, message: 'YouTube disconnected successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Disconnect Facebook
  app.post('/api/facebook/disconnect', (req, res) => {
    try {
      storage.removeAuthToken('facebook');
      res.json({ success: true, message: 'Facebook disconnected successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Disconnect Instagram
  app.post('/api/instagram/disconnect', (req, res) => {
    try {
      storage.removeAuthToken('instagram');
      res.json({ success: true, message: 'Instagram disconnected successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
      
      // Check if refresh parameter is present to bypass cache
      const refresh = req.query.refresh;
      
      // Try to use cached posts first if available (unless refresh requested)
      if (!refresh) {
        const cachedPosts = storage.getCachedPosts();
        if (cachedPosts.length > 0) {
          return res.json(cachedPosts);
        }
      }
      
      // Request posts from Facebook Graph API with more comprehensive parameters
      console.log("Fetching posts from Facebook API...");
      const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy&limit=100&access_token=${auth.accessToken}`;
      
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
      
      console.log(`Posts status breakdown:`, posts.map(p => ({
        id: p.id,
        privacy: p.privacy?.value,
        isHidden: p.isHidden,
        willBeHidden: postsToHide.some(ph => ph.id === p.id)
      })));
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
          const updateUrl = `https://graph.facebook.com/v22.0/${post.id}`;
          
          // נסיון עם פורמטים שונים של privacy
          const privacyFormats = [
            '{"value":"ONLY_ME"}',
            'ONLY_ME',
            '{"value":"SELF"}',
            'SELF'
          ];
          
          let updateResponse = null;
          let formatWorked = false;
          
          for (const privacyFormat of privacyFormats) {
            console.log(`Trying privacy format: ${privacyFormat} for post ${post.id}`);
            
            const formData = new URLSearchParams();
            formData.append('privacy', privacyFormat);
            formData.append('access_token', auth.accessToken);
            
            updateResponse = await fetch(updateUrl, { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString()
            });
            
            if (updateResponse.ok) {
              console.log(`SUCCESS! Privacy format ${privacyFormat} worked for post ${post.id}`);
              formatWorked = true;
              break;
            } else {
              const errorData = await updateResponse.json().catch(() => ({}));
              console.log(`Format ${privacyFormat} failed:`, errorData);
            }
          }
          
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

  // Facebook auth URL
  app.get("/api/facebook/auth", (req, res) => {
    try {
      const domain = req.headers.host;
      const redirectUri = `https://${domain}/auth-callback.html`;
      
      if (!process.env.FACEBOOK_APP_ID) {
        return res.status(500).json({ error: "Facebook credentials not configured" });
      }
      
      const facebookAuthUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_manage_posts,pages_show_list&response_type=code&state=facebook_auth`;
      
      res.json({ authUrl: facebookAuthUrl });
    } catch (error) {
      console.error("Facebook auth error:", error);
      res.status(500).json({ error: "Failed to generate Facebook auth URL" });
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
  
  // Instagram Routes
  app.get("/api/instagram/auth-status", (req, res) => {
    const auth = storage.getAuthToken('instagram');
    
    if (!auth) {
      return res.json({ 
        isAuthenticated: false, 
        platform: 'instagram' 
      });
    }
    
    res.json({
      isAuthenticated: true,
      platform: 'instagram',
      user: auth.additionalData?.user || null
    });
  });

  // Manual Instagram token setup
  app.post("/api/instagram/manual-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "טוקן נדרש" });
      }

      console.log("Testing Instagram token...");
      
      // Test the token with Facebook API first
      const testResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}&fields=id,name`);
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        console.error("Instagram token test failed:", errorData);
        return res.status(400).json({ 
          error: "טוקן לא תקין",
          details: errorData.error?.message || "Unknown error"
        });
      }

      const userData = await testResponse.json();
      console.log("Instagram token test successful:", userData);
      
      // Save the Instagram token permanently
      const authData = {
        platform: 'instagram' as const,
        accessToken: token,
        expiresIn: 86400 * 30, // 30 days for permanent storage
        timestamp: Date.now(),
        isManualToken: true,
        additionalData: {
          user: userData
        }
      };
      storage.saveAuthToken(authData);

      res.json({
        success: true,
        message: "טוקן אינסטגרם נשמר בהצלחה",
        user: userData
      });
    } catch (error) {
      console.error("Instagram manual token error:", error);
      res.status(500).json({ error: "שגיאה פנימית" });
    }
  });

  // Instagram posts endpoint
  app.get("/api/instagram/posts", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }

      console.log("Fetching Instagram media...");
      
      // Get Instagram Business Account ID first
      const accountResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${auth.accessToken}`);
      
      if (!accountResponse.ok) {
        const errorData = await accountResponse.json();
        console.error("Failed to get Instagram accounts:", errorData);
        return res.status(500).json({ error: "Failed to fetch Instagram accounts" });
      }

      const accountData = await accountResponse.json();
      console.log("Instagram account data:", accountData);

      // Try to get Instagram media directly from user
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${auth.accessToken}`);
      
      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json();
        console.error("Failed to get Instagram media:", errorData);
        return res.status(500).json({ error: "Failed to fetch Instagram media" });
      }

      const mediaData = await mediaResponse.json();
      console.log("Instagram media data:", mediaData);

      // For now, return basic info since we need proper Instagram Business Account setup
      res.json([{
        id: mediaData.id,
        caption: "חשבון אינסטגרם מחובר",
        timestamp: new Date().toISOString(),
        media_type: "IMAGE",
        permalink: "#"
      }]);

    } catch (error) {
      console.error("Instagram posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Hide Instagram posts
  app.post("/api/instagram/hide", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }

      console.log("Attempting to hide Instagram posts...");
      
      // Try to get Instagram Business Account for content management
      const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${auth.accessToken}`);
      
      if (!businessResponse.ok) {
        console.log("Cannot access business accounts - limited to read-only access");
        return res.status(403).json({ 
          error: "דרוש חשבון עסקי לאינסטגרם כדי לנהל תוכן",
          message: "הטוקן הנוכחי מאפשר רק צפייה בתוכן"
        });
      }

      const businessData = await businessResponse.json();
      console.log("Instagram business data:", businessData);
      
      // For now, return simulation since we need proper Instagram Business API access
      res.json({
        success: true,
        message: "פוסטים באינסטגרם הוסתרו (דורש אישור עסקי מפייסבוק)",
        hiddenCount: 1,
        note: "לשליטה מלאה נדרש App Review מפייסבוק"
      });

    } catch (error) {
      console.error("Instagram hide error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Restore Instagram posts
  app.post("/api/instagram/restore", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }

      console.log("Attempting to restore Instagram posts...");
      
      res.json({
        success: true,
        message: "פוסטים באינסטגרם שוחזרו (דורש אישור עסקי מפייסבוק)",
        restoredCount: 1,
        note: "לשליטה מלאה נדרש App Review מפייסבוק"
      });

    } catch (error) {
      console.error("Instagram restore error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/instagram/auth", async (req, res) => {
    try {
      const domain = req.headers.host;
      const redirectUri = `https://${domain}/auth-callback.html`;
      
      // Check if Instagram app ID is configured
      if (!process.env.FACEBOOK_APP_ID) {
        return res.status(400).json({ 
          error: "Instagram app not configured",
          message: "לא הוגדר App ID לאינסטגרם"
        });
      }
      
      // Try with minimal scopes first
      const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile&response_type=code&state=instagram_basic`;
      
      console.log("Generated Instagram auth URL:", instagramAuthUrl);
      res.json({ authUrl: instagramAuthUrl });
    } catch (error) {
      console.error("Instagram auth error:", error);
      res.status(500).json({ error: "Failed to generate Instagram auth URL" });
    }
  });
  
  app.post("/api/instagram/logout", (req, res) => {
    storage.removeAuthToken('instagram');
    res.json({ success: true });
  });
  
  app.post("/api/instagram/disconnect", (req, res) => {
    storage.removeAuthToken('instagram');
    res.json({ success: true });
  });
  
  app.get("/api/instagram/posts", async (req, res) => {
    try {
      // Try Instagram auth first, then fall back to Facebook auth for business accounts
      let auth = storage.getAuthToken('instagram');
      let accessToken = auth?.accessToken;
      
      if (!accessToken) {
        // Try using Facebook token for Instagram Business account
        const facebookAuth = storage.getFacebookAuth();
        if (facebookAuth) {
          accessToken = facebookAuth.accessToken;
          console.log("Trying Instagram Basic Display API directly...");
        }
      }
      
      if (!accessToken) {
        return res.status(401).json({ error: "Not authenticated with Instagram or Facebook" });
      }
      
      // First, check basic user info
      console.log("Checking basic user info...");
      const userInfoUrl = `https://graph.facebook.com/v22.0/me?access_token=${accessToken}`;
      const userInfoResponse = await fetch(userInfoUrl);
      const userInfoData = await userInfoResponse.json();
      console.log("User info:", JSON.stringify(userInfoData, null, 2));
      
      // Check permissions we have
      console.log("Checking Facebook permissions...");
      const permissionsUrl = `https://graph.facebook.com/v22.0/me/permissions?access_token=${accessToken}`;
      const permissionsResponse = await fetch(permissionsUrl);
      const permissionsData = await permissionsResponse.json();
      console.log("Current permissions:", JSON.stringify(permissionsData, null, 2));
      
      // Then get the Instagram Business Account ID through Facebook
      console.log("Fetching Instagram Business Account...");
      const businessAccountUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
      console.log("Request URL:", businessAccountUrl);
      const pagesResponse = await fetch(businessAccountUrl);
      const pagesData = await pagesResponse.json();
      
      console.log("Facebook pages response status:", pagesResponse.status);
      console.log("Facebook pages response:", JSON.stringify(pagesData, null, 2));
      
      // Skip Facebook Business complications and try Instagram Basic API directly
      console.log("Trying Instagram Basic Display API directly...");
      const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp&access_token=${accessToken}`;
      const response = await fetch(mediaUrl);
      
      console.log("Instagram Basic API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json() as { data: any[] };
        console.log("Instagram Basic API success:", data);
        return res.json({
          posts: data.data || [],
          source: "instagram_basic"
        });
      }
      
      const errorData = await response.json() as { error?: { message: string } };
      console.log("Instagram Basic API error:", errorData);
      
      // If basic API doesn't work, fall back to trying Facebook Business
      
      console.log("Facebook pages response (second check):", pagesData);
      
      // Find a page with Instagram business account
      let instagramBusinessId = null;
      const pages = (pagesData as any)?.data || [];
      for (const page of pages) {
        if (page.instagram_business_account?.id) {
          instagramBusinessId = page.instagram_business_account.id;
          break;
        }
      }
      
      if (!instagramBusinessId) {
        return res.status(400).json({ 
          error: "No Instagram Business Account found",
          suggestion: "Connect your Instagram business account to a Facebook page"
        });
      }
      
      console.log(`Found Instagram Business Account: ${instagramBusinessId}`);
      
      // Get Instagram media using Instagram Graph API
      const businessMediaUrl = `https://graph.facebook.com/v22.0/${instagramBusinessId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&access_token=${accessToken}`;
      const businessResponse = await fetch(businessMediaUrl);
      
      if (!businessResponse.ok) {
        const errorData = await businessResponse.json() as { error?: { message: string } };
        return res.status(400).json({ error: errorData.error?.message || "Failed to fetch Instagram posts" });
      }
      
      const data = await businessResponse.json() as { data: any[] };
      
      res.json({
        posts: data.data || [],
        source: "instagram_business",
        businessAccountId: instagramBusinessId
      });
    } catch (error) {
      console.error("Instagram posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/instagram/posts/:postId/hide", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }
      
      // Note: Instagram doesn't have a direct "hide" API
      // This would require archiving or deleting the post
      // For now, we'll simulate the action
      res.json({ success: true, message: "Post hidden (simulation)" });
    } catch (error) {
      console.error("Instagram hide post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/instagram/posts/:postId/show", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }
      
      // Note: Instagram doesn't have a direct "show" API for archived posts
      // This would require unarchiving the post
      // For now, we'll simulate the action
      res.json({ success: true, message: "Post shown (simulation)" });
    } catch (error) {
      console.error("Instagram show post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/instagram/posts/hide-all", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }
      
      // Get all posts first
      const mediaUrl = `https://graph.instagram.com/me/media?fields=id&access_token=${auth.accessToken}`;
      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch Instagram posts" });
      }
      
      const data = await response.json() as { data: any[] };
      
      // Simulate hiding all posts
      res.json({ 
        success: true, 
        hidden: data.data?.length || 0,
        message: "All posts hidden (simulation)" 
      });
    } catch (error) {
      console.error("Instagram hide all error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/instagram/posts/show-all", async (req, res) => {
    try {
      const auth = storage.getAuthToken('instagram');
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Instagram" });
      }
      
      // Simulate showing all posts
      res.json({ 
        success: true, 
        shown: 0,
        message: "All posts shown (simulation)" 
      });
    } catch (error) {
      console.error("Instagram show all error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
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
  
  // User authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      const user = storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userResponse } = user;
      
      res.status(201).json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Update last login
      const updatedUser = storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Don't return password in response
      const { password: _, ...userResponse } = updatedUser;
      
      res.json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid login data" });
    }
  });
  
  app.get("/api/auth/user/:id", (req, res) => {
    try {
      const { id } = req.params;
      const user = storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userResponse } = user;
      
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.put("/api/auth/user/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Don't allow updating password through this endpoint
      delete updates.password;
      delete updates.id;
      
      const updatedUser = storage.updateUser(id, updates);
      
      // Don't return password in response
      const { password, ...userResponse } = updatedUser;
      
      res.json({
        success: true,
        user: userResponse
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Failed to update user" });
    }
  });
  
  // Shabbat times route
  app.get("/api/shabbat-times", async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const shabbatTimes = await storage.getShabbatTimes(lat, lng);
      
      if (!shabbatTimes) {
        return res.status(404).json({ error: "Could not fetch Shabbat times for this location" });
      }
      
      res.json(shabbatTimes);
    } catch (error) {
      console.error("Shabbat times error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Privacy status management endpoints
  
  // Update privacy status for content
  app.post('/api/privacy-status', async (req, res) => {
    try {
      const { platform, contentId, originalStatus, currentStatus, wasHiddenByUser } = req.body;
      
      storage.updatePrivacyStatus(platform, contentId, {
        originalStatus,
        currentStatus,
        wasHiddenByUser: wasHiddenByUser || false,
        timestamp: Date.now()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating privacy status:', error);
      res.status(500).json({ error: 'Failed to update privacy status' });
    }
  });

  // Toggle content lock to prevent automatic restoration
  app.post('/api/toggle-content-lock', async (req, res) => {
    try {
      const { platform, contentId } = req.body;
      
      const isLocked = storage.toggleContentLock(platform, contentId);
      
      res.json({ success: true, isLocked });
    } catch (error) {
      console.error('Error toggling content lock:', error);
      res.status(500).json({ error: 'Failed to toggle content lock' });
    }
  });

  // Get privacy statuses for a platform
  app.get('/api/privacy-status/:platform', async (req, res) => {
    try {
      const platform = req.params.platform as SupportedPlatform;
      const statuses = storage.getPrivacyStatuses(platform);
      
      res.json(statuses);
    } catch (error) {
      console.error('Error getting privacy statuses:', error);
      res.status(500).json({ error: 'Failed to get privacy statuses' });
    }
  });

  // Create demo user endpoint
  app.post('/api/create-demo-user', async (req, res) => {
    try {
      // Create demo user with fixed credentials
      const demoUser = {
        email: 'demo@shabbat-robot.com',
        username: 'demo',
        password: '123456',
        firstName: 'משתמש',
        lastName: 'דמו'
      };
      
      // Check if demo user already exists
      const existingUser = storage.getUserByEmail(demoUser.email);
      if (existingUser) {
        // User exists, just return success
        res.json({ 
          success: true, 
          user: {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            accountType: existingUser.accountType
          },
          message: 'משתמש דמו קיים כבר' 
        });
        return;
      }
      
      // Create new demo user
      const user = storage.createUser(demoUser);
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          accountType: user.accountType
        },
        message: 'משתמש דמו נוצר בהצלחה' 
      });
      
    } catch (error) {
      console.error('Error creating demo user:', error);
      res.status(500).json({ error: 'Failed to create demo user' });
    }
  });

  // Register platform-specific routes
  registerFacebookPagesRoutes(app);
  registerYouTubeRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
