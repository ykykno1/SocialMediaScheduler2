# מחקר הרשאות API של פייסבוק

## הרשאות הנדרשות לעדכון פוסטים

בהתבסס על תיעוד העדכני של פייסבוק, ההרשאות הבאות נדרשות כדי לשנות את הגדרות הפרטיות של פוסטים:

1. `publish_actions` - הרשאה זו הוצאה משימוש ב-2018. לא זמינה יותר.
2. `publish_pages` - הרשאה זו מיועדת לדפים, לא לפרופילים אישיים.
3. `user_posts` - מאפשרת קריאה בלבד של פוסטים.

## אפשרויות יישום

ישנן מספר אפשרויות שאנחנו יכולים לשקול:

### 1. בקשת הרשאות מיוחדות מפייסבוק

פייסבוק מאפשרת לפנות אליהם בבקשה לקבלת הרשאות מיוחדות שאינן זמינות באופן רגיל.
זה דורש:
- הגשת בקשת סקירה מיוחדת
- הסבר מפורט על מקרה השימוש
- מעבר תהליך בדיקה קפדני

### 2. שימוש ב-SDK רשמי של פייסבוק

ה-SDK הרשמי של פייסבוק עשוי לספק פתרונות שאינם זמינים דרך ה-Graph API הרגיל.

### 3. הנחיית המשתמש לשינוי ידני

הגישה שיישמנו כרגע - המערכת מסמנת פוסטים שיש להסתיר/לשחזר ומנחה את המשתמש לבצע את הפעולות באופן ידני.

## המלצות לשיפור

1. **שיפור חווית המשתמש בשינוי ידני**:
   - הוספת קישור ישיר לכל פוסט
   - הצגת הוראות ויזואליות לשינוי פרטיות

2. **שימוש ב-WebView**: 
   - יצירת ממשק משתמש שמנחה את המשתמש לבצע את השינויים בעצמו דרך ממשק פייסבוק מוטמע

3. **חקירת API שליחת מסרים**:
   - שימוש ב-API של פייסבוק לשליחת הודעות התראה למשתמש

## מסקנות

המגבלות של API פייסבוק נובעות משיקולי פרטיות ואבטחה. פייסבוק מגבילה במכוון את היכולת לשנות פרטיות של פוסטים באופן אוטומטי כדי להגן על משתמשים.

הפתרון המומלץ לטווח הקצר הוא להמשיך עם הגישה הנוכחית של סימולציה והנחיית המשתמש, תוך שיפור חווית המשתמש.