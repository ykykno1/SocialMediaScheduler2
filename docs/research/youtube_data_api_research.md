# YouTube Data API v3 - מחקר ויישום

## סקירה כללית

YouTube Data API v3 מאפשר לאפליקציות לגשת לפונקציות של YouTube כמו:
- קריאת פרטי סרטונים
- עדכון הגדרות פרטיות של סרטונים
- ניהול playlists
- קבלת נתונים על ערוצים

## Authentication & Authorization

### OAuth 2.0 Scopes נדרשים:
- `https://www.googleapis.com/auth/youtube.readonly` - קריאה בלבד
- `https://www.googleapis.com/auth/youtube` - קריאה וכתיבה מלאה
- `https://www.googleapis.com/auth/youtube.force-ssl` - גישה מאובטחת

### תהליך ההתחברות:
1. יצירת OAuth 2.0 credentials בגוגל קונסול
2. הפניה למשתמש לדף הרשאות של גוגל
3. קבלת authorization code
4. החלפת הקוד לטוקן גישה

## עבודה עם Videos

### קבלת רשימת סרטונים של המשתמש:
```javascript
const response = await youtube.videos.list({
  part: ['snippet', 'status'],
  mine: true,
  maxResults: 50
});
```

### עדכון פרטיות סרטון:
```javascript
await youtube.videos.update({
  part: ['status'],
  resource: {
    id: videoId,
    status: {
      privacyStatus: 'private' // או 'public', 'unlisted'
    }
  }
});
```

## מבנה הנתונים

### Video Object:
```javascript
{
  id: "string",
  snippet: {
    title: "string",
    description: "string",
    publishedAt: "datetime",
    thumbnails: { ... }
  },
  status: {
    privacyStatus: "public|private|unlisted",
    uploadStatus: "processed|failed|uploaded",
    rejectionReason: "string"
  }
}
```

## הגבלות ומכסות

- **יומית**: 10,000 units per day (ברירת מחדל)
- **לכל בקשה**: עד 50 פריטים
- **Rate limit**: כ-100 בקשות לשנייה

### עלויות Units:
- `videos.list`: 1 unit
- `videos.update`: 50 units
- `channels.list`: 1 unit

## שגיאות נפוצות

### 403 Forbidden:
- API לא מופעל בפרויקט
- חסרות הרשאות OAuth
- מכסה יומית הסתיימה
- הדומיין לא מורשה

### 400 Bad Request:
- פרמטרים חסרים או שגויים
- videoId לא קיים
- פורמט שגוי בנתונים

### 401 Unauthorized:
- טוקן גישה פג תוקף
- טוקן לא תקין
- חסרות הרשאות מתאימות

## Best Practices

1. **Batch Operations**: קבץ עדכונים מרובים לבקשה אחת
2. **Error Handling**: טפל בשגיאות rate limit עם exponential backoff
3. **Token Refresh**: חדש טוקנים שפגו תוקף באופן אוטומטי
4. **Caching**: שמור נתונים במטמון להפחתת בקשות API

## יישום ל-Shabbat Robot

### פונקציונליות נדרשת:
1. **רשימת סרטונים**: קבלת כל הסרטונים של המשתמש
2. **הסתרת סרטונים**: שינוי מצב לפרטי
3. **שחזור סרטונים**: החזרה למצב הקודם
4. **שמירת מצב**: זכירת המצב המקורי לכל סרטון

### תהליך עבודה:
1. התחברות OAuth ליוטיוב
2. קבלת רשימת סרטונים עם מצב פרטיות נוכחי
3. שמירת המצב המקורי בזיכרון/דאטבייס
4. בכניסת שבת: שינוי כל הסרטונים לפרטיים
5. ביציאת שבת: החזרת כל סרטון למצבו המקורי

### אתגרים טכניים:
- **Rate Limits**: עבור ערוצים עם הרבה סרטונים
- **Quota Management**: ניהול מכסת 10,000 units
- **Error Recovery**: התמודדות עם כשלונות חלקיים
- **Token Management**: חידוש טוקנים באופן אוטומטי