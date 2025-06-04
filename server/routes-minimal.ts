import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Simple in-memory storage for testing
const users: any[] = [];
const JWT_SECRET = 'shabbat-robot-secret-2024';

// Helper functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const requireAuth = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  
  const user = users.find(u => u.id === decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }
  
  req.user = user;
  req.userId = user.id;
  next();
};

export function registerRoutes(app: Express): Server {
  
  // Register user
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const user = {
        id: Date.now().toString(),
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        accountType: 'free',
        hideCount: 0,
        maxHides: 4,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      users.push(user);
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return response without password
      const { password: _, ...userResponse } = user;
      res.status(201).json({
        user: userResponse,
        token
      });
      
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Login user
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last active
      user.lastActive = new Date().toISOString();
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return response without password
      const { password: _, ...userResponse } = user;
      res.json({
        user: userResponse,
        token
      });
      
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Get current user
  app.get('/api/user', requireAuth, (req: any, res: Response) => {
    const { password, ...userResponse } = req.user;
    res.json(userResponse);
  });
  
  // Logout (client-side token removal)
  app.post('/api/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
  });
  
  // Get platform status
  app.get('/api/user/platforms', requireAuth, (req: any, res: Response) => {
    res.json({
      youtube: false,
      facebook: false,
      instagram: false,
      tiktok: false
    });
  });
  
  // Catch-all for API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ 
      error: 'API endpoint not found', 
      code: 'NOT_FOUND',
      path: req.path 
    });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}