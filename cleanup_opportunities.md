# רשימת קוד לניקוי - אפליקציית רובוט שבת

## קבצי שרת מיותרים
- `server/shabbat-scheduler (copy) 1.ts` - עותק ישן של המתזמן
- `server/migrate-auth-tokens.ts` - סקריפט מיגרציה חד-פעמי שכבר בוצע
- `server/secure-user-storage.ts` - קבצי בדיקה שלא בשימוש
- `server/enhanced-storage.ts` - אפשר לאחד עם database-storage

## קבצי בדיקה
- `test-automatic-scheduler.js` - קבצי בדיקה ישנים
- `test-scheduler.js` - קבצי בדיקה ישנים
- `application-status-report.md` - דוח מיותר
- `perfect-app-prompt.md` - קבצי תיעוד מיותרים

## קבצי תיעוד מיותרים
- `docs/` - תיקיית מחקר (אם קיימת)
- קבצי README נוספים

## קוד מיותר בקבצים קיימים

### server/routes.ts
- פונקציות מיותרות לפלטפורמות שלא בשימוש (TikTok, Instagram)
- endpoints ישנים שלא בשימוש
- קוד debugging מיותר

### server/database-storage.ts
- class MemStorage - לא בשימוש במערכת הנוכחית
- פונקציות ישנות לניהול משתמשים
- קוד ישן של payments

### client/src/pages/
- עמודים כפולים או לא בשימוש
- קבצי auth מיותרים
- עמודי בדיקה

### client/src/components/
- קומפוננטים לא בשימוש
- גרסאות ישנות של קומפוננטים
- hooks מיותרים

## תמונות ונכסים
- `attached_assets/` - בדיקה איזה קבצים באמת בשימוש
- `generated-icon.png` - אם לא בשימוש

## קוד TypeScript
- types מיותרים ב-`shared/schema.ts`
- interfaces לא בשימוש
- import statements מיותרים

## קוד CSS
- קלאסים לא בשימוש ב-`client/src/index.css`
- אנימציות מיותרות
- תמות שלא בשימוש

## טוען מהמון packages
- בדיקת `package.json` - איזה חבילות לא בשימוש
- dependencies מיותרים
- dev dependencies לא נחוצים

## מסד נתונים
- טבלאות ישנות (אם קיימות)
- אינדקסים מיותרים
- נתונים ישנים

## לוגים וקונסול
- console.log מיותר
- debug prints שלא נחוצים
- error handling מיותר

## הערות:
- רק קבצים שאינם משפיעים על הפונקציונליות הבסיסית
- לשמור backup לפני מחיקה
- לבדוק שכל מה שנמחק לא בשימוש
- לעדכן import statements אחרי מחיקה