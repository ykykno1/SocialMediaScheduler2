import type { Express, Request, Response } from "express";
import { unifiedStorage as storage } from './unified-storage.js';
import { requireAuth } from './middleware.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function registerAdminRoutes(app: Express) {
  // Admin login route
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    
    // Simple admin password check
    if (password === process.env.ADMIN_PASSWORD || password === "shabbat-admin-2024") {
      res.json({ 
        success: true, 
        token: "admin-authenticated",
        message: "Admin authenticated successfully"
      });
    } else {
      res.status(401).json({ 
        error: "Invalid admin password" 
      });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const users = storage.getAllUsers();
      const payments = storage.getPayments();
      const revenue = storage.getRevenue();
      const history = storage.getHistoryEntries();

      // Calculate user statistics
      const userStats = {
        total: users.length,
        free: users.filter(u => u.accountType === 'free').length,
        youtube_pro: users.filter(u => u.accountType === 'youtube_pro').length,
        premium: users.filter(u => u.accountType === 'premium').length
      };

      // Calculate platform connections
      const platformStats = {
        facebook: users.filter(u => {
          try {
            return storage.getAuthToken('facebook', u.id) !== null;
          } catch {
            return false;
          }
        }).length,
        youtube: users.filter(u => {
          try {
            return storage.getAuthToken('youtube', u.id) !== null;
          } catch {
            return false;
          }
        }).length
      };

      // Recent activity
      const recentActivity = history
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      res.json({
        users: userStats,
        platforms: platformStats,
        payments: {
          total: payments.length,
          revenue: revenue
        },
        recentActivity,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Admin users route
  app.get("/api/admin/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const users = await storage.getAllUsers();
      
      // Add connection status for each user
      const usersWithConnections = await Promise.all(users.map(async (user) => {
        const facebookAuth = await storage.getAuthToken('facebook', user.id);
        const youtubeAuth = await storage.getAuthToken('youtube', user.id);
        
        return {
          ...user,
          password: "[HIDDEN]", // Hide password in admin view
          connections: {
            facebook: !!facebookAuth,
            youtube: !!youtubeAuth
          }
        };
      }));

      res.json(usersWithConnections);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin upgrade user route
  app.post("/api/admin/upgrade-user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const { userId, accountType } = req.body;
      
      if (!userId || !accountType) {
        return res.status(400).json({ error: "User ID and account type required" });
      }

      if (!['free', 'youtube_pro', 'premium'].includes(accountType)) {
        return res.status(400).json({ error: "Invalid account type" });
      }

      const success = await storage.upgradeUser(userId, accountType);
      
      if (success) {
        // Add payment record
        storage.addPayment({
          userId,
          amount: accountType === 'youtube_pro' ? 9.99 : 19.99,
          type: accountType as 'youtube_pro' | 'premium',
          method: 'manual',
          description: `Admin upgrade to ${accountType}`
        });

        res.json({ 
          success: true, 
          message: `User upgraded to ${accountType}`,
          userId,
          newAccountType: accountType
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Admin upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade user" });
    }
  });

  // Admin delete user route
  app.delete("/api/admin/user/:userId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "User deleted successfully",
          userId
        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin payments route
  app.get("/api/admin/payments", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const payments = storage.getPayments();
      const revenue = storage.getRevenue();

      res.json({
        payments,
        revenue,
        totalTransactions: payments.length
      });
    } catch (error) {
      console.error("Admin payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Admin activity log route
  app.get("/api/admin/activity", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      const { platform, limit = 50 } = req.query;
      
      let history = storage.getHistoryEntries(platform as any);
      
      // Sort by newest first and limit results
      history = history
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, parseInt(limit as string));

      res.json({
        activities: history,
        total: history.length,
        platform: platform || 'all'
      });
    } catch (error) {
      console.error("Admin activity error:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  // Admin system health route
  app.get("/api/admin/health", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes("admin-authenticated")) {
        return res.status(401).json({ error: "Admin authentication required" });
      }

      // Check database connectivity
      const users = await storage.getAllUsers();
      const dbConnected = users !== null;

      // Check environment variables
      const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
      ];

      const envStatus = requiredEnvVars.reduce((acc, envVar) => {
        acc[envVar] = !!process.env[envVar];
        return acc;
      }, {} as Record<string, boolean>);

      // System uptime
      const uptime = process.uptime();

      res.json({
        status: "healthy",
        database: {
          connected: dbConnected,
          userCount: users?.length || 0
        },
        environment: envStatus,
        uptime: {
          seconds: uptime,
          human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Admin health check error:", error);
      res.status(500).json({ 
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });
}