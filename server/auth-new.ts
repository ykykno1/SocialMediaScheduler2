import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import type { User, AuthResponse, RegisterRequest, LoginRequest } from '../shared/types';
import { secureStorage } from './storage-new';

const JWT_SECRET = process.env.JWT_SECRET || 'shabbat-robot-jwt-secret-2024-secure';
const TOKEN_EXPIRY = '24h';
const SALT_ROUNDS = 12;

export interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

// JWT token management
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    return;
  }

  const user = secureStorage.getUserById(decoded.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    return;
  }

  // Attach user info to request
  req.user = user;
  req.userId = user.id;

  // Update last active timestamp
  secureStorage.updateUser(user.id, { lastActive: new Date() });

  next();
};

// Admin middleware (for future admin panel)
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // For now, check if user email contains 'admin' - will be improved later
  if (!req.user || !req.user.email.includes('admin')) {
    res.status(403).json({ error: 'Admin access required', code: 'ADMIN_REQUIRED' });
    return;
  }
  next();
};

// Auth route handlers
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username }: RegisterRequest = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if user already exists
    const existingUser = secureStorage.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = secureStorage.createUser({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0]
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data (without password) and token
    const { password: _, ...userResponse } = user;
    const response: AuthResponse = {
      user: userResponse,
      token
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', code: 'INTERNAL_ERROR' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = secureStorage.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last active
    secureStorage.updateUser(user.id, { lastActive: new Date() });

    // Return user data (without password) and token
    const { password: _, ...userResponse } = user;
    const response: AuthResponse = {
      user: userResponse,
      token
    };

    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', code: 'INTERNAL_ERROR' });
  }
};

export const getCurrentUser = (req: AuthenticatedRequest, res: Response): void => {
  const { password: _, ...userResponse } = req.user;
  res.json(userResponse);
};

export const logoutUser = (req: Request, res: Response): void => {
  // With JWT, logout is handled client-side by removing the token
  // We could implement a token blacklist here if needed
  res.json({ success: true, message: 'Logged out successfully' });
};

// Helper function to extract user ID from token (for cases where we only need the ID)
export const getUserIdFromToken = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
};