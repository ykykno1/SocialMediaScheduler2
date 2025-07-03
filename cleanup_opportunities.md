# רשימת קוד לניקוי - אפליקציית רובוט שבת

## קבצי שרת מיותרים (בטוח למחיקה)
- `server/shabbat-scheduler (copy) 1.ts` - עותק ישן של המתזמן
- `server/migrate-auth-tokens.ts` - סקריפט מיגרציה חד-פעמי שכבר בוצע
- `server/secure-user-storage.ts` - קבצי בדיקה שלא בשימוש
- `server/test-migration.ts` - קבצי בדיקה מיותרים
- `server/storage.ts` - קבצי storage ישנים
- `server/services/` - תיקיה ריקה/מיותרת
- `server/simple-scheduler.ts` - גרסה ישנה של המתזמן
- `server/shabbat-scheduler.ts` - גרסה ישנה של המתזמן

## קבצי בדיקה ותיעוד (בטוח למחיקה)
- `test-automatic-scheduler.js` - קבצי בדיקה ישנים
- `test-scheduler.js` - קבצי בדיקה ישנים
- `application-status-report.md` - דוח מיותר
- `perfect-app-prompt.md` - קבצי תיעוד מיותרים
- `docs/research/` - תיקיית מחקר
- `docs/testing/` - תיקיית בדיקות

## תמונות ונכסים מיותרים
- `attached_assets/Screenshot_20250703_191733_Replit_1751559479548.jpg` - צילום מסך ישן
- `generated-icon.png` - אם לא בשימוש

## קוד מיותר בקבצים קיימים

### server/routes.ts - נקה:
- קוד TikTok/Instagram שלא בשימוש (שורות 1800-2000)
- console.log מיותר בכל הקבץ
- טיפול שגיאות מיותר
- endpoints ישנים שלא בשימוש
- קוד debugging מיותר

### server/database-storage.ts - נקה:
- class MemStorage - לא בשימוש במערכת הנוכחית
- פונקציות ישנות לניהול משתמשים
- קוד ישן של payments
- imports מיותרים

### server/enhanced-storage.ts - בחן:
- אפשר לאחד עם database-storage
- או למחוק אם לא נחוץ

### server/encryption.ts - נקה:
- console.log מיותר
- error handling מיותר

### server/automatic-scheduler.ts - נקה:
- console.log מיותר
- debug prints שלא נחוצים
- error handling מיותר

## קוד TypeScript לניקוי

### shared/schema.ts - נקה:
- types מיותרים שלא בשימוש
- interfaces לא בשימוש
- fields מיותרים בטבלאות

### shared/types.ts - נקה:
- types מיותרים שלא בשימוש

## קוד CSS לניקוי

### client/src/index.css - נקה:
- קלאסים שלא בשימוש
- אנימציות מיותרות
- תמות שלא בשימוש

## Dependencies לבדיקה

### package.json - בדוק:
- @stripe/react-stripe-js - אם לא בשימוש
- @stripe/stripe-js - אם לא בשימוש
- stripe - אם לא בשימוש
- @sendgrid/mail - אם לא בשימוש
- googleapis - אם לא בשימוש
- openid-client - אם לא בשימוש
- passport - אם לא בשימוש
- passport-local - אם לא בשימוש
- memorystore - אם לא בשימוש
- connect-pg-simple - אם לא בשימוש
- node-cron - אם לא בשימוש
- cron - אם לא בשימוש
- nodemailer - אם לא בשימוש
- tw-animate-css - אם לא בשימוש
- react-resizable-panels - אם לא בשימוש
- recharts - אם לא בשימוש
- react-day-picker - אם לא בשימוש
- input-otp - אם לא בשימוש
- embla-carousel-react - אם לא בשימוש
- vaul - אם לא בשימוש
- cmdk - אם לא בשימוש

## מסד נתונים לניקוי

### ניתן לנקות:
- טבלאות ישנות שלא בשימוש
- אינדקסים מיותרים
- נתונים ישנים

## מערכת בנייה לניקוי

### vite.config.ts - נקה:
- הגדרות מיותרות
- plugins לא בשימוש

### tailwind.config.ts - נקה:
- הגדרות מיותרות
- plugins לא בשימוש

### tsconfig.json - נקה:
- הגדרות מיותרות

## סיכום לניקוי
- **קבצים למחיקה מיידית**: ~15 קבצים
- **קוד למחיקה**: ~500-1000 שורות
- **Dependencies למחיקה**: ~20 חבילות
- **תמונות למחיקה**: ~2 קבצים
- **תיקיות למחיקה**: ~2 תיקיות

## הערות בטיחות:
- בדיקה שכל מה שנמחק לא בשימוש
- עדכון import statements אחרי מחיקה
- בדיקה שהמערכת עובדת אחרי כל שלב
- גיבוי לפני שינויים גדולים