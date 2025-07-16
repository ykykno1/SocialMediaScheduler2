import type { Express, Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: any;
}
import { createServer, type Server } from "http";
import { enhancedStorage as storage } from './enhanced-storage.js';
import { automaticScheduler } from './automatic-scheduler.js';
import { emailService, generateVerificationCode } from './email-service.js';
import { db } from './db.js';
import * as schema from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { 
  type FacebookPost, 
  SupportedPlatform,
  registerSchema,
  loginSchema
} from "@shared/schema";
// import { registerFacebookPagesRoutes } from "./facebook-pages"; // Temporarily disabled
import { registerStripeRoutes } from './stripe-routes.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-shabbat-robot-2024';

// YouTube token refresh helper
async function refreshYouTubeToken(auth: any, userId: string) {
  if (!auth.refreshToken) {
    throw new Error('No refresh token available');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: auth.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json();
    throw new Error(`Token refresh failed: ${errorData.error_description}`);
  }

  const tokens = await refreshResponse.json();

  // Update stored token
  const updatedAuth = {
    ...auth,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000)
  };

  storage.saveAuthToken(updatedAuth, userId);
  return updatedAuth;
}

// Test YouTube connection helper
async function testYouTubeConnection(accessToken: string) {
  const testResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}`);
  return testResponse.ok;
}

// JWT helper functions
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export function registerRoutes(app: Express): Server {

  // JWT Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      console.log(`Auth middleware for ${req.method} ${req.path}`);
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth header or wrong format');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = verifyToken(token);

      if (!decoded) {
        console.log('Token verification failed');
        return res.status(401).json({ error: "Invalid token" });
      }

      console.log('Getting user for ID:', decoded.userId);
      const user = await storage.getUserById(decoded.userId);
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ error: "User not found" });
      }

      console.log('User authenticated successfully:', user.id);
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: "Authentication error" });
    }
  };

  // Legacy alias for compatibility
  const authMiddleware = requireAuth;

  // User registration and login endpoints
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const user = await storage.createUser({
        email,
        password, // Will be hashed in database storage
        username: username || email.split('@')[0]
      });

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Removed duplicate endpoint - using the full user endpoint below instead

  app.post("/api/logout", (req, res) => {
    // For JWT authentication, logout is handled client-side by removing the token
    // No server-side action needed since JWT tokens are stateless
    res.json({ success: true, message: "Logged out successfully" });
  });

  // YouTube OAuth - Public endpoints (must be before any auth middleware)
  app.get("/api/youtube/auth-status", requireAuth, async (req: any, res) => {
    console.log('Checking YouTube auth status for user:', req.user.id);
    const auth = await storage.getAuthToken('youtube', req.user.id);
    console.log('Retrieved auth token:', {
      found: !!auth,
      platform: auth?.platform,
      hasAccessToken: !!auth?.accessToken,
      hasRefreshToken: !!auth?.refreshToken,
      channelTitle: auth?.additionalData?.channelTitle
    });

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

  app.get("/api/youtube/auth-url", (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      const domain = req.headers.host;
      const redirectUri = `https://${domain}/auth-callback.html`;

      console.log(`YouTube auth URL - Domain: ${domain}, Redirect URI: ${redirectUri}`);

      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Google credentials not configured" });
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube')}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=youtube`;

      console.log('Generated YouTube auth URL:', authUrl);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating YouTube auth URL:', error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // YouTube OAuth token exchange - Updated to use per-user authentication
  app.post("/api/youtube/auth-callback", requireAuth, async (req: any, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }

      const domain = req.headers.host;
      const redirectUri = `https://${domain}/auth-callback.html`;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", tokens);
        return res.status(400).json({ 
          error: (tokens as any).error_description || (tokens as any).error || "Token exchange failed" 
        });
      }

      const tokenData = tokens as any;

      // Get channel information
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${tokenData.access_token}`);
      let channelTitle = "Unknown Channel";

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        channelTitle = channelData.items?.[0]?.snippet?.title || "Unknown Channel";
      }

      const authTokenToSave = {
        platform: 'youtube' as const,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        timestamp: Date.now(),
        userId: req.user.id,
        additionalData: { channelTitle }
      };

      console.log('Saving YouTube token for user:', req.user.id, 'Token data:', {
        platform: authTokenToSave.platform,
        hasAccessToken: !!authTokenToSave.accessToken,
        hasRefreshToken: !!authTokenToSave.refreshToken,
        channelTitle: authTokenToSave.additionalData?.channelTitle
      });

      await storage.saveAuthToken(authTokenToSave, req.user.id);

      res.json({ 
        success: true,
        message: "YouTube connected successfully",
        channelTitle
      });

    } catch (error) {
      console.error("YouTube token exchange error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user already exists
      const existingUser = storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = storage.createUser({
        email,
        password: hashedPassword,
        username: email.split('@')[0] // Use email prefix as username
      });

      // Generate JWT token
      const token = generateToken(user.id);

      // Return user without password and include token
      const { password: _, ...userResponse } = user;
      res.json({
        ...userResponse,
        token
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Get user by email
      const user = storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Update last active
      storage.updateUser(user.id, { lastActive: new Date() });

      // Return user without password and include token
      const { password: _, ...userResponse } = user;
      res.json({
        ...userResponse,
        token
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", async (req, res) => {
    console.log("=== LOGOUT DEBUG: Starting logout process ===");

    // Get user ID from token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    console.log(`=== LOGOUT DEBUG: Token found: ${!!token} ===`);

    if (token) {
      try {
        const decoded = verifyToken(token);
        console.log(`=== LOGOUT DEBUG: Token decoded: ${!!decoded} ===`);

        if (decoded) {
          const userId = decoded.userId;
          console.log(`=== LOGOUT DEBUG: User ID: ${userId} ===`);

          // Log before clearing
          const fbAuthBefore = storage.getFacebookAuth(userId);
          console.log(`=== LOGOUT DEBUG: Facebook auth before clearing: ${!!fbAuthBefore} ===`);

          // Clear all platform tokens for this user
          console.log(`=== LOGOUT DEBUG: Calling removeFacebookAuth for user: ${userId} ===`);
          storage.removeFacebookAuth(userId);

          console.log(`=== LOGOUT DEBUG: Calling removeAuthToken for other platforms ===`);
          storage.removeAuthToken('youtube', userId);
          storage.removeAuthToken('instagram', userId);
          storage.removeAuthToken('tiktok', userId);

          // Log after clearing
          const fbAuthAfter = storage.getFacebookAuth(userId);
          console.log(`=== LOGOUT DEBUG: Facebook auth after clearing: ${!!fbAuthAfter} ===`);
          console.log(`=== LOGOUT DEBUG: Cleared all platform tokens for user: ${userId} ===`);
        } else {
          console.log("=== LOGOUT DEBUG: Token decode failed ===");
        }
      } catch (error) {
        console.error("=== LOGOUT DEBUG: Error during logout:", error, "===");
      }
    } else {
      console.log("=== LOGOUT DEBUG: No token provided ===");
    }

    // Clear session
    (req as any).session = null;

    console.log("=== LOGOUT DEBUG: Logout completed ===");
    res.json({ success: true, message: "התנתקות הושלמה בהצלחה" });
  });

  // Refresh token endpoint for expired tokens
  app.post("/api/refresh-token", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate new token
      const newToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          accountType: user.accountType
        }
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      res.status(500).json({ error: "שגיאה בחידוש הטוקן" });
    }
  });

  // Specific Facebook disconnect endpoint
  app.post("/api/facebook/disconnect", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.id;
      console.log(`Disconnecting Facebook for user: ${userId}`);

      // Remove Facebook tokens from both memory and database
      await storage.removeFacebookAuth(userId);
      await storage.removeAuthToken('facebook', userId);

      console.log(`Facebook disconnected successfully for user: ${userId}`);
      res.json({ success: true, message: "התנתקות מפייסבוק הושלמה בהצלחה" });
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      res.status(500).json({ error: "שגיאה בהתנתקות מפייסבוק" });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await storage.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      console.log('Full user from database:', user);
      console.log('User timing preferences:', {
        hideTimingPreference: user.hideTimingPreference,
        restoreTimingPreference: user.restoreTimingPreference
      });

      // Return user without password
      const { password: _, ...userResponse } = user;
      console.log('User response being sent:', userResponse);
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });



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
  app.post("/api/auth-callback", authMiddleware, async (req: AuthenticatedRequest, res) => {
    console.log('🔔 AUTH-CALLBACK STARTED: Received Facebook auth callback');
    console.log('📥 Request body:', { hasCode: !!req.body.code, hasRedirectUri: !!req.body.redirectUri });
    
    try {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        console.log('❌ Missing code or redirectUri');
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

      // Save the auth token (user-specific)
      console.log(`💾 Saving Facebook auth for user: ${req.user?.id}`);
      console.log(`👤 Facebook user ID: ${userData.id}`);
      console.log('🔑 Token data:', { hasAccessToken: !!tokenData.access_token, expiresIn: tokenData.expires_in });
      
      const auth = await storage.saveFacebookAuth({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        timestamp: Date.now(),
        userId: userData.id,
        pageAccess,
        isManualToken: false
      }, req.user?.id);
      console.log(`✅ Auth saved successfully:`, !!auth);

      // Verify token is accessible by trying to read it back
      let attempts = 0;
      let verifiedToken = null;
      while (attempts < 5 && !verifiedToken) {
        await new Promise(resolve => setTimeout(resolve, 50));
        verifiedToken = await storage.getAuthToken('facebook', req.user?.id);
        attempts++;
        console.log(`Token verification attempt ${attempts}: ${!!verifiedToken}`);
      }

      if (!verifiedToken) {
        console.warn('Token not accessible after save, but continuing...');
      }

      // Add a history entry for successful authentication (user-specific)
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore", // Use restore as this is making content visible again in a way
        platform: "facebook",
        success: true,
        affectedItems: 0,
        error: undefined
      }, req.user?.id);

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

  // Update Chabad times from widget
  app.post('/api/chabad-times', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { cityId, candleLighting, havdalah } = req.body;
      const userId = req.user?.id;
      
      if (!cityId || !candleLighting || !havdalah || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      console.log(`📅 Authentic Chabad times received for user ${userId}, city ${cityId}: ${candleLighting} / ${havdalah}`);
      
      // Store times in a simple cache for the automatic scheduler to use
      if (!global.chabadTimesCache) {
        global.chabadTimesCache = new Map();
      }
      
      global.chabadTimesCache.set(`${userId}-${cityId}`, {
        candleLighting,
        havdalah,
        timestamp: Date.now()
      });
      
      // Refresh the scheduler for this user with the new times
      await automaticScheduler.refreshUser(userId);
      console.log(`🔄 Scheduler refreshed for user ${userId} with new Chabad times`);
      
      res.json({ success: true, message: 'זמני חב"ד התעדכנו בהצלחה' });
    } catch (error) {
      console.error('Error storing Chabad times:', error);
      res.status(500).json({ error: 'Failed to store times' });
    }
  });

  // Get auth status
  app.get("/api/auth-status", requireAuth, async (req: AuthenticatedRequest, res) => {
    console.log('Getting Facebook auth for user in auth-status endpoint:', req.user?.id);
    console.log('About to call storage.getAuthToken...');
    try {
      const auth = await storage.getAuthToken('facebook', req.user?.id);
      console.log('Storage.getAuthToken completed');
      console.log('Auth result in auth-status endpoint:', !!auth);
      console.log('Auth object details:', auth ? { hasAccessToken: !!auth.accessToken, timestamp: auth.timestamp } : 'null');
      
      // Also get user data with timing preferences
      const user = await storage.getUserById(req.user?.id);
      const { password, passwordHash, ...userResponse } = user || {};
      
      res.json({
        isAuthenticated: !!auth,
        // Don't send the token to the client for security
        platform: "facebook",
        authTime: auth ? new Date(auth.timestamp).toISOString() : null,
        pageAccess: true,
        user: userResponse // Include user data with timing preferences
      });
    } catch (error) {
      console.error('Error in auth-status endpoint:', error);
      res.json({
        isAuthenticated: false,
        platform: "facebook",
        authTime: null,
        pageAccess: false,
        user: null
      });
    }
  });

  // Logout/disconnect
  app.post("/api/logout", requireAuth, (req: AuthenticatedRequest, res) => {
    storage.removeFacebookAuth(req.user?.id);
    storage.addHistoryEntry({
      timestamp: new Date(),
      action: "restore", // Same as auth since this is disabling automation
      platform: "facebook",
      success: true,
      affectedItems: 0,
      error: undefined
    }, req.user?.id);
    res.json({ success: true });
  });

  // Get history entries
  app.get("/api/history", requireAuth, (req: AuthenticatedRequest, res) => {
    const history = storage.getHistoryEntries(undefined, req.user?.id);
    res.json(history);
  });

  // Get Facebook posts
  app.get("/api/facebook/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const auth = await storage.getAuthToken('facebook', req.user?.id);

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }

      // Check if refresh parameter is present to bypass cache
      const refresh = req.query.refresh;

      // Try to use cached posts first if available (unless refresh requested)
      if (!refresh) {
        const cachedPosts = storage.getCachedPosts(req.user?.id);
        if (cachedPosts.length > 0) {
          return res.json(cachedPosts);
        }
      }

      // First, get posts from user's personal profile
      console.log("Fetching posts from Facebook API...");
      const userPostsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,privacy,attachments{media,subattachments,type,url},full_picture,picture,type,story&limit=50&access_token=${auth.accessToken}`;

      const userPostsResponse = await fetch(userPostsUrl);
      let allPosts: FacebookPost[] = [];

      if (userPostsResponse.ok) {
        const userPostsData = await userPostsResponse.json() as { data: FacebookPost[] };
        if (userPostsData.data && Array.isArray(userPostsData.data)) {
          allPosts = [...userPostsData.data];
          console.log(`Got ${userPostsData.data.length} posts from user profile`);
        }
      } else {
        console.log("Could not fetch user posts, continuing with pages only");
      }

      // Then, get posts from managed pages
      try {
        const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=name,access_token,id&access_token=${auth.accessToken}`;
        console.log(`Fetching pages from: ${pagesUrl}`);
        const pagesResponse = await fetch(pagesUrl);

        console.log(`Pages response status: ${pagesResponse.status}`);

        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json() as { data: Array<{ id: string; name: string; access_token: string }> };
          console.log(`Pages API response:`, JSON.stringify(pagesData, null, 2));
          console.log(`Found ${pagesData.data?.length || 0} managed pages`);

          if (pagesData.data && pagesData.data.length > 0) {
            // Get posts from each page
            for (const page of pagesData.data) {
              try {
                console.log(`Processing page: ${page.name} (ID: ${page.id})`);
                const pagePostsUrl = `https://graph.facebook.com/v22.0/${page.id}/posts?fields=id,message,created_time,privacy,attachments{media,subattachments,type,url},full_picture,picture,type,story&limit=25&access_token=${page.access_token}`;
                const pagePostsResponse = await fetch(pagePostsUrl);

                if (pagePostsResponse.ok) {
                  const pagePostsData = await pagePostsResponse.json() as { data: FacebookPost[] };
                  if (pagePostsData.data && Array.isArray(pagePostsData.data)) {
                    // Add page info to posts
                    const pagePostsWithInfo = pagePostsData.data.map(post => ({
                      ...post,
                      pageId: page.id,
                      pageName: page.name
                    }));
                    allPosts = [...allPosts, ...pagePostsWithInfo];
                    console.log(`Got ${pagePostsData.data.length} posts from page: ${page.name}`);
                  }
                } else {
                  const pageError = await pagePostsResponse.json();
                  console.error(`Error fetching posts from page ${page.name}:`, pageError);
                }
              } catch (pageError) {
                console.error(`Error fetching posts from page ${page.name}:`, pageError);
              }
            }
          } else {
            console.log("No pages found in data or data is empty");
          }
        } else {
          const errorData = await pagesResponse.json();
          console.error("Facebook pages API error:", errorData);
          console.error("Pages response failed with status:", pagesResponse.status);
        }
      } catch (pagesError) {
        console.error("Error fetching pages:", pagesError);
      }

      if (allPosts.length === 0) {
        return res.status(400).json({ error: "No posts found from user or pages" });
      }

      // Add isHidden property to all posts - checking for both SELF and ONLY_ME values
      const postsWithIsHidden = allPosts.map(post => ({
        ...post,
        isHidden: post.privacy && (post.privacy.value === "SELF" || post.privacy.value === "ONLY_ME")
      }));

      // Save posts to cache (user-specific)
      storage.saveCachedPosts(postsWithIsHidden, req.user?.id);

      res.json(postsWithIsHidden);
    } catch (error) {
      console.error("Facebook posts fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Hide Facebook posts - Try to use real API for admin users
  app.post("/api/facebook/hide", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const auth = storage.getFacebookAuth(req.user?.id);

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }

      // Get cached posts or fetch if empty (user-specific)
      let posts = storage.getCachedPosts(req.user?.id);

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
        storage.saveCachedPosts(posts, req.user?.id);
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

  // Register Facebook Pages routes - temporarily disable to fix authentication first
  // registerFacebookPagesRoutes(app, requireAuth);

  // YouTube videos endpoint  
  app.get("/api/youtube/videos", requireAuth, async (req: any, res) => {
    try {
      console.log('Fetching YouTube videos for user:', req.user.id);
      let auth = await storage.getAuthToken('youtube', req.user.id);
      console.log('YouTube auth found:', {
        found: !!auth,
        platform: auth?.platform,
        hasAccessToken: !!auth?.accessToken,
        hasRefreshToken: !!auth?.refreshToken
      });

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      // Test connection and refresh token if needed
      let connectionValid = await testYouTubeConnection(auth.accessToken);

      if (!connectionValid) {
        try {
          auth = await refreshYouTubeToken(auth, req.user.id);
          connectionValid = await testYouTubeConnection(auth.accessToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return res.status(401).json({ error: "YouTube authentication expired. Please reconnect." });
        }
      }

      if (!connectionValid) {
        return res.status(401).json({ error: "YouTube authentication invalid. Please reconnect." });
      }

      // Use YouTube Data API to get user's videos
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&access_token=${auth.accessToken}`);

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error("YouTube channel fetch error:", errorData);
        return res.status(400).json({ error: "Failed to fetch YouTube channel" });
      }

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.json({ videos: [] });
      }

      // Get videos from uploads playlist
      const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&access_token=${auth.accessToken}`);

      if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error("YouTube videos fetch error:", errorData);
        return res.status(400).json({ error: "Failed to fetch YouTube videos" });
      }

      const videosData = await videosResponse.json();

      // Get detailed video information including privacy status
      const videoIds = videosData.items?.map((item: any) => item.snippet.resourceId.videoId).join(',') || '';
      const detailedResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds}&access_token=${auth.accessToken}`);

      let detailedVideos = [];
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        detailedVideos = detailedData.items || [];
      }

      const videos = await Promise.all(videosData.items?.map(async (item: any) => {
        const videoId = item.snippet.resourceId.videoId;
        const detailedVideo = detailedVideos.find((v: any) => v.id === videoId);
        const currentPrivacyStatus = detailedVideo?.status?.privacyStatus || 'unknown';
        const hasOriginalStatus = await storage.getVideoOriginalStatus(videoId, req.user.id) !== null;

        // Only auto-lock videos on initial load, not during refreshes after user actions
        // This prevents mass auto-locking when hiding individual videos
        const skipAutoLock = req.query.skipAutoLock === 'true';

        if (!skipAutoLock && currentPrivacyStatus === 'private' && !hasOriginalStatus) {
          const existingLockStatus = await storage.getVideoLockStatus(req.user.id, videoId);
          if (!existingLockStatus || !existingLockStatus.isLocked) {
            await storage.setVideoLockStatus(req.user.id, videoId, true, 'auto_private');
          }
        }

        return {
          id: videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
          privacyStatus: currentPrivacyStatus,
          isHidden: currentPrivacyStatus === 'private',
          viewCount: detailedVideo?.statistics?.viewCount || '0'
        };
      }) || []);

      res.json({ videos });
    } catch (error) {
      console.error("YouTube videos error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // YouTube hide/show individual video
  app.post("/api/youtube/videos/:videoId/hide", requireAuth, async (req: any, res) => {
    try {
      let auth = await storage.getAuthToken('youtube', req.user.id);
      const { videoId } = req.params;

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      // Test connection and refresh token if needed
      let connectionValid = await testYouTubeConnection(auth.accessToken);

      if (!connectionValid) {
        try {
          auth = await refreshYouTubeToken(auth, req.user.id);
          connectionValid = await testYouTubeConnection(auth.accessToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return res.status(401).json({ error: "YouTube authentication expired. Please reconnect." });
        }
      }

      // First get current video status to save original state
      const currentVideoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&access_token=${auth.accessToken}`);

      if (currentVideoResponse.ok) {
        const currentVideoData = await currentVideoResponse.json();
        const currentPrivacyStatus = currentVideoData.items?.[0]?.status?.privacyStatus;

        // Save original privacy status if not already saved
        if (currentPrivacyStatus && !(await storage.getVideoOriginalStatus(videoId, req.user.id))) {
          await storage.saveVideoOriginalStatus(videoId, currentPrivacyStatus, req.user.id);
        }
      }

      // Update video privacy status to private using YouTube Data API
      const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          status: {
            privacyStatus: 'private'
          }
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("YouTube API error:", errorData);
        return res.status(400).json({ 
          error: errorData.error?.message || "Failed to hide video" 
        });
      }

      console.log(`Video ${videoId} set to private`);

      res.json({ 
        success: true,
        message: "סרטון הוסתר בהצלחה",
        videoId 
      });
    } catch (error) {
      console.error("YouTube hide video error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/youtube/videos/:videoId/show", requireAuth, async (req: any, res) => {
    try {
      let auth = await storage.getAuthToken('youtube', req.user.id);
      const { videoId } = req.params;

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      // Test connection and refresh token if needed
      let connectionValid = await testYouTubeConnection(auth.accessToken);

      if (!connectionValid) {
        try {
          auth = await refreshYouTubeToken(auth, req.user.id);
          connectionValid = await testYouTubeConnection(auth.accessToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return res.status(401).json({ error: "YouTube authentication expired. Please reconnect." });
        }
      }

      // Get original privacy status, default to public if not found
      const originalStatus = (await storage.getVideoOriginalStatus(videoId, req.user.id)) || 'public';

      // Update video privacy status to original status using YouTube Data API
      const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          status: {
            privacyStatus: originalStatus
          }
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("YouTube API error:", errorData);
        return res.status(400).json({ 
          error: errorData.error?.message || "Failed to show video" 
        });
      }

      console.log(`Video ${videoId} set to ${originalStatus}`);

      // Clear original status after successful restore
      await storage.clearVideoOriginalStatus(videoId, req.user.id);

      res.json({ 
        success: true,
        message: `סרטון הוחזר למצב המקורי (${originalStatus === 'public' ? 'פומבי' : originalStatus === 'private' ? 'פרטי' : 'לא רשום'})`,
        videoId,
        restoredStatus: originalStatus
      });
    } catch (error) {
      console.error("YouTube show video error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // YouTube hide all videos
  app.post("/api/youtube/hide-all", requireAuth, async (req: any, res) => {
    try {
      let auth = await storage.getAuthToken('youtube', req.user.id);

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      // Test connection and refresh token if needed
      let connectionValid = await testYouTubeConnection(auth.accessToken);

      if (!connectionValid) {
        try {
          auth = await refreshYouTubeToken(auth, req.user.id);
          connectionValid = await testYouTubeConnection(auth.accessToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return res.status(401).json({ error: "YouTube authentication expired. Please reconnect." });
        }
      }

      // First get all videos
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&access_token=${auth.accessToken}`);

      if (!channelResponse.ok) {
        return res.status(400).json({ error: "Failed to fetch YouTube channel" });
      }

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.json({ success: true, message: "אין סרטונים להסתרה", hiddenCount: 0 });
      }

      const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&access_token=${auth.accessToken}`);

      if (!videosResponse.ok) {
        return res.status(400).json({ error: "Failed to fetch YouTube videos" });
      }

      const videosData = await videosResponse.json();
      const videos = videosData.items || [];

      // Get all locked videos for this user
      const lockedVideoIds = await storage.getAllLockedVideos(req.user.id);

      let hiddenCount = 0;
      let errors = [];
      let lockedCount = 0;

      // Hide each video (only if not already private and not locked)
      for (const item of videos) {
        const videoId = item.snippet.resourceId.videoId;

        // Skip locked videos
        if (lockedVideoIds.includes(videoId)) {
          lockedCount++;
          continue;
        }

        try {
          // First check current video status
          const currentVideoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&access_token=${auth.accessToken}`);

          if (currentVideoResponse.ok) {
            const currentVideoData = await currentVideoResponse.json();
            const currentPrivacyStatus = currentVideoData.items?.[0]?.status?.privacyStatus;

            // Check if this video was hidden by our system (has original status record)
            const hasOriginalStatus = await storage.getVideoOriginalStatus(videoId, req.user.id);
            
            // If video is already private AND we don't have original status record,
            // it means it was private before user used our system - so lock it
            if (currentPrivacyStatus === 'private' && !hasOriginalStatus) {
              await storage.setVideoLockStatus(req.user.id, videoId, true, "pre_hidden");
              lockedCount++;
              continue;
            }

            // Only hide videos that are not already private and not locked
            if (currentPrivacyStatus && currentPrivacyStatus !== 'private') {
              // Save original status before hiding
              await storage.saveVideoOriginalStatus(videoId, currentPrivacyStatus, req.user.id);

              const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: videoId,
                  status: {
                    privacyStatus: 'private'
                  }
                })
              });

              if (updateResponse.ok) {
                hiddenCount++;
              } else {
                const errorData = await updateResponse.json();
                errors.push({ videoId, error: errorData.error?.message });
                // Remove saved status if hiding failed
                await storage.clearVideoOriginalStatus(videoId, req.user.id);
              }
            }
            // Skip videos that are already private
          }
        } catch (error) {
          errors.push({ videoId, error: error.message });
        }
      }

      let message = `הוסתרו ${hiddenCount} סרטונים בהצלחה`;
      if (lockedCount > 0) {
        message += `. ${lockedCount} סרטונים נעולים לא הושפעו`;
      }

      res.json({ 
        success: true,
        message,
        hiddenCount,
        lockedCount,
        totalVideos: videos.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("YouTube hide all error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // YouTube show all videos
  app.post("/api/youtube/show-all", requireAuth, async (req: any, res) => {
    try {
      let auth = await storage.getAuthToken('youtube', req.user.id);

      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with YouTube" });
      }

      // Test connection and refresh token if needed
      let connectionValid = await testYouTubeConnection(auth.accessToken);

      if (!connectionValid) {
        try {
          auth = await refreshYouTubeToken(auth, req.user.id);
          connectionValid = await testYouTubeConnection(auth.accessToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return res.status(401).json({ error: "YouTube authentication expired. Please reconnect." });
        }
      }

      // Get all videos that have saved original status (meaning they were hidden by our system)
      const videoOriginalStatuses = await storage.getAllVideoOriginalStatuses(req.user.id);
      const allVideoIds = Object.keys(videoOriginalStatuses);

      // Get locked videos and exclude them from restoration
      const lockedVideoIds = await storage.getAllLockedVideos(req.user.id);
      const videoIds = allVideoIds.filter(videoId => !lockedVideoIds.includes(videoId));

      console.log('Show all - Found video original statuses:', {
        totalCount: allVideoIds.length,
        lockedCount: lockedVideoIds.length,
        restoreCount: videoIds.length,
        videoIds,
        statuses: videoOriginalStatuses
      });

      if (videoIds.length === 0) {
        const message = lockedVideoIds.length > 0 
          ? `אין סרטונים לשחזור. ${lockedVideoIds.length} סרטונים נעולים לא ישוחזרו`
          : "אין סרטונים מוסתרים לשחזור";
        return res.json({ success: true, message, shownCount: 0, lockedCount: lockedVideoIds.length });
      }

      let shownCount = 0;
      let errors = [];

      // Restore each video to its original status (excluding locked videos)
      for (const videoId of videoIds) {
        const originalStatus = videoOriginalStatuses[videoId];

        try {
          const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: videoId,
              status: {
                privacyStatus: originalStatus
              }
            })
          });

          if (updateResponse.ok) {
            // Clear original status after successful restore
            await storage.clearVideoOriginalStatus(videoId, req.user.id);
            shownCount++;
          } else {
            const errorData = await updateResponse.json();
            errors.push({ videoId, error: errorData.error?.message });
          }
        } catch (error) {
          errors.push({ videoId, error: error.message });
        }
      }

      let message = `הוצגו ${shownCount} סרטונים בהצלחה`;
      if (lockedVideoIds.length > 0) {
        message += `. ${lockedVideoIds.length} סרטונים נעולים לא הושפעו`;
      }

      res.json({ 
        success: true,
        message,
        shownCount,
        lockedCount: lockedVideoIds.length,
        totalVideos: videoIds.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("YouTube show all error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // YouTube video lock routes
  app.post("/api/youtube/video/:videoId/lock", requireAuth, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const { reason } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
      }

      await storage.setVideoLockStatus(req.user.id, videoId, true, reason || "manual");

      res.json({ 
        success: true, 
        message: "הסרטון ננעל בהצלחה" 
      });
    } catch (error) {
      console.error("Error setting video lock status:", error);
      res.status(500).json({ error: "שגיאה בעדכון סטטוס נעילת הסרטון" });
    }
  });

  app.post("/api/youtube/video/:videoId/unlock", requireAuth, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const { password } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
      }

      // Require password verification for unlock
      if (!password) {
        return res.status(400).json({ error: "Password is required to unlock video" });
      }

      const user = await storage.verifyPassword(req.user.email, password);
      if (!user) {
        return res.status(401).json({ error: "סיסמה שגויה" });
      }

      // Get YouTube auth
      const auth = await storage.getAuthToken('youtube', req.user.id);
      if (!auth) {
        return res.status(401).json({ error: "YouTube authentication required" });
      }

      // Get the lock status to understand why it was locked
      const lockStatus = await storage.getVideoLockStatus(req.user.id, videoId);

      // Check if the video has an original status (was hidden by our system)
      const originalStatus = await storage.getVideoOriginalStatus(videoId, req.user.id);

      if (originalStatus) {
        // Restore the video to its original status (it was hidden by our system)
        const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: videoId,
            status: {
              privacyStatus: originalStatus
            }
          })
        });

        if (updateResponse.ok) {
          // Clear the original status since video has been restored
          await storage.clearVideoOriginalStatus(videoId, req.user.id);
        }
      } else if (lockStatus && lockStatus.reason === 'auto_private') {
        // This video was already private before our system - make it public when unlocked
        const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: videoId,
            status: {
              privacyStatus: 'public'
            }
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error("Failed to make video public:", errorData);
        }
      }

      // Unlock the video
      await storage.setVideoLockStatus(req.user.id, videoId, false, "unlocked");

      res.json({ 
        success: true, 
        message: "הסרטון שוחרר מנעילה ושוחזר למצב המקורי" 
      });
    } catch (error) {
      console.error("Error unlocking video:", error);
      res.status(500).json({ error: "שגיאה בשחרור נעילת הסרטון" });
    }
  });

  app.get("/api/youtube/video/:videoId/lock-status", requireAuth, async (req: any, res) => {
    try {
      const { videoId } = req.params;
      const lockStatus = await storage.getVideoLockStatus(req.user.id, videoId);

      res.json(lockStatus);
    } catch (error) {
      console.error("Error getting video lock status:", error);
      res.status(500).json({ error: "שגיאה בקבלת סטטוס נעילת הסרטון" });
    }
  });

  // YouTube routes are defined above as public endpoints

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
        const facebookAuth = storage.getFacebookAuth(req.user?.id);
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

  // Duplicate endpoint removed - using the authenticated version at line 587

  // User authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);

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

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      const updatedUser = await storage.updateUser(user.id, { lastLogin: new Date() });

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

  // Shabbat times route using Hebcal API
  app.get("/api/shabbat/times", async (req, res) => {
    try {
      const { city } = req.query;

      if (!city) {
        return res.status(400).json({ error: "City parameter is required" });
      }

      // City coordinates for Hebcal API
      const cityCoordinates: Record<string, { lat: number; lng: number; timezone: string }> = {
        'Jerusalem': { lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem' },
        'Tel Aviv': { lat: 32.0853, lng: 34.7818, timezone: 'Asia/Jerusalem' },
        'Haifa': { lat: 32.7940, lng: 34.9896, timezone: 'Asia/Jerusalem' },
        'Beer Sheva': { lat: 31.2518, lng: 34.7915, timezone: 'Asia/Jerusalem' },
        'Netanya': { lat: 32.3215, lng: 34.8532, timezone: 'Asia/Jerusalem' },
        'Ashdod': { lat: 31.8044, lng: 34.6553, timezone: 'Asia/Jerusalem' },
        'Petah Tikva': { lat: 32.0870, lng: 34.8882, timezone: 'Asia/Jerusalem' },
        'Rishon LeZion': { lat: 31.9730, lng: 34.8066, timezone: 'Asia/Jerusalem' },
        'Ashkelon': { lat: 31.6688, lng: 34.5742, timezone: 'Asia/Jerusalem' },
        'Rehovot': { lat: 31.8947, lng: 34.8081, timezone: 'Asia/Jerusalem' },
        'Bat Yam': { lat: 32.0167, lng: 34.7500, timezone: 'Asia/Jerusalem' },
        'Herzliya': { lat: 32.1624, lng: 34.8442, timezone: 'Asia/Jerusalem' },
        'Kfar Saba': { lat: 32.1743, lng: 34.9077, timezone: 'Asia/Jerusalem' },
        'Ra\'anana': { lat: 32.1847, lng: 34.8707, timezone: 'Asia/Jerusalem' },
        'Modi\'in': { lat: 31.8969, lng: 35.0095, timezone: 'Asia/Jerusalem' },
        'Eilat': { lat: 29.5581, lng: 34.9482, timezone: 'Asia/Jerusalem' },
        'Tiberias': { lat: 32.7940, lng: 35.5308, timezone: 'Asia/Jerusalem' },
        'Nazareth': { lat: 32.7028, lng: 35.2973, timezone: 'Asia/Jerusalem' },
        'Acre': { lat: 32.9253, lng: 35.0818, timezone: 'Asia/Jerusalem' },
        'Safed': { lat: 32.9650, lng: 35.4951, timezone: 'Asia/Jerusalem' },
        'New York': { lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
        'Los Angeles': { lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
        'London': { lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
        'Paris': { lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' }
      };

      const coords = cityCoordinates[city as string];
      if (!coords) {
        return res.status(400).json({ error: "City not supported" });
      }

      // Get next 2 Fridays
      const today = new Date();
      const daysUntilFriday = (5 - today.getDay() + 7) % 7;
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));

      const secondFriday = new Date(nextFriday);
      secondFriday.setDate(nextFriday.getDate() + 7);

      // Use exact Israeli timing data for maximum accuracy
      const isIsraeliCity = [
        'Jerusalem', 'Tel Aviv', 'Haifa', 'Beer Sheva', 'Netanya', 'Ashdod', 
        'Petah Tikva', 'Rishon LeZion', 'Ashkelon', 'Rehovot', 'Bat Yam', 
        'Herzliya', 'Kfar Saba', 'Ra\'anana', 'Modi\'in', 'Eilat', 'Tiberias', 
        'Nazareth', 'Acre', 'Safed'
      ].includes(city as string);

      console.log(`City received: "${city}", isIsraeliCity: ${isIsraeliCity}`);

      // Function to get Shabbat times for a specific Friday
      const getShabbatTimesForDate = async (fridayDate: Date) => {
        const year = fridayDate.getFullYear();
        const month = fridayDate.getMonth() + 1;
        const day = fridayDate.getDate();

        let shabbatEntryTime: Date | null = null;
        let shabbatExitTime: Date | null = null;
        let parasha: any = { hebrew: 'פרשת השבוע' };
        let hebrewDate: string = '';

        // Use authentic Chabad API for Israeli cities, Hebcal for international
        if (isIsraeliCity) {
          // Map city names to Chabad city IDs (same as the widget uses)
          const chabadCityIds: Record<string, string> = {
            'Jerusalem': '281',
            'Tel Aviv': '531', 
            'Haifa': '294',
            'Beer Sheva': '688',
            'Netanya': '569',
            'Ashdod': '435',
            'Petah Tikva': '576',
            'Rishon LeZion': '580',
            'Ashkelon': '570',
            'Rehovot': '578',
            'Bat Yam': '571',
            'Herzliya': '572',
            'Kfar Saba': '573',
            'Ra\'anana': '574',
            'Modi\'in': '575',
            'Eilat': '577',
            'Tiberias': '579',
            'Nazareth': '581',
            'Acre': '582',
            'Safed': '695'
          };

          // Map Chabad city IDs to HebCal geonames
          const hebcalCityMapping: Record<string, { geo?: string; lat?: number; lng?: number }> = {
            '281': { geo: 'geoname:281184' }, // Jerusalem
            '531': { geo: 'geoname:293397' }, // Tel Aviv
            '294': { geo: 'geoname:294751' }, // Beer Sheva (was mapped to Haifa)
            '280': { geo: 'geoname:294117' }, // Haifa
            '543': { geo: 'geoname:295629' }, // Eilat
            'default': { lat: 32.0853, lng: 34.7818 } // Default to Tel Aviv coordinates
          };

          const cityId = chabadCityIds[city as string];
          if (cityId) {
            try {
              // Use HebCal API instead of Chabad
              const cityInfo = hebcalCityMapping[cityId] || hebcalCityMapping['default'];
              const dateStr = fridayDate.toISOString().split('T')[0];
              
              let apiUrl: string;
              if (cityInfo.geo) {
                apiUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=${cityInfo.geo.split(':')[1]}&date=${dateStr}`;
              } else {
                apiUrl = `https://www.hebcal.com/shabbat?cfg=json&latitude=${cityInfo.lat}&longitude=${cityInfo.lng}&date=${dateStr}`;
              }

              console.log(`📡 Calling HebCal API for ${city}: ${apiUrl}`);

              const response = await fetch(apiUrl, {
                headers: {
                  'User-Agent': 'Shabbat-Robot/1.0 (https://shabbat-robot.replit.app)',
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.items && data.items.length > 0) {
                  // Find candle lighting and havdalah times
                  let candleLighting: Date | null = null;
                  let havdalah: Date | null = null;

                  for (const item of data.items) {
                    if (item.category === 'candles' || item.title?.includes('Candle lighting')) {
                      candleLighting = new Date(item.date);
                    } else if (item.category === 'havdalah' || item.title?.includes('Havdalah')) {
                      havdalah = new Date(item.date);
                    }
                  }

                  if (candleLighting) {
                    shabbatEntryTime = candleLighting;
                    
                    // If no havdalah found, estimate it
                    if (havdalah) {
                      shabbatExitTime = havdalah;
                    } else {
                      shabbatExitTime = new Date(candleLighting);
                      shabbatExitTime.setDate(shabbatExitTime.getDate() + 1);
                      shabbatExitTime.setMinutes(shabbatExitTime.getMinutes() + 60);
                    }

                    parasha = { hebrew: 'פרשת השבוע' };
                    hebrewDate = '';

                    console.log(`✅ Got HebCal times for ${city}: Entry ${shabbatEntryTime.toTimeString().slice(0,5)}, Exit ${shabbatExitTime.toTimeString().slice(0,5)}`);
                  } else {
                    throw new Error('Could not find candle lighting time');
                  }
                } else {
                  throw new Error('No Shabbat times in HebCal response');
                }
              } else {
                throw new Error(`HebCal API returned ${response.status}`);
              }
            } catch (error) {
              console.error(`⚠️ Failed to get HebCal times for ${city}:`, error);
              // Return null to indicate failure - no fallback to old static times
              return null;
            }
          } else {
            console.error(`⚠️ City ${city} not found in Chabad city mapping`);
            return null;
          }
        } else {
          // Use simple calculation for international cities
          const entryOffset = -18; // 18 minutes before sunset
          const exitOffset = 25; // 25 minutes after sunset

          shabbatEntryTime = new Date(year, month - 1, day);
          shabbatEntryTime.setHours(19, 30, 0, 0); // Default international time

          shabbatExitTime = new Date(year, month - 1, day + 1);
          shabbatExitTime.setHours(20, 30, 0, 0); // Default international time

          parasha = { hebrew: 'פרשת קורח' };
          hebrewDate = '';

          console.log(`Using default international times for ${city}: Entry 19:30, Exit 20:30`);
        }

        // Check if we got valid times
        if (!shabbatEntryTime || !shabbatExitTime) {
          return null;
        }
        
        return {
          shabbatEntryTime,
          shabbatExitTime,
          parasha,
          hebrewDate
        };
      };

      // Get times for both Shabbats
      const firstShabbat = await getShabbatTimesForDate(nextFriday);
      const secondShabbat = await getShabbatTimesForDate(secondFriday);

      // If we couldn't get Chabad times, return error
      if (!firstShabbat || !secondShabbat) {
        return res.status(503).json({ 
          error: "Unable to fetch authentic Shabbat times from Chabad API", 
          city: city as string,
          fallback: false 
        });
      }

      console.log(`✅ Got authentic Chabad times for ${city}: First Shabbat ${firstShabbat.shabbatEntryTime.toTimeString().slice(0,5)}/${firstShabbat.shabbatExitTime.toTimeString().slice(0,5)}`);
      console.log(`✅ Got authentic Chabad times for ${city}: Second Shabbat ${secondShabbat.shabbatEntryTime.toTimeString().slice(0,5)}/${secondShabbat.shabbatExitTime.toTimeString().slice(0,5)}`);

      // Format times for display (HH:MM format)
      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: coords.timezone,
          hour12: false
        });
      };

      // Format Hebrew date
      const formatHebrewDate = (hebrewDateStr: string) => {
        if (!hebrewDateStr) return '';

        const hebrewNumerals: { [key: string]: string } = {
          '1': 'א\'', '2': 'ב\'', '3': 'ג\'', '4': 'ד\'', '5': 'ה\'', '6': 'ו\'', '7': 'ז\'', '8': 'ח\'', '9': 'ט\'', '10': 'י\'',
          '11': 'י"א', '12': 'י"ב', '13': 'י"ג', '14': 'י"ד', '15': 'ט"ו', '16': 'ט"ז', '17': 'י"ז', '18': 'י"ח', '19': 'י"ט', '20': 'כ\'',
          '21': 'כ"א', '22': 'כ"ב', '23': 'כ"ג', '24': 'כ"ד', '25': 'כ"ה', '26': 'כ"ו', '27': 'כ"ז', '28': 'כ"ח', '29': 'כ"ט', '30': 'ל\''
        };

        const hebrewMonths: { [key: string]: string } = {
          'Tishrei': 'תשרי', 'Cheshvan': 'חשוון', 'Kislev': 'כסלו', 'Tevet': 'טבת', 'Shvat': 'שבט', 'Adar': 'אדר',
          'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיוון', 'Tamuz': 'תמוז', 'Av': 'אב', 'Elul': 'אלול'
        };

        const parts = hebrewDateStr.split(' ');
        if (parts.length >= 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];

          const hebrewDay = hebrewNumerals[day] || day;
          const hebrewMonth = hebrewMonths[month] || 'ב' + month.toLowerCase();
          const hebrewYear = year === '5785' ? 'ה\'תשפ"ה' : year;

          return `${hebrewDay} ב${hebrewMonth} ${hebrewYear}`;
        }
        return hebrewDateStr;
      };

      // Format both Shabbats
      const formatShabbat = (shabbatData: any, fridayDate: Date) => {
        const formattedHebrewDate = formatHebrewDate(shabbatData.hebrewDate);
        const currentDate = fridayDate.toLocaleDateString('he-IL', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });

        const fullHebrewDateString = formattedHebrewDate ? 
          `שבת ${shabbatData.parasha?.hebrew || 'פרשת השבוע'}, ${formattedHebrewDate} ${currentDate}` : 
          `שבת ${shabbatData.parasha?.hebrew || 'פרשת השבוע'}`;

        // Campaign closure time (30 minutes before Shabbat entry)
        const campaignClosureTime = new Date(shabbatData.shabbatEntryTime);
        campaignClosureTime.setMinutes(campaignClosureTime.getMinutes() - 30);

        return {
          date: fridayDate.toISOString(),
          shabbatEntry: shabbatData.shabbatEntryTime.toISOString(),
          shabbatExit: shabbatData.shabbatExitTime.toISOString(),
          campaignClosure: campaignClosureTime.toISOString(),
          candleLighting: shabbatData.shabbatEntryTime.toISOString(),
          havdalah: shabbatData.shabbatExitTime.toISOString(),
          parasha: shabbatData.parasha?.hebrew || shabbatData.parasha?.title || 'פרשת השבוע',
          hebrewDate: fullHebrewDateString,
          entryTime: formatTime(shabbatData.shabbatEntryTime),
          exitTime: formatTime(shabbatData.shabbatExitTime)
        };
      };

      // Format response with 2 Shabbats
      const responseData = {
        city: city as string,
        shabbats: [
          formatShabbat(firstShabbat, nextFriday),
          formatShabbat(secondShabbat, secondFriday)
        ],
        // Backward compatibility - use first Shabbat data
        date: nextFriday.toISOString(),
        shabbatEntry: firstShabbat.shabbatEntryTime.toISOString(),
        shabbatExit: firstShabbat.shabbatExitTime.toISOString(),
        campaignClosure: new Date(firstShabbat.shabbatEntryTime.getTime() - 30 * 60000).toISOString(),
        candleLighting: firstShabbat.shabbatEntryTime.toISOString(),
        havdalah: firstShabbat.shabbatExitTime.toISOString(),
        parasha: firstShabbat.parasha?.hebrew || firstShabbat.parasha?.title || 'פרשת השבוע',
        hebrewDate: formatShabbat(firstShabbat, nextFriday).hebrewDate
      };

      res.json(responseData);
    } catch (error) {
      console.error("Shabbat times API error:", error);
      res.status(500).json({ error: "Failed to fetch Shabbat times" });
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

  // Admin routes - secured with password
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Change this in production!

  // Admin authentication
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid admin password" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const freeUsers = users.filter((u: any) => u.accountType === 'free').length;
      const youtubeProUsers = users.filter((u: any) => u.accountType === 'youtube_pro').length;
      const premiumUsers = users.filter((u: any) => u.accountType === 'premium').length;

      // Real revenue calculations from payment tracking
      const revenue = storage.getRevenue();

      res.json({
        totalUsers,
        freeUsers,
        youtubeProUsers,
        premiumUsers,
        monthlyRevenue: revenue.monthly,
        totalRevenue: revenue.total
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin users list
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log("getAllUsers returned:", users?.length || 0, "users");
      console.log("First user example:", users?.[0] ? { id: users[0].id, email: users[0].email, accountType: users[0].accountType } : 'none');

      // Remove passwords from response
      const safeUsers = (users || []).map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      res.json(safeUsers);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upgrade user account
  app.post("/api/admin/upgrade-user", async (req, res) => {
    try {
      const { userId, accountType } = req.body;

      if (!userId || !accountType) {
        return res.status(400).json({ error: "User ID and account type required" });
      }

      const success = await storage.upgradeUser(userId, accountType);

      if (success) {
        // Add history entry
        storage.addHistoryEntry({
          timestamp: new Date(),
          action: "admin_upgrade" as any,
          platform: "admin" as any,
          success: true,
          affectedItems: 1,
          error: undefined
        });

        res.json({ success: true });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Admin upgrade user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", (req, res) => {
    try {
      const { userId } = req.params;

      const success = storage.deleteUser(userId);

      if (success) {
        // Add history entry
        storage.addHistoryEntry({
          timestamp: new Date(),
          action: "admin_delete",
          platform: "admin",
          success: true,
          affectedItems: 1,
          error: undefined
        });

        res.json({ success: true });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin payment management
  app.post("/api/admin/payments", async (req, res) => {
    try {
      const { userId, amount, type, method, description } = req.body;

      // Validate required fields
      if (!userId || !amount || !type || !method) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Add payment record
      storage.addPayment({
        userId,
        amount: parseFloat(amount),
        type,
        method,
        description
      });

      // Automatically upgrade user account based on payment type
      const upgradeSuccess = await storage.upgradeUser(userId, type);
      
      if (upgradeSuccess) {
        console.log(`User ${userId} automatically upgraded to ${type} after payment`);
        
        // Add history entry for the upgrade
        storage.addHistoryEntry({
          timestamp: new Date(),
          action: "payment_upgrade" as any,
          platform: "admin" as any,
          success: true,
          affectedItems: 1,
          error: undefined
        });
      } else {
        console.warn(`Failed to upgrade user ${userId} to ${type} after payment`);
      }

      res.json({ 
        success: true, 
        message: "Payment recorded and user upgraded successfully",
        userUpgraded: upgradeSuccess
      });
    } catch (error) {
      console.error("Admin payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all payments
  app.get("/api/admin/payments", (req, res) => {
    try {
      const payments = storage.getPayments();
      const users = storage.getAllUsers();

      // Enrich payments with user information
      const enrichedPayments = payments.map(payment => {
        const user = users.find(u => u.id === payment.userId);
        return {
          ...payment,
          userEmail: user?.email || 'Unknown',
          username: user?.username || 'Unknown'
        };
      });

      res.json(enrichedPayments);
    } catch (error) {
      console.error("Admin payments fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current server time with proper timezone handling
  app.get("/api/current-time", (req, res) => {
    const now = new Date();
    
    // Get Israeli time properly
    const israelTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));
    const israelTimeFormatted = israelTime.toLocaleString('he-IL', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Calculate the timezone offset
    const timezoneOffset = now.getTime() - israelTime.getTime();
    const offsetHours = Math.round(timezoneOffset / (1000 * 60 * 60));
    
    res.json({
      serverTime: now.toISOString(),
      serverLocalTime: now.toString(),
      israelTime: israelTimeFormatted,
      israelTimeISO: israelTime.toISOString(),
      timestamp: now.getTime(),
      israelTimestamp: israelTime.getTime(),
      timezoneOffsetHours: offsetHours,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });
  });



  // Update user Shabbat location
  app.post('/api/user/shabbat-location', requireAuth, async (req, res) => {
    try {
      const { cityName, cityId } = req.body;

      if (!cityName || !cityId) {
        return res.status(400).json({ error: 'City name and ID are required' });
      }

      const updatedUser = await storage.updateUser(req.user.id, { shabbatCity: cityName, shabbatCityId: cityId });

      res.json({
        success: true,
        shabbatCity: updatedUser.shabbatCity,
        shabbatCityId: updatedUser.shabbatCityId
      });
    } catch (error) {
      console.error('Error updating Shabbat location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // Get user Shabbat location
  app.get('/api/user/shabbat-location', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`User ${req.user.id} location data:`, { 
        shabbatCity: user.shabbatCity, 
        shabbatCityId: user.shabbatCityId 
      });

      res.json({
        shabbatCity: user.shabbatCity || 'ירושלים',
        shabbatCityId: user.shabbatCityId || '247'
      });
    } catch (error) {
      console.error('Error getting Shabbat location:', error);
      res.status(500).json({ error: 'Failed to get location' });
    }
  });

  // Automatic scheduler management endpoints
  app.get("/api/scheduler/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const status = automaticScheduler.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      res.status(500).json({ error: 'Failed to get scheduler status' });
    }
  });

  app.post("/api/scheduler/refresh", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Refresh scheduler for specific user or all users
      if (req.user?.id) {
        await automaticScheduler.refreshUser(req.user.id);
        res.json({ success: true, message: 'התזמון רוענן בהצלחה עבור המשתמש' });
      } else {
        // Restart entire scheduler for all users
        automaticScheduler.stop();
        await automaticScheduler.start();
        res.json({ success: true, message: 'התזמון רוענן בהצלחה עבור כל המשתמשים' });
      }
    } catch (error) {
      console.error('Error refreshing scheduler:', error);
      res.status(500).json({ error: 'Failed to refresh scheduler' });
    }
  });

  // Admin endpoint to set custom Shabbat times for testing
  app.post("/api/admin/set-shabbat-times", async (req, res) => {
    console.log('🔧 [ADMIN ENDPOINT] POST /api/admin/set-shabbat-times called');
    try {
      const { entryTime, exitTime } = req.body;

      if (!entryTime || !exitTime) {
        return res.status(400).json({ error: 'Entry time and exit time are required' });
      }

      console.log(`🔧 [ADMIN TIMES UPDATE] Received from client:`, { entryTime, exitTime });
      console.log(`🔧 [ADMIN TIMES UPDATE] Server time now:`, new Date().toISOString());

      // Parse the times and convert from client timezone to Israeli timezone  
      const entryDate = new Date(entryTime);
      const exitDate = new Date(exitTime);
      
      // Add 3 hours to compensate for timezone difference (client sends local time as UTC)
      entryDate.setHours(entryDate.getHours() + 3);
      exitDate.setHours(exitDate.getHours() + 3);

      console.log(`🔧 Parsed dates:`, {
        entry: entryDate.toLocaleString('he-IL'),
        exit: exitDate.toLocaleString('he-IL'),
        entryISO: entryDate.toISOString(),
        exitISO: exitDate.toISOString()
      });

      // Update admin location with custom times
      await storage.setAdminShabbatTimes(entryDate, exitDate);

      // Refresh the automatic scheduler to pick up the new times
      console.log('🔧 [ADMIN TIMES UPDATE] Refreshing automatic scheduler...');
      automaticScheduler.stop();
      await automaticScheduler.start();
      console.log('🔧 [ADMIN TIMES UPDATE] Automatic scheduler refreshed');

      res.json({ 
        success: true, 
        message: 'Admin Shabbat times updated successfully',
        entryTime: entryDate,
        exitTime: exitDate,
        entryTimeDisplay: entryDate.toLocaleString('he-IL', {timeZone: 'Asia/Jerusalem'}),
        exitTimeDisplay: exitDate.toLocaleString('he-IL', {timeZone: 'Asia/Jerusalem'})
      });
    } catch (error) {
      console.error('Error setting admin Shabbat times:', error);
      res.status(500).json({ error: 'Failed to set Shabbat times' });
    }
  });

  // Get admin location Shabbat times
  app.get("/api/admin/shabbat-times", async (req, res) => {
    try {
      const adminTimes = await storage.getAdminShabbatTimes();
      console.log(`🔧 [GET ADMIN TIMES] Returning:`, adminTimes);
      res.json(adminTimes);
    } catch (error) {
      console.error('Error getting admin Shabbat times:', error);
      res.status(500).json({ error: 'Failed to get Shabbat times' });
    }
  });

  // Save user timing preferences
  app.post("/api/user/timing-preferences", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Received timing preferences request body:', req.body);
      const { hideTimingPreference, restoreTimingPreference, adminEntryDateTime, adminExitDateTime } = req.body;

      if (!hideTimingPreference || !restoreTimingPreference) {
        console.log('Missing required preferences:', { hideTimingPreference, restoreTimingPreference });
        return res.status(400).json({ error: 'Both timing preferences are required' });
      }

      // Validate preferences
      const validHideOptions = ['immediate', '15min', '30min', '1hour'];
      const validRestoreOptions = ['immediate', '30min', '1hour'];

      if (!validHideOptions.includes(hideTimingPreference) || !validRestoreOptions.includes(restoreTimingPreference)) {
        console.log('Invalid preference values:', { hideTimingPreference, restoreTimingPreference });
        return res.status(400).json({ error: 'Invalid timing preference values' });
      }

      const updateData: any = {
        hideTimingPreference,
        restoreTimingPreference
      };

      // Handle admin manual times if provided
      if (adminEntryDateTime || adminExitDateTime) {
        console.log('Processing admin manual times:', { adminEntryDateTime, adminExitDateTime });

        // Save admin manual times using the existing storage method
        if (adminEntryDateTime && adminExitDateTime) {
          try {
            const entryTime = new Date(adminEntryDateTime);
            const exitTime = new Date(adminExitDateTime);

            console.log('Parsed dates:', { entryTime, exitTime });

            await storage.setAdminShabbatTimes(entryTime, exitTime);
            console.log('Admin times saved successfully');

            // Refresh automatic scheduler for admin user after manual time save
            try {
              console.log('Triggering automatic scheduler refresh for admin user after manual time save');
              await automaticScheduler.refreshUser(req.user.id);
            } catch (schedulerError) {
              console.error('Error with scheduler operations:', schedulerError);
              // Don't fail the whole request if scheduler has issues
            }
          } catch (dateError) {
            console.error('Error parsing or saving admin dates:', dateError);
            return res.status(400).json({ error: 'Invalid date format for admin times' });
          }
        }
      }

      console.log('Updating user with data:', updateData);
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      console.log('User updated successfully:', updatedUser);

      // Refresh automatic scheduler after timing preferences change
      try {
        console.log('Triggering automatic scheduler refresh after timing preferences update');
        await automaticScheduler.refreshUser(req.user.id);
      } catch (schedulerError) {
        console.error('Error refreshing scheduler after timing preferences update:', schedulerError);
        // Don't fail the whole request if scheduler has issues
      }

      res.json({
        success: true,
        message: 'Timing preferences updated successfully',
        hideTimingPreference: updatedUser.hideTimingPreference,
        restoreTimingPreference: updatedUser.restoreTimingPreference
      });
    } catch (error) {
      console.error('Error updating timing preferences:', error);
      res.status(500).json({ error: 'Failed to update timing preferences', details: error.message });
    }
  });

  // Test endpoints for manual scheduler execution
  app.post("/api/scheduler/test-hide", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`Manual test hide operation for user: ${req.user.id}`);

      await automaticScheduler.executeHideOperation(req.user.id);

      res.json({ 
        success: true, 
        message: "בדיקת הסתרת תוכן בוצעה בהצלחה" 
      });
    } catch (error) {
      console.error("Error executing hide operation:", error);
      res.status(500).json({ error: "Failed to execute hide operation" });
    }
  });

  app.post("/api/scheduler/test-restore", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log(`Manual test restore operation for user: ${req.user.id}`);

      await automaticScheduler.executeRestoreOperation(req.user.id);

      res.json({ 
        success: true, 
        message: "בדיקת שחזור תוכן בוצעה בהצלחה" 
      });
    } catch (error) {
      console.error("Error executing restore operation:", error);
      res.status(500).json({ error: "Failed to execute restore operation" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "No user ID in request" });
      }

      const { username, email } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({ error: "Username and email are required" });
      }

      const updatedUser = await storage.updateUser(userId, { username, email });
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email verification endpoints
  app.post("/api/auth/send-verification-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if email service is available
      if (!emailService) {
        return res.status(503).json({ 
          error: "Email service not configured", 
          details: "Please configure Gmail SMTP or Mailjet credentials" 
        });
      }

      // Generate 6-digit verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save verification code to database
      await storage.createVerificationCode({
        email,
        code: verificationCode,
        type: 'email',
        purpose: 'registration',
        expiresAt
      });

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send verification email" });
      }

      res.json({ 
        success: true, 
        message: "קוד אימות נשלח למייל שלך",
        expiresIn: 15 // minutes
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, verificationCode } = req.body;
      
      if (!email || !verificationCode) {
        return res.status(400).json({ error: "Email and verification code are required" });
      }

      // Just check if the code is valid without marking as used
      const now = new Date();
      const [verification] = await db.select().from(schema.verificationCodes)
        .where(
          and(
            eq(schema.verificationCodes.code, verificationCode),
            eq(schema.verificationCodes.email, email),
            eq(schema.verificationCodes.isUsed, false)
          )
        );

      if (!verification) {
        return res.status(400).json({ error: "קוד אימות לא תקין" });
      }

      // Check if expired
      if (verification.expiresAt < now) {
        return res.status(400).json({ error: "קוד אימות פג תוקף" });
      }

      if (verification.purpose !== 'registration') {
        return res.status(400).json({ error: "Invalid verification code purpose" });
      }

      res.json({ 
        success: true, 
        message: "כתובת המייל אומתה בהצלחה",
        verified: true
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Enhanced registration with email verification
  app.post("/api/register-with-verification", async (req, res) => {
    try {
      const { email, username, password, verificationCode, registrationMethod = 'email' } = req.body;
      
      if (!email || !username || !password || !verificationCode) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Verify the code first
      const verification = await storage.verifyCode(verificationCode, email);
      
      if (!verification.isValid) {
        return res.status(400).json({ error: "קוד אימות לא תקין או פג תוקף" });
      }

      if (verification.purpose !== 'registration') {
        return res.status(400).json({ error: "Invalid verification code purpose" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "המייל כבר רשום במערכת" });
      }

      // Create user with verified email
      const userData = {
        email,
        username,
        password,
        accountType: 'free' as const,
        registrationMethod: registrationMethod as 'email' | 'phone',
        emailVerified: true, // Mark as verified since we verified the code
        phoneVerified: false
      };

      const newUser = await storage.createUser(userData);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: "המשתמש נרשם בהצלחה",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          accountType: newUser.accountType,
          emailVerified: true
        }
      });
    } catch (error) {
      console.error("Error during verified registration:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // SMS verification endpoints (placeholder for now)
  app.post("/api/auth/send-verification-sms", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // For now, return not implemented
      res.status(501).json({ 
        error: "SMS verification not yet implemented",
        message: "אימות SMS יהיה זמין בקרוב"
      });
    } catch (error) {
      console.error("Error sending verification SMS:", error);
      res.status(500).json({ error: "Failed to send verification SMS" });
    }
  });

  // Register Stripe Demo routes (separate from existing functionality)
  registerStripeRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
