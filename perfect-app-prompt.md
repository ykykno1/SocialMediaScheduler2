# פרומט מושלם לבניית אפליקציית שבת רובוט

## תיאור כללי של האפליקציה
בנה אפליקציית ווב מלאה בשם "שבת רובוט" שמסייעת למשתמשים יהודים שומרי מצוות לנהל את הנוכחות שלהם ברשתות החברתיות במהלך השבת. האפליקציה מסתירה אוטומטית תוכן ציבורי (סרטוני יוטיוב ופוסטים בפייסבוק) לפני כניסת השבת ומחזירה אותו לאחר יציאת השבת.

## דרישות טכניות בסיסיות
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT + bcrypt
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Scheduling**: node-cron
- **Languages**: Hebrew (RTL) + English support

## מבנה מסד הנתונים

### טבלת Users (secure_users)
```sql
- id (string, primary key, nanoid)
- email (string, unique)
- password (string, hashed with bcrypt)
- username (string)
- firstName (string, optional)
- lastName (string, optional)
- accountType (enum: 'free', 'youtube_pro', 'premium')
- shabbatCity (string, optional) - שם העיר לחישוב זמני שבת
- shabbatCityId (string, optional) - מזהה עיר מ-Chabad.org
- createdAt (timestamp)
- updatedAt (timestamp)
```

### טבלת Auth Tokens (encrypted_auth_tokens)
```sql
- id (string, primary key)
- userId (string, foreign key to secure_users)
- platform (enum: 'youtube', 'facebook', 'instagram', 'tiktok')
- encryptedToken (string) - טוקן מוצפן AES-256-GCM
- metadata (string) - מטה-דטה הצפנה (IV, authTag)
- tokenHash (string) - hash לחיפוש ללא פענוח
- expiresAt (timestamp)
- refreshToken (string, encrypted, optional)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### טבלת Shabbat Locations (shabbat_locations)
```sql
- id (string, primary key)
- cityName (string) - שם העיר בעברית
- cityId (string, unique) - מזהה Chabad.org
- country (string)
- timezone (string)
- latitude (decimal)
- longitude (decimal)
- isActive (boolean)
```

### טבלת Video Statuses (video_statuses)
```sql
- id (string, primary key)
- userId (string, foreign key)
- videoId (string) - מזהה וידאו יוטיוב
- originalStatus (string) - 'public', 'private', 'unlisted'
- currentStatus (string)
- hiddenAt (timestamp, optional)
- restoredAt (timestamp, optional)
- isLocked (boolean) - האם הוידאו נעול מפני שינויים
- lockReason (string, optional)
```

### טבלת History Entries (history_entries)
```sql
- id (string, primary key)
- userId (string, foreign key)
- platform (enum: 'youtube', 'facebook', 'instagram', 'tiktok')
- action (enum: 'hide', 'restore', 'auth', 'manual_token')
- timestamp (timestamp)
- success (boolean)
- affectedItems (integer) - כמה פריטים הושפעו
- error (string, optional)
- details (json, optional) - פרטים נוספים
```

### טבלת Admin Settings (admin_settings)
```sql
- id (string, primary key)
- userId (string, foreign key) - מנהל שקבע את ההגדרות
- settingKey (string) - 'manual_shabbat_entry', 'manual_shabbat_exit'
- settingValue (string) - זמן בפורמט ISO
- createdAt (timestamp)
- updatedAt (timestamp)
```

### טבלת User Preferences (user_preferences)
```sql
- id (string, primary key)
- userId (string, foreign key)
- hideTimingPreference (enum: 'immediate', '15min', '30min', '1hour') - default: '1hour'
- restoreTimingPreference (enum: 'immediate', '15min', '30min') - default: 'immediate'
- enableNotifications (boolean) - default: true
- autoScheduleEnabled (boolean) - default: true
- createdAt (timestamp)
- updatedAt (timestamp)
```

## פונקציות מרכזיות נדרשות

### 1. מערכת אימות מלאה
- הרשמה עם validation (email, password strength)
- התחברות עם JWT tokens
- middleware לבדיקת הרשאות
- סוגי משתמשים: free (יוטיוב בלבד), youtube_pro (יוטיוב מתקדם), premium (כל הפלטפורמות)
- אבטחת session עם expiry

### 2. אינטגרציה עם פלטפורמות
**YouTube Integration:**
- OAuth 2.0 עם Google APIs
- קריאת רשימת סרטונים של המשתמש
- שינוי privacy status (public/private/unlisted)
- שמירת מצב מקורי לשחזור
- מערכת נעילת סרטונים (למניעת שינוי)
- רענון אוטומטי של tokens

**Facebook Integration:**
- OAuth 2.0 עם Facebook Graph API v22.0+
- קריאת פוסטים אישיים (לא דפים עסקיים - הגבלת API)
- שינוי privacy (EVERYONE/FRIENDS/SELF)
- התמודדות עם הגבלות API של פייסבוק

**Instagram/TikTok (עתידי):**
- תשתית מוכנה לאינטגרציה עתידית
- מבנה נתונים תומך

### 3. מערכת זמני שבת אוטומטית
- אינטגרציה עם Chabad.org API לזמני שבת מדויקים
- רשימה של 45+ ערים בישראל עם קודי מיקום נכונים
- חישוב אוטומטי לפי מיקום משתמש
- תמיכה בהגדרות ידניות למנהלים
- תצוגת פרשת השבוע עם תאריכים עבריים

### 4. סקדולר אוטומטי מלא
- זיהוי כל המשתמשים ברמת premium
- חישוב זמני הסתרה לפי העדפות משתמש (immediate/15min/30min/1hour לפני שבת)
- חישוב זמני החזרה (immediate/15min/30min אחרי שבת)
- שימוש ב-node-cron לתזמון מדויק
- ביצוע בפועל של הסתרה והחזרה אוטומטית
- לוגים מפורטים ומעקב אחר ביצוע
- שגיאות handling ו-retry mechanisms

### 5. ממשק משתמש מלא
**דף בית:**
- ווידג'ט שבת עם זמנים נוכחיים
- מצב חיבור לפלטפורמות
- תצוגת סטטוס תוכן (כמה פריטים מוסתרים/גלויים)

**ניהול יוטיוב:**
- רשימת כל הסרטונים עם thumbnails
- כפתורי הסתר/הצג לכל סרטון
- כפתורי "הסתר הכל"/"הצג הכל"
- מערכת נעילה למניעת שינוי מקרי
- סינון לפי סטטוס (public/private/hidden)

**ניהול פייסבוק:**
- רשימת פוסטים עם תמונות
- כפתורי הסתר/הצג לכל פוסט  
- הסבר על הגבלות דפים עסקיים
- סטטוס חיבור ותוקף טוקן

**הגדרות:**
- בחירת מיקום לחישוב זמני שבת
- העדפות תזמון (מתי להסתיר/להחזיר)
- הגדרת התראות
- אפשרות כיבוי סקדולר אוטומטי

**היסטוריה:**
- לוג מלא של כל הפעולות
- פילטור לפי תאריך/פלטפורמה/סוג פעולה
- סטטיסטיקות שימוש

### 6. ממשק מנהל מתקדם
- רשימת כל המשתמשים
- שדרוג/הורדת רמות חשבון
- הגדרת זמני שבת ידניים (עוקף את ה-API)
- צפייה בלוגי מערכת
- סטטיסטיקות שימוש כלליות
- ניהול תשלומים וקופונים

### 7. מערכת אבטחה מתקדמת
- הצפנת כל ה-auth tokens עם AES-256-GCM
- מפתחות הצפנה נפרדים לכל משתמש
- token hashing לחיפוש מהיר ללא פענוח
- validation של כל הקלטות משתמש
- rate limiting על API calls
- audit trail מלא

## תכונות ביצועים וחוויית משתמש

### תכונות UI/UX חיוניות:
- תמיכה מלאה ב-RTL לעברית
- responsive design (mobile-first)
- loading states ו-skeleton screens
- error boundaries ו-error handling אלגנטי
- הודעות success/error עם toast notifications
- optimistic updates ב-React Query
- keyboard navigation ו-accessibility

### ביצועים:
- lazy loading של components כבדים
- memoization של חישובים יקרים
- connection pooling למסד נתונים
- caching של זמני שבת (24 שעות)
- background refresh של tokens
- batch operations לשדרוג סטטוס מרובה

### אמינות:
- retry mechanisms ל-API calls חיצוניים
- graceful degradation כאשר services לא זמינים
- backup של נתונים קריטיים
- monitoring ו-logging מפורט
- health checks לכל השירותים החיצוניים

## קושי טכני מיוחד לטיפול

### אתגרי אינטגרציה:
1. **Facebook API מגבלות**: ב-API v22.0+ אין גישה לדפים עסקיים - צריך הסבר ברור למשתמש
2. **YouTube token expiry**: טוקנים פגים לעיתים קרובות - צריך refresh אוטומטי
3. **זמני שבת דינמיים**: שינוי לפי עונות וגלות השמש - אינטגרציה עם Chabad.org
4. **תזמון מדויק**: פעולות צריכות לקרות בזמן מדויק - שימוש ב-cron עם error handling

### שיקולי אבטחה:
1. **טוקני גישה רגישים**: הצפנה חזקה עם key rotation
2. **מניעת replay attacks**: nonce ו-timestamp validation
3. **הגנה על נתוני משתמש**: GDPR compliance ו-data minimization
4. **בידוד בין משתמשים**: אין גישה לנתונים של משתמשים אחרים

## סדר פיתוח מומלץ:

### שלב 1: תשתית
1. הקמת פרויקט עם כל התלויות
2. מסד נתונים עם Drizzle ו-migrations
3. מערכת אימות בסיסית
4. UI components בסיסיים עם shadcn

### שלב 2: אינטגרציה בסיסית
1. חיבור ליוטיוב עם OAuth
2. קריאה והצגת סרטונים
3. הסתרה והצגה ידנית
4. שמירת סטטוס מקורי

### שלב 3: שבת ותזמון
1. אינטגרציה עם Chabad.org
2. ווידג'ט זמני שבת
3. מערכת העדפות משתמש
4. בניית הסקדולר האוטומטי

### שלב 4: פייסבוק והרחבה
1. חיבור לפייסבוק
2. ניהול פוסטים
3. הגדרות מתקדמות
4. ממשק מנהל

### שלב 5: ליטוש וביצועים
1. בדיקות מקיפות
2. אופטימיזציה
3. אמינות ו-error handling
4. documentation מלא

## הערות חשובות למימוש:
- תמיד להשתמש בנתונים אמיתיים מה-APIs, לא mock data
- לבנות מערכת modular שמאפשרת הוספת פלטפורמות נוספות
- לשמור על backward compatibility בשינויי database
- לתעד כל שינוי ארכיטקטוני ב-replit.md
- לבדוק תמיד עם משתמש אמיתי לפני finalizing features