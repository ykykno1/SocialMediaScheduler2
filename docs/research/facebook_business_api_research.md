# Facebook Business API Research

## Overview
בדיקת אפשרות לשימוש ב-Business API של פייסבוק כדי לעקוף את מגבלות API הרגיל של פייסבוק (v22.0).

## שיטות אפשריות לניהול עמודי פייסבוק

### 1. Business Manager API
פייסבוק מציעה API ייעודי למנהלי עסקים, שעשוי לאפשר גישה נרחבת יותר לניהול עמודים:

```
https://graph.facebook.com/v22.0/{business-id}/owned_pages
```

דורש הרשאות:
- `business_management`
- אישור של בעל העסק

### 2. Page Publishing Status
ניתן לנסות לשלוט בסטטוס הפרסום של העמוד באמצעות הנתיב:

```
https://graph.facebook.com/v22.0/{page-id}?is_published=false
```

לפי התיעוד, זה דורש הרשאת `pages_manage_metadata` שכרגע מוגבלת בגרסה 22.0.

### 3. Page Visibility
ניתן לנסות לשנות את נראות העמוד באמצעות שדה ה-`published` של העמוד:

```js
// To unpublish a page
fetch('https://graph.facebook.com/v22.0/{page-id}', {
  method: 'POST',
  body: new URLSearchParams({
    'published': 'false',
    'access_token': '{page-access-token}'
  })
});

// To publish a page
fetch('https://graph.facebook.com/v22.0/{page-id}', {
  method: 'POST',
  body: new URLSearchParams({
    'published': 'true',
    'access_token': '{page-access-token}'
  })
});
```

### 4. Facebook Marketing API
Marketing API של פייסבוק מיועד בעיקר לניהול מודעות, אבל יש לו חלק מהפונקציונליות גם לניהול דפים:

```
https://graph.facebook.com/v22.0/act_{ad_account_id}/campaigns
```

דורש הרשאות מיוחדות כמו `ads_management`.

## אפשרויות יישום

1. **בקשת אישור מיוחד מפייסבוק** - ניתן לבקש אישור מיוחד עבור ההרשאות המתקדמות כמו `pages_manage_metadata`. זה דורש סקירה של פייסבוק והצגת שימוש לגיטימי.

2. **שימוש בהרשאות עסקיות** - אם המשתמש יש לו חשבון עסקי בפייסבוק, ייתכן שנוכל לנצל את ההרשאות המורחבות הזמינות שם.

3. **פתרון היברידי** - שילוב בין תזמון ידני לבין התראות אוטומטיות. האפליקציה תשלח תזכורות למשתמש להסתיר או לחשוף את העמודים, במקום לעשות זאת באופן אוטומטי.

## סיכום ומסקנות

מהבדיקה עולה שה-API העסקי עשוי לספק גישה נרחבת יותר, אך עדיין דורש:
1. שהמשתמש יהיה בעל חשבון עסקי בפייסבוק
2. אישור מיוחד מפייסבוק לשימוש בהרשאות הנדרשות
3. מימוש שונה מהותית מהגישה הנוכחית

יש לשקול אם הגישה הזו תהיה ישימה עבור משתמשי היעד של האפליקציה.