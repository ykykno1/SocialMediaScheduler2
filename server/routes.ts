import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure environment variables are loaded
  dotenv.config();
  
  // Create auth-callback.html in the public folder
  const distPath = path.resolve(process.cwd(), "dist/public");
  const authCallbackPath = path.join(distPath, "auth-callback.html");
  
  // Add Facebook app credentials endpoint
  app.get('/api/facebook-config', (req: Request, res: Response) => {
    const appId = process.env.FACEBOOK_APP_ID;
    
    if (!appId) {
      return res.status(500).json({ error: 'Facebook App ID not configured' });
    }
    
    // Construct redirect URI based on environment
    let redirectUri;
    if (process.env.REPL_ID && process.env.REPL_OWNER) {
      // In Replit, we need to use the Replit domain
      const replitDomain = `${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.janeway.replit.dev`;
      redirectUri = `https://${replitDomain}/auth-callback.html`;
    } else {
      // Local development
      redirectUri = `${req.protocol}://${req.get('host')}/auth-callback.html`;
    }
    
    res.json({
      appId: appId,
      redirectUri: redirectUri
    });
  });
  
  // Create auth-callback endpoint
  app.get('/api/auth-callback', (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).json({ error: error });
    }
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }
    
    // Send success response
    res.json({ success: true, code, state });
  });
  
  // Add endpoint to exchange authorization code for token
  app.post('/api/auth-callback', async (req: Request, res: Response) => {
    const { platform, code, redirectUri } = req.body;
    
    if (!platform || !code || !redirectUri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    try {
      if (platform === 'facebook') {
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        
        if (!appId || !appSecret) {
          return res.status(500).json({ error: 'Facebook credentials not configured' });
        }
        
        // Exchange code for token
        const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
        const params = new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          code: code as string,
          redirect_uri: redirectUri
        });
        
        const response = await fetch(`${tokenUrl}?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          return res.status(response.status).json({ 
            error: errorData.error?.message || 'Failed to exchange code for token' 
          });
        }
        
        const tokenData = await response.json();
        res.json(tokenData);
      } else {
        res.status(400).json({ error: 'Unsupported platform' });
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Platform actions API
  app.post('/api/platforms/:platform/hide', (req, res) => {
    const { platform } = req.params;
    
    // Here would be the logic to hide content for the specified platform
    
    res.json({
      success: true,
      platform,
      message: `Content hidden for ${platform}`
    });
  });
  
  app.post('/api/platforms/:platform/restore', (req, res) => {
    const { platform } = req.params;
    
    // Here would be the logic to restore content for the specified platform
    
    res.json({
      success: true,
      platform,
      message: `Content restored for ${platform}`
    });
  });
  
  // Manage settings API
  app.get('/api/settings', (req, res) => {
    // In a real app, this would load settings from database
    // For now, return default settings
    res.json({
      autoSchedule: true,
      hideTime: '18:30',
      restoreTime: '19:45',
      timeZone: 'Asia/Jerusalem',
      defaultPost: true,
      platforms: {
        facebook: {
          enabled: false,
          apiKey: '',
          apiSecret: '',
          connected: false
        },
        instagram: {
          enabled: false,
          apiKey: '',
          apiSecret: '',
          connected: false
        },
        youtube: {
          enabled: false,
          apiKey: '',
          apiSecret: '',
          connected: false
        },
        tiktok: {
          enabled: false,
          apiKey: '',
          apiSecret: '',
          connected: false
        }
      },
      exceptedPosts: []
    });
  });
  
  app.post('/api/settings', (req, res) => {
    // In a real app, this would save settings to database
    res.json({ success: true });
  });
  
  // History API
  app.get('/api/history', (req, res) => {
    // In a real app, this would load history from database
    res.json([]);
  });
  
  app.post('/api/history', (req, res) => {
    // In a real app, this would add a history entry to database
    res.json({ success: true });
  });

  const httpServer = createServer(app);

  return httpServer;
}
