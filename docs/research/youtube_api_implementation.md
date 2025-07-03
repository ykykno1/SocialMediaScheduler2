# מימוש אינטגרציה עם YouTube API - מדריך מפורט

## סקירת API של YouTube

YouTube Data API v3 מאפשר לאפליקציות לבצע מגוון פעולות על תוכן YouTube, כולל עדכון סטטוס פרטיות של סרטונים, קבלת מידע על ערוצים, ועוד.

## הרשאות נדרשות

לצורך הסתרת תוכן, נדרשות ההרשאות הבאות:

- `https://www.googleapis.com/auth/youtube` - גישה מלאה לחשבון YouTube
- או לחלופין מספר הרשאות ספציפיות יותר:
  - `https://www.googleapis.com/auth/youtube.readonly` - צפייה בתוכן
  - `https://www.googleapis.com/auth/youtube.force-ssl` - גישה מאובטחת לעדכון תוכן
  - `https://www.googleapis.com/auth/youtube.upload` - עדכון וניהול סרטונים

## הגדרת פרויקט בקונסולת Google Cloud

1. **יצירת פרויקט חדש**:
   - גש ל-[Google Cloud Console](https://console.cloud.google.com/)
   - צור פרויקט חדש ("Create Project")
   - תן לפרויקט שם משמעותי כמו "Shabbat Robot"

2. **הפעלת YouTube Data API**:
   - בתפריט הצד, בחר "APIs & Services" > "Library"
   - חפש "YouTube Data API v3"
   - לחץ "Enable"

3. **הגדרת מסך הסכמה (OAuth consent screen)**:
   - בתפריט הצד, בחר "APIs & Services" > "OAuth consent screen"
   - בחר סוג משתמש: External (אם אין לך G Suite) או Internal
   - מלא את פרטי האפליקציה (שם, לוגו, מידע קשר)
   - הוסף את תחומי ההרשאה (scopes) הנדרשים
   - הוסף משתמשי בדיקה אם נדרש

4. **יצירת אישורים (Credentials)**:
   - בתפריט הצד, בחר "APIs & Services" > "Credentials"
   - לחץ "Create Credentials" > "OAuth client ID"
   - בחר סוג אפליקציה: "Web application"
   - הוסף URIs להפניה מחדש (Redirect URIs) - הכתובת אליה יופנה המשתמש לאחר האימות
   - שמור את Client ID ואת Client Secret

## מימוש תהליך אימות OAuth 2.0

### בצד שרת:

```typescript
// server/youtube-auth.ts

import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly'
];

export const setupYouTubeAuth = (app: Express) => {
  const oAuth2Client = new OAuth2Client(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  // יצירת URL לאימות
  app.get('/api/youtube/auth-url', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // תמיד לבקש הסכמה כדי לקבל refresh token
    });
    res.json({ authUrl });
  });

  // טיפול בקוד אימות והמרתו לטוקן גישה
  app.get('/api/youtube/callback', async (req, res) => {
    try {
      const { code } = req.query;
      const { tokens } = await oAuth2Client.getToken(code as string);
      
      // שמירת הטוקנים בשרת
      await storage.saveAuthToken('youtube', {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      });
      
      res.redirect('/dashboard?platform=youtube&auth=success');
    } catch (error) {
      console.error('Error retrieving access token', error);
      res.redirect('/dashboard?platform=youtube&auth=error');
    }
  });

  // בדיקת סטטוס אימות
  app.get('/api/youtube/auth-status', async (req, res) => {
    const tokenData = await storage.getAuthToken('youtube');
    
    if (!tokenData || !tokenData.accessToken) {
      return res.json({ isAuthenticated: false });
    }
    
    // בדיקה אם הטוקן פג תוקף וחידוש במידת הצורך
    if (tokenData.expiryDate && tokenData.expiryDate < Date.now() && tokenData.refreshToken) {
      try {
        oAuth2Client.setCredentials({
          refresh_token: tokenData.refreshToken
        });
        
        const { credentials } = await oAuth2Client.refreshAccessToken();
        
        await storage.saveAuthToken('youtube', {
          accessToken: credentials.access_token!,
          refreshToken: tokenData.refreshToken, // שמור את הטוקן הקיים
          expiryDate: credentials.expiry_date
        });
        
        return res.json({ isAuthenticated: true });
      } catch (error) {
        console.error('Error refreshing access token', error);
        return res.json({ isAuthenticated: false, error: 'Token refresh failed' });
      }
    }
    
    return res.json({ isAuthenticated: true });
  });

  // התנתקות
  app.post('/api/youtube/logout', async (req, res) => {
    await storage.removeAuthToken('youtube');
    res.json({ success: true });
  });
};
```

## קבלת רשימת סרטונים

```typescript
// server/youtube-videos.ts

import { google, youtube_v3 } from 'googleapis';
import { storage } from './storage';

// פונקציה להגדרת לקוח YouTube עם הטוקן הנכון
const getYouTubeClient = async () => {
  const tokenData = await storage.getAuthToken('youtube');
  
  if (!tokenData || !tokenData.accessToken) {
    throw new Error('Not authenticated with YouTube');
  }
  
  const auth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  
  auth.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken
  });
  
  return google.youtube({ version: 'v3', auth });
};

export const setupYouTubeRoutes = (app: Express) => {
  // קבלת רשימת הסרטונים של המשתמש
  app.get('/api/youtube/videos', async (req, res) => {
    try {
      const youtube = await getYouTubeClient();
      
      // קבלת רשימת הסרטונים
      const response = await youtube.videos.list({
        part: ['snippet', 'status', 'contentDetails'],
        mine: true,
        maxResults: 50
      });
      
      const videos = response.data.items?.map(video => ({
        id: video.id,
        title: video.snippet?.title,
        description: video.snippet?.description,
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        publishedAt: video.snippet?.publishedAt,
        privacyStatus: video.status?.privacyStatus
      })) || [];
      
      res.json(videos);
    } catch (error) {
      console.error('Error fetching YouTube videos', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // עדכון סטטוס פרטיות של סרטון
  app.post('/api/youtube/videos/:videoId/privacy', async (req, res) => {
    try {
      const { videoId } = req.params;
      const { privacyStatus } = req.body; // 'private', 'unlisted', or 'public'
      
      const youtube = await getYouTubeClient();
      
      // עדכון סטטוס הפרטיות
      await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus
          }
        }
      });
      
      res.json({ success: true, videoId, privacyStatus });
    } catch (error) {
      console.error('Error updating video privacy', error);
      res.status(500).json({ error: 'Failed to update video privacy' });
    }
  });

  // הסתרה של כל הסרטונים (למצב פרטי)
  app.post('/api/youtube/videos/hide-all', async (req, res) => {
    try {
      const { excludedIds = [] } = req.body; // אופציונלי: רשימת סרטונים שלא יוסתרו
      const youtube = await getYouTubeClient();
      
      // קבלת כל הסרטונים הציבוריים
      const response = await youtube.videos.list({
        part: ['snippet', 'status'],
        mine: true,
        maxResults: 50
      });
      
      const publicVideos = response.data.items?.filter(
        video => video.status?.privacyStatus === 'public' && !excludedIds.includes(video.id!)
      ) || [];
      
      // שמירת הסטטוס הקודם לשחזור
      const previousStatuses = publicVideos.map(video => ({
        id: video.id,
        privacyStatus: video.status?.privacyStatus
      }));
      
      await storage.savePrivacyStatuses('youtube', previousStatuses);
      
      // שינוי סטטוס לפרטי
      const updatePromises = publicVideos.map(video => 
        youtube.videos.update({
          part: ['status'],
          requestBody: {
            id: video.id,
            status: {
              privacyStatus: 'private'
            }
          }
        })
      );
      
      await Promise.all(updatePromises);
      
      res.json({ 
        success: true, 
        hiddenCount: publicVideos.length,
        message: `${publicVideos.length} videos were successfully hidden`
      });
    } catch (error) {
      console.error('Error hiding all videos', error);
      res.status(500).json({ error: 'Failed to hide videos' });
    }
  });

  // שחזור כל הסרטונים למצבם הקודם
  app.post('/api/youtube/videos/restore-all', async (req, res) => {
    try {
      const youtube = await getYouTubeClient();
      
      // קבלת הסטטוס הקודם של הסרטונים
      const previousStatuses = await storage.getPrivacyStatuses('youtube');
      
      if (!previousStatuses || previousStatuses.length === 0) {
        return res.json({ 
          success: true, 
          restoredCount: 0,
          message: 'No videos to restore'
        });
      }
      
      // שחזור סטטוס הפרטיות הקודם
      const updatePromises = previousStatuses.map(status => 
        youtube.videos.update({
          part: ['status'],
          requestBody: {
            id: status.id,
            status: {
              privacyStatus: status.privacyStatus
            }
          }
        })
      );
      
      await Promise.all(updatePromises);
      
      // ניקוי המידע השמור
      await storage.clearPrivacyStatuses('youtube');
      
      res.json({ 
        success: true, 
        restoredCount: previousStatuses.length,
        message: `${previousStatuses.length} videos were successfully restored`
      });
    } catch (error) {
      console.error('Error restoring videos', error);
      res.status(500).json({ error: 'Failed to restore videos' });
    }
  });
};
```

## יישום בצד הלקוח

### קומפוננטה להתחברות ל-YouTube:

```tsx
// client/src/components/YouTubeAuth.tsx

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FaYoutube } from 'react-icons/fa';

export const YouTubeAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();
  
  // בדיקת סטטוס אימות
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['/api/youtube/auth-status'],
  });
  
  // קבלת כתובת האימות
  const getAuthUrlMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/youtube/auth-url');
      return await res.json();
    },
    onSuccess: (data) => {
      // פתיחת חלון האימות של גוגל
      window.location.href = data.authUrl;
      setIsAuthenticating(true);
    },
  });
  
  // התנתקות
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/youtube/logout');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/auth-status'] });
    },
  });
  
  const handleAuth = () => {
    getAuthUrlMutation.mutate();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FaYoutube className="mr-2 text-red-500" size={24} />
          YouTube חיבור
        </CardTitle>
        <CardDescription>
          חבר את חשבון YouTube שלך כדי לאפשר הסתרה אוטומטית בשבת
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">טוען נתוני אימות...</div>
        ) : authStatus?.isAuthenticated ? (
          <div className="bg-green-100 p-4 rounded-md text-green-800 text-center">
            מחובר לחשבון YouTube ✓
          </div>
        ) : (
          <div className="bg-yellow-100 p-4 rounded-md text-yellow-800 text-center">
            לא מחובר לחשבון YouTube
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {authStatus?.isAuthenticated ? (
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'מתנתק...' : 'התנתק מ-YouTube'}
          </Button>
        ) : (
          <Button 
            onClick={handleAuth}
            disabled={getAuthUrlMutation.isPending || isAuthenticating}
            className="bg-red-500 hover:bg-red-600"
          >
            {getAuthUrlMutation.isPending ? 'טוען...' : 'התחבר ל-YouTube'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
```

### קומפוננטה להצגת וניהול סרטוני YouTube:

```tsx
// client/src/components/YouTubeVideos.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FaEye, FaEyeSlash, FaYoutube } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import he from 'date-fns/locale/he';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
}

export const YouTubeVideos = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('public');
  
  // קבלת רשימת הסרטונים
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['/api/youtube/videos'],
    staleTime: 60000, // 1 דקה
  });
  
  // עדכון סטטוס פרטיות של סרטון בודד
  const updatePrivacyMutation = useMutation({
    mutationFn: async ({ videoId, privacyStatus }: { videoId: string, privacyStatus: string }) => {
      const res = await apiRequest('POST', `/api/youtube/videos/${videoId}/privacy`, { privacyStatus });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
  });
  
  // הסתרת כל הסרטונים
  const hideAllMutation = useMutation({
    mutationFn: async (excludedIds: string[] = []) => {
      const res = await apiRequest('POST', '/api/youtube/videos/hide-all', { excludedIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
  });
  
  // שחזור כל הסרטונים
  const restoreAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/youtube/videos/restore-all');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
  });
  
  const handleUpdatePrivacy = (videoId: string, newStatus: 'public' | 'private' | 'unlisted') => {
    updatePrivacyMutation.mutate({ videoId, privacyStatus: newStatus });
  };
  
  const handleHideAll = () => {
    if (window.confirm('האם אתה בטוח שברצונך להסתיר את כל הסרטונים הציבוריים?')) {
      hideAllMutation.mutate();
    }
  };
  
  const handleRestoreAll = () => {
    if (window.confirm('האם אתה בטוח שברצונך לשחזר את כל הסרטונים למצבם הקודם?')) {
      restoreAllMutation.mutate();
    }
  };
  
  if (isLoading) {
    return <div className="text-center p-8">טוען סרטונים...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>שגיאה בטעינת סרטונים</AlertTitle>
        <AlertDescription>לא ניתן לטעון את רשימת הסרטונים. אנא נסה שנית מאוחר יותר.</AlertDescription>
      </Alert>
    );
  }
  
  const filteredVideos = videos?.filter(
    (video: YouTubeVideo) => selectedTab === 'all' || video.privacyStatus === selectedTab
  ) || [];
  
  const getPrivacyBadge = (status: string) => {
    switch (status) {
      case 'public':
        return <Badge className="bg-green-500">ציבורי</Badge>;
      case 'private':
        return <Badge className="bg-red-500">פרטי</Badge>;
      case 'unlisted':
        return <Badge className="bg-yellow-500">לא רשום</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FaYoutube className="mr-2 text-red-500" size={24} />
          סרטוני YouTube שלי
        </CardTitle>
        <CardDescription>
          ניהול סרטוני YouTube והגדרות פרטיות לשבת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="all">הכל</TabsTrigger>
              <TabsTrigger value="public">ציבורי</TabsTrigger>
              <TabsTrigger value="unlisted">לא רשום</TabsTrigger>
              <TabsTrigger value="private">פרטי</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={handleHideAll}
              disabled={hideAllMutation.isPending}
            >
              <FaEyeSlash className="mr-2" />
              {hideAllMutation.isPending ? 'מסתיר...' : 'הסתר הכל'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRestoreAll}
              disabled={restoreAllMutation.isPending}
            >
              <FaEye className="mr-2" />
              {restoreAllMutation.isPending ? 'משחזר...' : 'שחזר הכל'}
            </Button>
          </div>
        </div>
        
        {filteredVideos.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            לא נמצאו סרטונים בקטגוריה זו
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סרטון</TableHead>
                <TableHead>תאריך פרסום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video: YouTubeVideo) => (
                <TableRow key={video.id}>
                  <TableCell className="flex items-center space-x-3">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-20 h-auto rounded"
                    />
                    <div>
                      <div className="font-medium">{video.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[300px]">
                        {video.description || 'אין תיאור'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(video.publishedAt), { 
                      addSuffix: true,
                      locale: he
                    })}
                  </TableCell>
                  <TableCell>
                    {getPrivacyBadge(video.privacyStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {video.privacyStatus !== 'public' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdatePrivacy(video.id, 'public')}
                          disabled={updatePrivacyMutation.isPending}
                        >
                          הפוך לציבורי
                        </Button>
                      )}
                      {video.privacyStatus !== 'private' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdatePrivacy(video.id, 'private')}
                          disabled={updatePrivacyMutation.isPending}
                        >
                          הפוך לפרטי
                        </Button>
                      )}
                      {video.privacyStatus !== 'unlisted' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleUpdatePrivacy(video.id, 'unlisted')}
                          disabled={updatePrivacyMutation.isPending}
                        >
                          הפוך ללא רשום
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          סה"כ: {videos?.length} סרטונים ({videos?.filter((v: YouTubeVideo) => v.privacyStatus === 'public').length} ציבוריים)
        </div>
      </CardFooter>
    </Card>
  );
};
```

## עדכונים נדרשים ל-Storage

כדי לתמוך באחסון טוקנים וסטטוס פרטיות, נדרשים עדכונים במודול Storage:

```typescript
// server/storage.ts

import {
  authTokens,
  privacyStatuses,
  // ... other imports
} from "@shared/schema";

export interface IStorage {
  // ... existing methods

  // Auth token management
  getAuthToken(platform: string): Promise<AuthToken | undefined>;
  saveAuthToken(platform: string, tokenData: AuthToken): Promise<AuthToken>;
  removeAuthToken(platform: string): Promise<boolean>;

  // Privacy statuses management
  getPrivacyStatuses(platform: string): Promise<PrivacyStatus[]>;
  savePrivacyStatuses(platform: string, statuses: PrivacyStatus[]): Promise<PrivacyStatus[]>;
  clearPrivacyStatuses(platform: string): Promise<boolean>;
}

// Implement the methods in MemStorage or DatabaseStorage
export class MemStorage implements IStorage {
  // ... existing implementations

  private authTokensData: Record<string, AuthToken> = {};
  private privacyStatusesData: Record<string, PrivacyStatus[]> = {};

  async getAuthToken(platform: string): Promise<AuthToken | undefined> {
    return this.authTokensData[platform];
  }

  async saveAuthToken(platform: string, tokenData: AuthToken): Promise<AuthToken> {
    this.authTokensData[platform] = tokenData;
    return tokenData;
  }

  async removeAuthToken(platform: string): Promise<boolean> {
    if (platform in this.authTokensData) {
      delete this.authTokensData[platform];
      return true;
    }
    return false;
  }

  async getPrivacyStatuses(platform: string): Promise<PrivacyStatus[]> {
    return this.privacyStatusesData[platform] || [];
  }

  async savePrivacyStatuses(platform: string, statuses: PrivacyStatus[]): Promise<PrivacyStatus[]> {
    this.privacyStatusesData[platform] = statuses;
    return statuses;
  }

  async clearPrivacyStatuses(platform: string): Promise<boolean> {
    if (platform in this.privacyStatusesData) {
      delete this.privacyStatusesData[platform];
      return true;
    }
    return false;
  }
}
```

## עדכון סכמת הנתונים

בקובץ `shared/schema.ts`, נוסיף את הטיפוסים הנדרשים:

```typescript
// shared/schema.ts

// Auth Token schema
export const authTokens = pgTable('auth_tokens', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiryDate: bigint('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type AuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
};

// Privacy statuses schema
export const privacyStatuses = pgTable('privacy_statuses', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(),
  contentId: varchar('content_id', { length: 255 }).notNull(),
  privacyStatus: varchar('privacy_status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type PrivacyStatus = {
  id: string;
  privacyStatus: string;
};
```

## סיכום מימוש YouTube API

מימוש אינטגרציה עם YouTube API דורש:

1. **הגדרת פרויקט ב-Google Cloud** - יצירת מפתחות API והגדרת OAuth
2. **מימוש תהליך אימות** - קבלת טוקנים ושמירתם
3. **מימוש פונקציונליות הסתרה** - שינוי סטטוס פרטיות לסרטונים
4. **מימוש פונקציונליות שחזור** - החזרת סרטונים למצבם הקודם
5. **ממשק משתמש** - קומפוננטות לניהול אימות והסתרת סרטונים

יתרונות האינטגרציה עם YouTube:

1. API מתועד היטב ונפוץ בשימוש
2. תמיכה מלאה בשינוי סטטוס פרטיות של תוכן
3. תמיכה בגישת OAuth סטנדרטית

האינטגרציה עם YouTube תוכל לשמש כבסיס למימוש אינטגרציה דומה עם פלטפורמות אחרות כמו TikTok, ותחזק משמעותית את הבקשה לפייסבוק.