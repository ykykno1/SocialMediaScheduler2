# הגדרת OAuth Consent Screen - Google Cloud Console

## שלב 1: כניסה למסוף Google Cloud
1. עבור ל: https://console.cloud.google.com/
2. בחר את הפרויקט הנכון
3. עבור ל: APIs & Services > OAuth consent screen

## שלב 2: מידע כללי (General Information)

### App Information
```
App name: רובוט שבת
User support email: info@robotshabat.com
Developer contact information: info@robotshabat.com
```

### App Logo
```
קובץ: public/logo.png
גודל נדרש: 120x120px
פורמט: PNG
הערה: יש לשנות גודל של הלוגו הנוכחי
```

### App Domain
```
Application home page: https://robotshabat.com
Application privacy policy link: https://robotshabat.com/privacy-policy
Application terms of service link: https://robotshabat.com/terms-of-service
```

### Authorized Domains
```
robotshabat.com
social-media-scheduler-ykykyair.replit.app
```

## שלב 3: Scopes (היקפי הרשאה)

### Add or Remove Scopes
יש לבחור את ה-scopes הבאים:
```
https://www.googleapis.com/auth/youtube
https://www.googleapis.com/auth/youtube.force-ssl
```

### Scope Justification
```
הגישה ליוטיוב נדרשת כדי לאפשר למשתמשים יהודים שומרי מצוות לנהל את מצב הפרטיות של הסרטונים שלהם באופן אוטומטי בזמני שבת וחגים. זה מאפשר שמירה על קדושת השבת במרחב הדיגיטלי.
```

## שלב 4: Test Users (למצב פיתוח)
במצב Testing, יש להוסיף:
```
yk@gmail.com
info@robotshabat.com
```

## שלב 5: App Description

### Public App Description
```
רובוט שבת הוא אפליקציה המיועדת למשתמשים יהודים שומרי מצוות. האפליקציה מאפשרת ניהול אוטומטי של תוכן ברשתות חברתיות (יוטיוב, פייסבוק, אינסטגרם) בזמני שבת וחגים.

התכונות העיקריות:
• הסתרת סרטונים ביוטיוב אוטומטית לפני כניסת השבת
• החזרת הסרטונים לציבורי בצאת השבת
• שימוש בזמני חב"ד המדויקים ביותר
• תמיכה בהעדפות זמנים אישיות
• ממשק בעברית מותאם לקהל היעד
• אבטחת מידע ופרטיות מלאה

האפליקציה מכבדת את הערכים הדתיים ומאפשרת למשתמשים לשמור על קדושת השבת גם במרחב הדיגיטלי.
```

### App Description (English)
```
Shabbat Robot is an application designed for observant Jewish users. The app enables automatic content management on social media platforms (YouTube, Facebook, Instagram) during Shabbat and Jewish holidays.

Main features:
• Automatic hiding of YouTube videos before Shabbat begins
• Restoring videos to public after Shabbat ends
• Using the most accurate Chabad times
• Support for personal timing preferences
• Hebrew interface tailored to the target audience
• Complete data security and privacy

The application respects religious values and allows users to maintain the sanctity of Shabbat in the digital space.
```

## שלב 6: Links and Contact

### Support Email
```
info@robotshabat.com
```

### Privacy Policy URL
```
https://robotshabat.com/privacy-policy
```

### Terms of Service URL
```
https://robotshabat.com/terms-of-service
```

## שלב 7: Publishing

### App Verification Requirements
לאחר מילוי כל השדות:
1. לחץ על "Submit for Verification"
2. צרף את סרטון ההדגמה
3. מלא את הטופס המפורט
4. המתן לאישור (2-6 שבועות)

### Demo Video Requirements
```
URL: [קישור לסרטון ביוטיוב - unlisted]
מקסימום: 10 דקות
תוכן: הדגמת תהליך OAuth ותכונות מפתח
שפה: עברית עם הסברים באנגלית לצורך הבנה
```

---

## הערות חשובות:

### לפני ההגשה:
1. ודא שכל הקישורים פועלים
2. בדק שמדיניות הפרטיות מלאה
3. ודא שהאפליקציה יציבה בייצור
4. הכן את סרטון ההדגמה

### במהלך תהליך האישור:
- Google עשויה לבקש מסמכים נוספים
- יתכנו שאלות נוספות על השימוש ב-scopes
- התהליך יכול לקחת 2-6 שבועות

### לאחר האישור:
- האפליקציה תהיה זמינה לכל המשתמשים
- לא יהיו הגבלות על מספר המשתמשים
- אפשרות להוסיף scopes נוספים בעתיד