# שבת רובוט - Railway Deployment Guide

## הוראות העלאה ל-Railway

### 1. הכנה לפני ההעלאה

#### Environment Variables נדרשים:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key-here-shabbat-robot-2024
NODE_ENV=production
PORT=3000
```

#### אם יש לך OAuth integrations:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 2. צעדי ההעלאה

1. **התחבר ל-Railway:**
   - לך ל-https://railway.app
   - התחבר עם GitHub

2. **צור פרוייקט חדש:**
   - לחץ על "New Project"
   - בחר "Deploy from GitHub repo"
   - בחר את הrepository שלך

3. **הגדר Environment Variables:**
   - לחץ על הפרוייקט
   - לך ל-"Variables" tab
   - הוסף את כל המשתנים מהרשימה למעלה

4. **הגדר PostgreSQL Database:**
   - לחץ על "Add Plugin"
   - בחר "PostgreSQL"
   - העתק את ה-DATABASE_URL לתוך Variables

5. **Deploy:**
   - Railway יבנה ויעלה את הפרוייקט אוטומטית
   - המערכת תהיה זמינה ב-URL שRailway יספק

### 3. לאחר ההעלאה

1. **הרץ database migration:**
   ```bash
   npm run db:push
   ```

2. **וודא שהמערכת עובדת:**
   - בדוק שהדף נטען
   - בדוק שהאימות עובד
   - בדוק שהזמנים מתעדכנים בווידג'ט

### 4. הגדרות נוספות

#### עבור Facebook OAuth:
- עדכן את ה-redirect URLs ב-Facebook Developer Console
- הוסף את ה-Railway domain לWhitelist

#### עבור Google OAuth:
- עדכן את ה-redirect URLs ב-Google Cloud Console
- הוסף את ה-Railway domain לAuthorized domains

### 5. מניטורינג

Railway מספק:
- Logs בזמן אמת
- Metrics של שימוש
- Health checks אוטומטיים
- Auto-scaling

## מבנה הפרוייקט

המערכת מורכבת מ:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + bcrypt
- **Scheduling**: node-cron for automatic Shabbat operations

## תכונות עיקריות

- ✅ זמני שבת אמיתיים מחב"ד
- ✅ הסתרה אוטומטית של תוכן ברשתות חברתיות
- ✅ תמיכה ב-Facebook ו-YouTube
- ✅ ממשק משתמש בעברית
- ✅ מערכת אדמין מלאה
- ✅ תזמון מדויק לפי מיקום המשתמש