import type { Express, Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { enhancedStorage as storage } from '../enhanced-storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-shabbat-robot-2024';

// Helper functions
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
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

  // Logout route
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
          const fbAuthBefore = await storage.getFacebookAuth(userId);
          console.log(`=== LOGOUT DEBUG: Facebook auth before clearing: ${!!fbAuthBefore} ===`);
          
          // Clear all platform tokens for this user
          console.log(`=== LOGOUT DEBUG: Calling removeFacebookAuth for user: ${userId} ===`);
          await storage.removeFacebookAuth(userId);
          
          console.log(`=== LOGOUT DEBUG: Calling removeAuthToken for other platforms ===`);
          await storage.removeAuthToken('youtube', userId);
          await storage.removeAuthToken('instagram', userId);
          await storage.removeAuthToken('tiktok', userId);
          
          // Log after clearing
          const fbAuthAfter = await storage.getFacebookAuth(userId);
          console.log(`=== LOGOUT DEBUG: Facebook auth after clearing: ${!!fbAuthAfter} ===`);
          
          console.log(`=== LOGOUT DEBUG: All tokens cleared for user: ${userId} ===`);
        }
      } catch (error) {
        console.error(`=== LOGOUT DEBUG: Error during logout: ${error} ===`);
      }
    }
    
    console.log("=== LOGOUT DEBUG: Logout completed ===");
    res.json({ success: true, message: "Logged out successfully" });
  });
}

export { generateToken, verifyToken };