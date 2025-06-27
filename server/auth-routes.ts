import type { Express, Request, Response } from "express";
import bcrypt from 'bcrypt';
import { enhancedStorage as storage } from './enhanced-storage.js';
import { generateToken, verifyToken } from './middleware.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export function registerAuthRoutes(app: Express) {
  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username: email.split('@')[0]
      });
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      // Return user without password
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

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
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
      await storage.updateUser(user.id, { updatedAt: new Date() });
      
      // Return user without password
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

  // Logout route  
  app.post("/api/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          const userId = decoded.userId;
          
          // Clear all platform tokens
          await storage.removeFacebookAuth(userId);
          await storage.removeAuthToken('youtube', userId);
          await storage.removeAuthToken('instagram', userId);
          await storage.removeAuthToken('tiktok', userId);
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    res.json({ success: true, message: "Logged out successfully" });
  });
}