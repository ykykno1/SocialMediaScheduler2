// server/facebook-auth.ts

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { enhancedStorage as storage } from './enhanced-storage.js';

const router = express.Router();

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

interface AuthenticatedRequest extends Request {
  user?: any;
}

// קבלת טוקן לפי code
async function getAccessTokenFromCode(code: string) {
  const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: FACEBOOK_CLIENT_ID,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      client_secret: FACEBOOK_CLIENT_SECRET,
      code
    });

  const response = await fetch(tokenUrl.toString(), { method: 'GET' });
  const data = await response.json() as any;

  if (!data.access_token) {
    throw new Error('Failed to retrieve access token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type
  };
}

// Middleware to verify JWT token
function authenticateToken(req: AuthenticatedRequest, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-shabbat-robot-2024';

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// שמירת טוקן והשלמת התחברות
router.post('/api/facebook/auth-callback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    console.log('📥 קוד שהתקבל מהקליינט:', code);
    const tokenData = await getAccessTokenFromCode(code);

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await storage.saveAuthToken({
      platform: 'facebook',
      accessToken: tokenData.accessToken,
      expiresAt: Date.now() + (tokenData.expiresIn * 1000),
      tokenType: tokenData.tokenType || 'bearer'
    }, userId);

    console.log('✅ טוקן נשמר בהצלחה');
    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ שגיאה בקבלת טוקן פייסבוק:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;