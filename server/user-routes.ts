import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from './enhanced-storage.js';
import { requireAuth } from './middleware.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function registerUserRoutes(app: Express) {
  // Get current user route
  app.get("/api/user", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Update user route
  app.put("/api/user", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { username, email, shabbatCity, shabbatCityId } = req.body;
      const updates: any = {};

      if (username) updates.username = username;
      if (email) updates.email = email;
      if (shabbatCity !== undefined) updates.shabbatCity = shabbatCity;
      if (shabbatCityId !== undefined) updates.shabbatCityId = shabbatCityId;

      const updatedUser = await storage.updateUser(userId, updates);
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Get user's Shabbat location route
  app.get("/api/user/shabbat-location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log(`User ${userId} location data:`, { 
        shabbatCity: req.user?.shabbatCity, 
        shabbatCityId: req.user?.shabbatCityId 
      });

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        shabbatCity: user.shabbatCity,
        shabbatCityId: user.shabbatCityId
      });
    } catch (error) {
      console.error("Get user location error:", error);
      res.status(500).json({ error: "Failed to get user location" });
    }
  });

  // Update user's Shabbat location route
  app.put("/api/user/shabbat-location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { cityId, cityName } = req.body;
      
      if (!cityId || !cityName) {
        return res.status(400).json({ error: "City ID and name required" });
      }

      const updatedUser = await storage.updateUser(userId, {
        shabbatCityId: cityId,
        shabbatCity: cityName
      });

      res.json({
        success: true,
        shabbatCity: updatedUser.shabbatCity,
        shabbatCityId: updatedUser.shabbatCityId
      });
    } catch (error) {
      console.error("Update user location error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // Get user's history route
  app.get("/api/history", requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { platform } = req.query;
      const history = storage.getHistoryEntries(platform as any);
      
      // Filter history for current user
      const userHistory = history.filter(entry => entry.userId === userId);
      
      res.json(userHistory);
    } catch (error) {
      console.error("Get history error:", error);
      res.status(500).json({ error: "Failed to get history" });
    }
  });

  // Auth status route
  app.get("/api/auth-status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log("Getting Facebook auth for user in auth-status endpoint:", userId);
      console.log("About to call storage.getAuthToken...");
      
      const facebookAuth = await storage.getAuthToken('facebook', userId);
      console.log("Storage.getAuthToken completed");
      
      const youtubeAuth = await storage.getAuthToken('youtube', userId);
      
      const authResult = !!facebookAuth?.accessToken;
      console.log("Auth result in auth-status endpoint:", authResult);
      
      if (facebookAuth) {
        console.log("Auth object details:", { 
          hasAccessToken: !!facebookAuth.accessToken, 
          timestamp: facebookAuth.timestamp 
        });
      }

      res.json({
        isAuthenticated: true,
        platform: facebookAuth ? "facebook" : youtubeAuth ? "youtube" : null,
        connections: {
          facebook: !!facebookAuth,
          youtube: !!youtubeAuth
        }
      });
    } catch (error) {
      console.error("Auth status error:", error);
      res.status(500).json({ error: "Failed to get auth status" });
    }
  });

  // Logout route
  app.post("/api/logout", requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      // Clear session or token if needed
      res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Delete user account route
  app.delete("/api/user", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Account deleted successfully" 
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
}