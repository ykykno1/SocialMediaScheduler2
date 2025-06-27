import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { unifiedStorage as storage } from './unified-storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-shabbat-robot-2024';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// JWT helper functions
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log("Auth middleware for", req.method, req.path);
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    console.log("No auth header or wrong format");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    console.log("Invalid token");
    return res.status(401).json({ error: "Invalid token" });
  }
  
  console.log("Getting user for ID:", decoded.userId);
  req.user = { id: decoded.userId };
  next();
}

// Require authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log("Auth middleware for", req.method, req.path);
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    console.log("No auth header or wrong format");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    console.log("Invalid token");
    return res.status(401).json({ error: "Invalid token" });
  }
  
  console.log("Getting user for ID:", decoded.userId);
  req.user = { id: decoded.userId };
  console.log("User authenticated successfully:", decoded.userId);
  next();
}