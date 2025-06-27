import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from './enhanced-storage.js';
import { requireAuth } from './middleware.js';
import fetch from 'node-fetch';
import { SupportedPlatform } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function registerFacebookRoutes(app: Express) {
  // Facebook disconnect route
  app.post("/api/facebook/disconnect", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Remove Facebook tokens
      await storage.removeFacebookAuth(userId);
      await storage.removeAuthToken('facebook' as SupportedPlatform, userId);
      
      res.json({ 
        success: true, 
        message: "Facebook disconnected successfully",
        platform: "facebook"
      });
    } catch (error) {
      console.error("Facebook disconnect error:", error);
      res.status(500).json({ error: "Failed to disconnect Facebook" });
    }
  });

  // Facebook posts route
  app.get("/api/facebook/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log("Fetching posts from Facebook API...");
      
      // Get Facebook auth token
      const authToken = await storage.getAuthToken('facebook' as SupportedPlatform, userId);
      if (!authToken?.accessToken) {
        return res.status(401).json({ error: "Facebook not connected" });
      }

      // Fetch user's posts from Facebook
      const postsUrl = `https://graph.facebook.com/v22.0/me/posts?fields=id,message,created_time,full_picture,picture,attachments{media,type,url,subattachments}&limit=10&access_token=${authToken.accessToken}`;
      const postsResponse = await fetch(postsUrl);
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.json() as any;
        console.error("Facebook API error:", errorData);
        return res.status(postsResponse.status).json({ 
          error: "Failed to fetch posts",
          details: errorData?.error?.message || "Unknown error"
        });
      }

      const postsData = await postsResponse.json() as any;
      console.log(`Got ${postsData.data?.length || 0} posts from user profile`);

      // Transform posts data
      const posts = postsData.data?.map((post: any) => ({
        id: post.id,
        message: post.message || "",
        created_time: post.created_time,
        full_picture: post.full_picture,
        picture: post.picture,
        attachments: post.attachments?.data || [],
        type: "profile_post"
      })) || [];

      res.json(posts);
    } catch (error) {
      console.error("Error fetching Facebook posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Facebook pages route
  app.get("/api/facebook/pages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Get Facebook auth token
      const authToken = await storage.getAuthToken('facebook' as SupportedPlatform, userId);
      if (!authToken?.accessToken) {
        return res.status(401).json({ error: "Facebook not connected" });
      }

      // Fetch managed pages
      const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=name,access_token,id&access_token=${authToken.accessToken}`;
      console.log("Fetching pages from:", pagesUrl);
      
      const pagesResponse = await fetch(pagesUrl);
      console.log("Pages response status:", pagesResponse.status);
      
      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json() as any;
        console.error("Facebook Pages API error:", errorData);
        return res.status(pagesResponse.status).json({ 
          error: "Failed to fetch pages",
          details: errorData?.error?.message || "Unknown error"
        });
      }

      const pagesData = await pagesResponse.json() as any;
      console.log("Pages API response:", JSON.stringify(pagesData, null, 2));
      console.log(`Found ${pagesData.data?.length || 0} managed pages`);

      if (!pagesData.data || pagesData.data.length === 0) {
        console.log("No pages found in data or data is empty");
        return res.json([]);
      }

      // Transform pages data
      const pages = pagesData.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token
      }));

      res.json(pages);
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
      res.status(500).json({ error: "Failed to fetch pages" });
    }
  });

  // Facebook hide posts route
  app.post("/api/facebook/hide", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { postIds, action = 'hide' } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!postIds || !Array.isArray(postIds)) {
        return res.status(400).json({ error: "Post IDs required" });
      }

      // Get Facebook auth token
      const authToken = await storage.getAuthToken('facebook' as SupportedPlatform, userId);
      if (!authToken?.accessToken) {
        return res.status(401).json({ error: "Facebook not connected" });
      }

      const results = [];
      
      for (const postId of postIds) {
        try {
          let apiUrl: string;
          let method: string;
          let body: any = {};

          if (action === 'hide') {
            // Hide post by setting privacy to SELF
            apiUrl = `https://graph.facebook.com/v22.0/${postId}`;
            method = 'POST';
            body = {
              privacy: JSON.stringify({ value: 'SELF' }),
              access_token: authToken.accessToken
            };
          } else if (action === 'restore') {
            // Restore post by setting privacy back to original
            apiUrl = `https://graph.facebook.com/v22.0/${postId}`;
            method = 'POST';
            body = {
              privacy: JSON.stringify({ value: 'ALL_FRIENDS' }),
              access_token: authToken.accessToken
            };
          } else {
            results.push({ 
              postId, 
              success: false, 
              error: "Invalid action. Use 'hide' or 'restore'" 
            });
            continue;
          }

          const response = await fetch(apiUrl, {
            method,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(body).toString()
          });

          if (response.ok) {
            const updateResponse = await response.json() as any;
            results.push({ 
              postId, 
              success: updateResponse?.success === true,
              action
            });

            // Log the operation
            storage.addHistoryEntry({
              platform: 'facebook' as SupportedPlatform,
              action: action === 'hide' ? 'hide_post' : 'restore_post',
              contentId: postId,
              success: updateResponse?.success === true,
              timestamp: new Date()
            }, userId);
          } else {
            const errorData = await response.json() as any;
            results.push({ 
              postId, 
              success: false, 
              error: errorData?.error?.message || "Unknown error" 
            });
          }
        } catch (error) {
          console.error(`Error ${action}ing post ${postId}:`, error);
          results.push({ 
            postId, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Facebook hide/restore error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });
}