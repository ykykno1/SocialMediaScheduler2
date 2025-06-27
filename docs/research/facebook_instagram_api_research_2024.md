# Facebook & Instagram API Research - December 2024

## מצב נוכחי - מה שמצאנו:

### Facebook
- ✅ **Facebook Login** - עובד
- ✅ **קריאת Posts** - עובד מעולה  
- ❌ **Facebook Pages API** - מחזיר מערך ריק: `{"data": []}`
- ❓ **הסתרת Posts** - זמין אבל דורש אישור פלטפורמה

### Instagram
- ❌ **Instagram Basic Display API** - הוקפא בספטמבר 2024
- ❓ **Instagram Graph API** - עדיין זמין לעסקים
- 💡 **רעיון חדש:** שינוי הגדרות פרטיות (Private/Public)

## הבעיות שצריך לפתור:

### 1. Facebook Pages Issue
**בעיה:** `GET /api/facebook/pages` מחזיר `{"data": []}`
**סיבות אפשריות:**
- חסרות הרשאות `pages_read_engagement` או `pages_manage_posts`
- המשתמש לא מנהל אף עמוד פייסבוק
- צריך App Review לגישה לעמודים

### 2. Instagram Access
**בעיה:** Instagram Basic Display API לא זמין יותר
**פתרונות אפשריים:**
1. **Instagram Graph API** (דרך Facebook Business)
2. **שינוי הגדרות פרטיות** (Private/Public toggle)
3. **Instagram Content Publishing API**

## מחקר נדרש:

### Facebook API Updates 2024
1. איך לקבל גישה לעמודי Facebook
2. אילו הרשאות נדרשות היום
3. מה השתנה ב-Facebook Graph API v22.0

### Instagram API Alternatives
1. Instagram Graph API - מה זמין לאפליקציות חדשות
2. האם יש API לשינוי הגדרות פרטיות  
3. Instagram Content Publishing - אפשרויות

### App Review Requirements
1. מה נדרש לאישור Facebook Pages
2. מה נדרש לאישור Instagram
3. איך להגיש בקשה לשמירת שבת (religious/cultural use case)