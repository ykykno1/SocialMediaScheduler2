# מדריך תיקון Zoho SMTP

## הבעיה הנוכחית
**שגיאה:** `535 Authentication Failed`
**סיבה:** Zoho דורש הגדרות אבטחה מיוחדות למיילים של דומיין מותאם

## פתרונות מומלצים (בסדר עדיפות)

### 1. הפעלת App Password (הפתרון הטוב ביותר)
1. התחבר לחשבון Zoho שלך
2. לך ל: **Account Settings** → **Security** → **App Passwords**
3. צור **App Password** חדש עבור "Mail Application"
4. השתמש ב-App Password במקום הסיסמה הרגילה
5. עדכן את `EMAIL_PASS` עם ה-App Password החדש

### 2. הפעלת IMAP/SMTP Access
1. התחבר ל-Zoho Mail
2. לך ל: **Settings** → **Mail Accounts** → **IMAP/POP Access**
3. **הפעל IMAP Access**
4. **הפעל SMTP Access**
5. שמור הגדרות

### 3. בדיקת הגדרות דומיין
1. ודא שהדומיין `robotshabat.com` מאומת במלואו ב-Zoho
2. בדוק ש-MX Records מוגדרים נכון
3. ודא שאין מגבלות IP או גיאוגרפיות

### 4. הגדרות SMTP מדויקות לZoho
```
Host: smtp.zoho.com
Port: 587 (מומלץ)
Security: STARTTLS
Authentication: Normal password או App Password
```

## בדיקה מהירה
אם יש לך גישה לחשבון Zoho:
1. נסה להתחבר ל-Zoho Mail דרך לקוח מייל רגיל (Outlook, Apple Mail)
2. אם זה לא עובד - הבעיה בהגדרות הבסיסיות
3. אם זה עובד - הבעיה בהגדרות הקוד

## אלטרנטיבה מהירה - Gmail
אם Zoho ממשיך לא לעבוד, אפשר לעבור ל-Gmail:
1. צור Gmail App Password
2. עדכן את השדות:
   - `EMAIL_HOST`: smtp.gmail.com
   - `EMAIL_PORT`: 587
   - `EMAIL_USER`: yourname@gmail.com
   - `EMAIL_PASS`: [App Password]
   - `EMAIL_FROM`: yourname@gmail.com

## פתרון זמני - Gmail עם כתובת מותאמת
1. השתמש ב-Gmail SMTP
2. הגדר `EMAIL_FROM` כ: `no-reply@robotshabat.com`
3. Gmail יאפשר לשלוח מכתובת מותאמת (עם אימות מתאים)

## הוראות עדכון
לאחר שתקבל App Password או תתקן את ההגדרות, עדכן:
```
EMAIL_PASS=[App Password החדש]
```

המערכת תתחיל לעבוד מיד לאחר עדכון הסיסמה.