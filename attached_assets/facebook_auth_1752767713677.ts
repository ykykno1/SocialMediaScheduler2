// server/facebook-auth.ts

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { storage } from '../storage';

const router = express.Router();

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

// קבלת טוקן לפי code
async function getAccessTokenFromCode(code: string) {
  const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: FACEBOOK_CLIENT_ID,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      client_secret: FACEBOOK_CLIENT_SECRET,
      code
    });

  const response = await fetch(tokenUrl.toString(), { method: 'GET' });
  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Failed to retrieve access token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type
  };
}

// שמירת טוקן והשלמת התחברות
router.post('/api/facebook/auth-callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    console.log('📥 קוד שהתקבל מהקליינט:', code);
    const tokenData = await getAccessTokenFromCode(code);

    await storage.saveAuthToken('facebook', {
      accessToken: tokenData.accessToken,
      expiresIn: tokenData.expiresIn,
      createdAt: Date.now()
    });

    console.log('✅ טוקן נשמר בהצלחה');
    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ שגיאה בקבלת טוקן פייסבוק:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
