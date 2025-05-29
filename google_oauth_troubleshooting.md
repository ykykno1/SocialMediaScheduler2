# פתרון בעיות OAuth עם Google - YouTube API

## הבעיה הנוכחית
- קבלת שגיאת 403 Forbidden בעת ניסיון התחברות
- כל ההגדרות נראות תקינות אבל עדיין לא עובד

## רשימת בדיקות

### 1. OAuth Consent Screen
- [x] במצב Testing
- [x] האימייל שלך רשום כ-Test user
- [ ] האם יש domain verification? (עלול להיות חסר)

### 2. Credentials - OAuth 2.0 Client
- [x] Client ID ו-Secret מוגדרים
- [x] Authorized redirect URIs מכילים:
  - https://workspace.ykykyair.repl.co/auth-callback.html
  - http://localhost:5000/auth-callback.html

### 3. APIs & Services
- [x] YouTube Data API v3 מופעל
- [ ] בדיקת מכסות (Quotas)

### 4. בעיות אפשריות
1. **Application Type**: ייתכן שהאפליקציה מוגדרת כ-"Desktop" במקום "Web"
2. **JavaScript Origins**: חסרים authorized origins
3. **Redirect URI Format**: בעיה בפורמט הכתובת
4. **API Restrictions**: הגבלות על השימוש ב-API

## פתרונות לנסות

### פתרון 1: בדיקת Application Type
```
Google Console → Credentials → OAuth 2.0 Client ID
Application type חייב להיות: Web application
```

### פתרון 2: Authorized JavaScript Origins
```
הוסף:
- https://workspace.ykykyair.repl.co
- http://localhost:5000
```

### פתרון 3: Debug URL
נבדוק אם הבעיה היא ב-URL עצמו על ידי פתיחה ידנית בדפדפן.