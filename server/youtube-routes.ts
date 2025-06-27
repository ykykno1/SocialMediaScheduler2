import type { Express, Request, Response } from "express";
import { unifiedStorage as storage } from './unified-storage.js';
import { requireAuth } from './middleware.js';
import fetch from 'node-fetch';
import { SupportedPlatform } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: any;
}

async function refreshYouTubeToken(auth: any, userId: string) {
  if (!auth.refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshUrl = 'https://oauth2.googleapis.com/token';
  const refreshParams = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: auth.refreshToken,
    grant_type: 'refresh_token'
  });

  const refreshResponse = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: refreshParams
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json() as any;
    throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
  }

  const tokens = await refreshResponse.json() as any;
  
  // Update stored auth with new tokens
  const updatedAuth = {
    ...auth,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000)
  };

  await storage.saveAuthToken(updatedAuth, userId);
  return updatedAuth;
}

async function testYouTubeConnection(accessToken: string) {
  const testResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${accessToken}`);
  return testResponse.ok;
}

export function registerYouTubeRoutes(app: Express) {
  // YouTube videos route
  app.get("/api/youtube/videos", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log("YouTube videos endpoint called for user:", userId);
      
      let auth = await storage.getAuthToken('youtube' as SupportedPlatform, userId);
      console.log("YouTube auth found:", {
        found: !!auth,
        platform: auth?.platform,
        hasAccessToken: !!auth?.accessToken,
        hasRefreshToken: !!auth?.refreshToken
      });

      if (!auth) {
        return res.status(401).json({ error: "YouTube not connected" });
      }

      // Check if token needs refresh
      if (auth.expiresAt && Date.now() > auth.expiresAt - 300000) { // 5 minutes buffer
        try {
          auth = await refreshYouTubeToken(auth, userId);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ error: "Token expired and refresh failed" });
        }
      }

      // Get channel info first
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true&access_token=${auth.accessToken}`);
      if (!channelResponse.ok) {
        const channelData = await channelResponse.json() as any;
        console.error("Channel fetch error:", channelData);
        return res.status(channelResponse.status).json({ 
          error: "Failed to fetch channel info",
          details: channelData?.error?.message
        });
      }

      const channelData = await channelResponse.json() as any;
      if (!channelData.items || channelData.items.length === 0) {
        return res.json({ videos: [], channel: null });
      }

      const channel = channelData.items[0];
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        return res.json({ videos: [], channel: channel.snippet });
      }

      // Get videos from uploads playlist
      const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&access_token=${auth.accessToken}`);
      
      if (!videosResponse.ok) {
        const videosData = await videosResponse.json() as any;
        console.error("Videos fetch error:", videosData);
        return res.status(videosResponse.status).json({ 
          error: "Failed to fetch videos",
          details: videosData?.error?.message
        });
      }

      const videosData = await videosResponse.json() as any;
      
      // Get detailed info for each video
      const videoIds = videosData.items?.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean) || [];
      
      if (videoIds.length === 0) {
        return res.json({ videos: [], channel: channel.snippet });
      }

      const detailsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds.join(',')}&access_token=${auth.accessToken}`);
      const detailedData = await detailsResponse.json() as any;

      const videos = detailedData.items?.map((video: any) => ({
        id: video.id,
        title: video.snippet?.title || "No title",
        description: video.snippet?.description || "",
        thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
        publishedAt: video.snippet?.publishedAt,
        privacyStatus: video.status?.privacyStatus || "unknown",
        tags: video.snippet?.tags || []
      })) || [];

      res.json({ videos, channel: channel.snippet });
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // YouTube video privacy update route
  app.post("/api/youtube/video/:videoId/privacy", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;
      const { privacyStatus } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!privacyStatus || !['public', 'unlisted', 'private'].includes(privacyStatus)) {
        return res.status(400).json({ error: "Valid privacyStatus required (public, unlisted, private)" });
      }

      let auth = await storage.getAuthToken('youtube' as SupportedPlatform, userId);
      if (!auth) {
        return res.status(401).json({ error: "YouTube not connected" });
      }

      // Check if token needs refresh
      if (auth.expiresAt && Date.now() > auth.expiresAt - 300000) {
        try {
          auth = await refreshYouTubeToken(auth, userId);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ error: "Token expired and refresh failed" });
        }
      }

      // Get current video data
      const currentVideoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&access_token=${auth.accessToken}`);
      if (!currentVideoResponse.ok) {
        return res.status(404).json({ error: "Video not found" });
      }

      const currentVideoData = await currentVideoResponse.json() as any;
      if (!currentVideoData.items || currentVideoData.items.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Update video privacy
      const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          status: {
            privacyStatus: privacyStatus
          }
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json() as any;
        console.error("YouTube API error:", errorData);
        return res.status(updateResponse.status).json({ 
          error: "Failed to update video privacy",
          details: errorData?.error?.message
        });
      }

      // Log the operation
      storage.addHistoryEntry({
        platform: 'youtube' as SupportedPlatform,
        action: 'update_privacy',
        contentId: videoId,
        success: true,
        timestamp: new Date(),
        details: `Changed privacy to ${privacyStatus}`
      }, userId);

      res.json({ success: true, videoId, newPrivacyStatus: privacyStatus });
    } catch (error) {
      console.error("Error updating video privacy:", error);
      res.status(500).json({ error: "Failed to update video privacy" });
    }
  });

  // YouTube video lock status route
  app.get("/api/youtube/video/:videoId/lock-status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const lockStatus = await storage.getVideoLockStatus(userId, videoId);
      res.json(lockStatus || { isLocked: false });
    } catch (error) {
      console.error("Error getting video lock status:", error);
      res.status(500).json({ error: "Failed to get lock status" });
    }
  });

  // YouTube video lock toggle route
  app.post("/api/youtube/video/:videoId/lock", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { videoId } = req.params;
      const { isLocked, reason = "manual" } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      await storage.setVideoLockStatus(userId, videoId, isLocked, reason);
      
      // Log the operation
      storage.addHistoryEntry({
        platform: 'youtube' as SupportedPlatform,
        action: isLocked ? 'lock_video' : 'unlock_video',
        contentId: videoId,
        success: true,
        timestamp: new Date(),
        details: `Video ${isLocked ? 'locked' : 'unlocked'} (${reason})`
      }, userId);

      res.json({ success: true, videoId, isLocked, reason });
    } catch (error) {
      console.error("Error updating video lock status:", error);
      res.status(500).json({ error: "Failed to update lock status" });
    }
  });

  // YouTube bulk privacy update route
  app.post("/api/youtube/videos/bulk-privacy", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { videoIds, privacyStatus, saveOriginal = false } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ error: "Video IDs array required" });
      }

      if (!privacyStatus || !['public', 'unlisted', 'private'].includes(privacyStatus)) {
        return res.status(400).json({ error: "Valid privacyStatus required (public, unlisted, private)" });
      }

      let auth = await storage.getAuthToken('youtube' as SupportedPlatform, userId);
      if (!auth) {
        return res.status(401).json({ error: "YouTube not connected" });
      }

      // Check if token needs refresh
      if (auth.expiresAt && Date.now() > auth.expiresAt - 300000) {
        try {
          auth = await refreshYouTubeToken(auth, userId);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ error: "Token expired and refresh failed" });
        }
      }

      const results = [];

      for (const videoId of videoIds) {
        try {
          // Get current video data if saving original
          if (saveOriginal) {
            const currentVideoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&access_token=${auth.accessToken}`);
            if (currentVideoResponse.ok) {
              const currentVideoData = await currentVideoResponse.json() as any;
              if (currentVideoData.items && currentVideoData.items.length > 0) {
                const currentPrivacy = currentVideoData.items[0].status?.privacyStatus;
                if (currentPrivacy) {
                  await storage.saveVideoOriginalStatus(videoId, currentPrivacy, userId);
                }
              }
            }
          }

          // Update video privacy
          const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: videoId,
              status: {
                privacyStatus: privacyStatus
              }
            })
          });

          if (updateResponse.ok) {
            results.push({ videoId, success: true, newPrivacyStatus: privacyStatus });
            
            // Log the operation
            storage.addHistoryEntry({
              platform: 'youtube' as SupportedPlatform,
              action: 'bulk_privacy_update',
              contentId: videoId,
              success: true,
              timestamp: new Date(),
              details: `Bulk changed privacy to ${privacyStatus}`
            }, userId);
          } else {
            const errorData = await updateResponse.json() as any;
            results.push({ 
              videoId, 
              success: false, 
              error: errorData?.error?.message || "Unknown error" 
            });
          }
        } catch (error) {
          console.error(`Error updating video ${videoId}:`, error);
          results.push({ 
            videoId, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error in bulk privacy update:", error);
      res.status(500).json({ error: "Failed to update video privacy" });
    }
  });

  // YouTube restore original privacy route
  app.post("/api/youtube/videos/restore-privacy", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { videoIds } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ error: "Video IDs array required" });
      }

      let auth = await storage.getAuthToken('youtube' as SupportedPlatform, userId);
      if (!auth) {
        return res.status(401).json({ error: "YouTube not connected" });
      }

      // Check if token needs refresh
      if (auth.expiresAt && Date.now() > auth.expiresAt - 300000) {
        try {
          auth = await refreshYouTubeToken(auth, userId);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ error: "Token expired and refresh failed" });
        }
      }

      const results = [];

      for (const videoId of videoIds) {
        try {
          // Get original privacy status
          const originalPrivacy = await storage.getVideoOriginalStatus(videoId, userId);
          if (!originalPrivacy) {
            results.push({ 
              videoId, 
              success: false, 
              error: "No original privacy status found" 
            });
            continue;
          }

          // Restore to original privacy
          const updateResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&access_token=${auth.accessToken}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: videoId,
              status: {
                privacyStatus: originalPrivacy
              }
            })
          });

          if (updateResponse.ok) {
            results.push({ videoId, success: true, restoredPrivacyStatus: originalPrivacy });
            
            // Clear the saved original status
            await storage.clearVideoOriginalStatus(videoId, userId);
            
            // Log the operation
            storage.addHistoryEntry({
              platform: 'youtube' as SupportedPlatform,
              action: 'restore_privacy',
              contentId: videoId,
              success: true,
              timestamp: new Date(),
              details: `Restored privacy to ${originalPrivacy}`
            }, userId);
          } else {
            const errorData = await updateResponse.json() as any;
            results.push({ 
              videoId, 
              success: false, 
              error: errorData?.error?.message || "Unknown error" 
            });
          }
        } catch (error) {
          console.error(`Error restoring video ${videoId}:`, error);
          results.push({ 
            videoId, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error in privacy restoration:", error);
      res.status(500).json({ error: "Failed to restore video privacy" });
    }
  });
}