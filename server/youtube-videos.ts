import { Express, Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { secureStorage as storage } from './storage-new';
import { AuthToken } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

// JWT‐based auth middleware
const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { id: user.id };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const registerYouTubeRoutes = (app: Express): void => {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `https://YOUR-REPLIT-URL/auth-callback.html`; // ← החלף ל־URL שלך

  // 1) Public: generate OAuth URL
  app.get("/api/youtube/auth-url", (req: Request, res: Response) => {
    if (!clientId || !clientSecret) {
      return res
        .status(500)
        .json({ error: "Google credentials not configured" });
    }
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    const scopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube",
    ];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
    res.json({ authUrl });
  });

  // 2) OAuth callback: exchange code → tokens → save for user
  app.post(
    "/api/youtube-auth-callback",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      try {
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token) {
          return res
            .status(400)
            .json({ error: "Failed to obtain access token" });
        }

        oauth2Client.setCredentials(tokens);
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelsRes = await youtube.channels.list({
          part: ["snippet"],
          mine: true,
        });
        const channel = channelsRes.data.items?.[0];
        const channelTitle = channel?.snippet?.title || "Unknown Channel";

        const token: AuthToken = {
          platform: "youtube",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || "",
          expiresAt: tokens.expiry_date,
          timestamp: Date.now(),
          userId: req.user.id,
          additionalData: { channelTitle },
        };
        storage.saveAuthToken(token, req.user.id);
        res.json({ success: true, channelTitle });
      } catch (apiErr) {
        console.error("YouTube auth callback error:", apiErr);
        res.status(500).json({ error: "Authentication failed" });
      }
    }
  );

  // 3) Check auth status for current user
  app.get(
    "/api/youtube/auth-status",
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const auth = storage.getAuthToken("youtube", req.user.id);
      if (!auth) {
        return res.json({
          isAuthenticated: false,
          platform: "youtube",
        });
      }
      res.json({
        isAuthenticated: true,
        platform: "youtube",
        channelTitle: auth.additionalData?.channelTitle || "Unknown Channel",
      });
    }
  );

  // 4) List user’s videos
  app.get(
    "/api/youtube/videos",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const auth = storage.getAuthToken("youtube", req.user.id);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Not authenticated with YouTube" });
        }
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri
        );
        oauth2Client.setCredentials({
          access_token: auth.accessToken,
          refresh_token: auth.refreshToken,
        });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelsRes = await youtube.channels.list({
          part: ["contentDetails"],
          mine: true,
        });
        const uploadsId =
          channelsRes.data.items?.[0].contentDetails?.relatedPlaylists
            ?.uploads;
        if (!uploadsId) return res.json({ videos: [] });

        const playlistRes = await youtube.playlistItems.list({
          part: ["snippet"],
          playlistId: uploadsId,
          maxResults: 50,
        });
        const items = playlistRes.data.items || [];
        const videos = [];
        for (const item of items) {
          const vid = item.snippet?.resourceId?.videoId;
          if (!vid) continue;
          const detailRes = await youtube.videos.list({
            part: ["snippet", "status"],
            id: [vid],
          });
          const d = detailRes.data.items?.[0];
          if (d) {
            videos.push({
              id: vid,
              title: d.snippet?.title,
              description: d.snippet?.description,
              publishedAt: d.snippet?.publishedAt,
              thumbnailUrl:
                d.snippet?.thumbnails?.medium?.url ||
                d.snippet?.thumbnails?.default?.url,
              privacyStatus: d.status?.privacyStatus,
            });
          }
        }
        res.json({ videos });
      } catch (err) {
        console.error("YouTube videos error:", err);
        res.status(500).json({ error: "Failed to fetch videos" });
      }
    }
  );

  // 5) Update a single video’s privacy
  app.post(
    "/api/youtube/videos/:videoId/privacy",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const { videoId } = req.params;
      const { privacyStatus } = req.body;
      try {
        const auth = storage.getAuthToken("youtube", req.user.id);
        if (!auth) {
          return res
            .status(401)
            .json({ error: "Not authenticated with YouTube" });
        }
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri
        );
        oauth2Client.setCredentials({
          access_token: auth.accessToken,
          refresh_token: auth.refreshToken,
        });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        await youtube.videos.update({
          part: ["status"],
          requestBody: {
            id: videoId,
            status: { privacyStatus },
          },
        });
        res.json({ success: true, message: `Privacy set to ${privacyStatus}` });
      } catch (err) {
        console.error("YouTube privacy update error:", err);
        res.status(500).json({ error: "Failed to update video" });
      }
    }
  );

  // 6) Hide all eligible videos
  app.post(
    "/api/youtube/videos/hide-all",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const auth = storage.getAuthToken("youtube", req.user.id)!;
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri
        );
        oauth2Client.setCredentials({
          access_token: auth.accessToken,
          refresh_token: auth.refreshToken,
        });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelsRes = await youtube.channels.list({
          part: ["contentDetails"],
          mine: true,
        });
        const uploadsId =
          channelsRes.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsId) return res.json({ hiddenCount: 0, skippedCount: 0 });

        const playlistRes = await youtube.playlistItems.list({
          part: ["snippet"],
          playlistId: uploadsId,
          maxResults: 50,
        });
        const ids = playlistRes.data.items
          ?.map((i) => i.snippet?.resourceId?.videoId)
          .filter(Boolean) as string[];

        let hidden = 0,
          skipped = 0;
        const details = await youtube.videos.list({
          part: ["status"],
          id: ids,
        });
        for (const vid of details.data.items || []) {
          const status = vid.status?.privacyStatus || "public";
          const ps = storage.getPrivacyStatus("youtube", vid.id!, req.user.id);
          if (!ps) {
            storage.updatePrivacyStatus(
              "youtube",
              vid.id!,
              { originalStatus: status, currentStatus: status },
              req.user.id
            );
          }
          if (
            (status === "public" || status === "unlisted") &&
            !ps?.wasHiddenByUser &&
            !ps?.isLockedByUser
          ) {
            await youtube.videos.update({
              part: ["status"],
              requestBody: {
                id: vid.id!,
                status: { privacyStatus: "private" },
              },
            });
            storage.updatePrivacyStatus(
              "youtube",
              vid.id!,
              { currentStatus: "private" },
              req.user.id
            );
            hidden++;
          } else skipped++;
        }

        storage.addHistoryEntry(
          { platform: "youtube", action: "hide", affectedItems: hidden, success: true, timestamp: new Date() },
          req.user.id
        );
        res.json({ hiddenCount: hidden, skippedCount: skipped });
      } catch (err) {
        console.error("YouTube hide all error:", err);
        res.status(500).json({ error: "Failed to hide all videos" });
      }
    }
  );

  // 7) Restore all videos
  app.post(
    "/api/youtube/videos/restore-all",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const auth = storage.getAuthToken("youtube", req.user.id)!;
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri
        );
        oauth2Client.setCredentials({
          access_token: auth.accessToken,
          refresh_token: auth.refreshToken,
        });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelsRes = await youtube.channels.list({
          part: ["contentDetails"],
          mine: true,
        });
        const uploadsId =
          channelsRes.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsId) return res.json({ restoredCount: 0, skippedCount: 0 });

        const playlistRes = await youtube.playlistItems.list({
          part: ["snippet"],
          playlistId: uploadsId,
          maxResults: 50,
        });
        const ids = playlistRes.data.items
          ?.map((i) => i.snippet?.resourceId?.videoId)
          .filter(Boolean) as string[];

        let restored = 0,
          skipped = 0;
        const details = await youtube.videos.list({
          part: ["status"],
          id: ids,
        });
        for (const vid of details.data.items || []) {
          const ps = storage.getPrivacyStatus("youtube", vid.id!, req.user.id);
          if (
            vid.status?.privacyStatus === "private" &&
            ps &&
            !ps.wasHiddenByUser &&
            !ps.isLockedByUser
          ) {
            await youtube.videos.update({
              part: ["status"],
              requestBody: {
                id: vid.id!,
                status: { privacyStatus: ps.originalStatus },
              },
            });
            storage.updatePrivacyStatus(
              "youtube",
              vid.id!,
              { currentStatus: ps.originalStatus },
              req.user.id
            );
            restored++;
          } else skipped++;
        }

        storage.addHistoryEntry(
          { platform: "youtube", action: "restore", affectedItems: restored, success: true, timestamp: new Date() },
          req.user.id
        );
        res.json({ restoredCount: restored, skippedCount: skipped });
      } catch (err) {
        console.error("YouTube restore all error:", err);
        res.status(500).json({ error: "Failed to restore all videos" });
      }
    }
  );

  // 8) Logout
  app.post(
    "/api/youtube/logout",
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
      storage.removeAuthToken("youtube", req.user.id);
      res.json({ success: true });
    }
  );
};
