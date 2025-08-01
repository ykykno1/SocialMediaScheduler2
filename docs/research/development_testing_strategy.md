# אסטרטגיית פיתוח ובדיקות - "רובוט שבת"

## מבנה סביבות העבודה

כדי לאפשר פיתוח יעיל לצד שמירה על עקרונות האפליקציה, נשתמש בשתי סביבות עבודה מובחנות:

### 1. סביבת פיתוח (Development Environment)

בסביבת הפיתוח, האפליקציה תכלול:

- **מצב פיתוח (Dev Mode)** עם אפשרות להפעיל את פונקציות ההסתרה והשחזור בכל זמן
- **סימולציית שבת** - אפשרות לדמות כניסה ויציאה של שבת לצורכי בדיקות
- **לוג מפורט** - תיעוד מורחב של כל פעולות ה-API וההתממשקות עם פייסבוק
- **כלים לבדיקות אוטומטיות** - סקריפטים שמדמים מחזור שלם של כניסת ויציאת שבת

### 2. סביבת ייצור (Production Environment)

בסביבת הייצור, האפליקציה:

- **תפעל רק בזמני שבת אמיתיים** - מחושבים לפי הלוח העברי ומיקום גיאוגרפי
- **ללא אפשרות לעקיפת המגבלות** - אין גישה למשתמשים רגילים להפעיל הסתרות מחוץ לזמני שבת
- **בקרת איכות מוגברת** - בדיקות נוספות לוודא שהאפליקציה פועלת רק בזמנים המוגדרים

## פיתוח ובדיקות

### יישום בסיס הקוד

1. **קוד משותף** - רוב הקוד יהיה משותף לשתי הסביבות
2. **מנגנון תנאי** - שער (gate) בקוד שיבדוק את מצב הסביבה ויאפשר פעולות בהתאם
3. **דגלי תכונות (Feature Flags)** - שליטה מרחוק על הפונקציונליות הזמינה

### תהליך הבדיקות

1. **בדיקות יחידה (Unit Tests)**
   - בדיקת מנגנון חישוב זמני השבת
   - בדיקת לוגיקת ההסתרה והשחזור
   - בדיקת טיפול בשגיאות API

2. **בדיקות אינטגרציה (Integration Tests)**
   - בדיקת התממשקות עם API של פייסבוק
   - בדיקת חישוב זמנים מול שירות מידע חיצוני

3. **בדיקות קצה-לקצה (End-to-End Tests)**
   - סימולציה של מחזור שבת שלם, מכניסת שבת ועד יציאתה
   - בדיקת תרחישי ביצוע במקרה של בעיות תקשורת או זמינות

4. **בדיקות עמידות (Resilience Tests)**
   - מה קורה אם ה-API של פייסבוק לא מגיב
   - טיפול במקרה של הפסקת חשמל או הפסקת אינטרנט באמצע תהליך

### יישום גישת הבקשה לפייסבוק

בבקשה לפייסבוק לאישור ההרשאות, נציג:

1. **את הגרסה הסופית המוגבלת** - עם הדגשה שבגרסה הסופית האפליקציה תפעל רק בזמני שבת

2. **הצהרה מפורשת** - שמסבירה כי לצורכי פיתוח ובדיקות בלבד, הגרסת הפיתוח כוללת אפשרות להפעלה ידנית

3. **תיעוד של אמצעי האבטחה** - שמונעים שימוש בגרסת הפיתוח על ידי משתמשי קצה

## לוח זמנים לפיתוח

1. **שלב 1: פיתוח בסיסי (2 שבועות)**
   - יישום מנגנון חישוב זמני שבת
   - פיתוח ממשק משתמש בסיסי

2. **שלב 2: אינטגרציה עם פייסבוק (3 שבועות)**
   - יישום התממשקות עם Graph API
   - פיתוח מנגנוני הסתרה ושחזור

3. **שלב 3: בדיקות וטיוב (2 שבועות)**
   - בדיקות יסודיות של כל רכיבי המערכת
   - טיוב ביצועים ושיפור חוויית משתמש

4. **שלב 4: הכנה לשחרור (1 שבוע)**
   - הכנת חומרי שיווק והסברה
   - הכנת מסמכי תמיכה למשתמשים

## סיכום

אסטרטגיית הפיתוח והבדיקות מאפשרת לנו:

1. **לפתח ולבדוק ביעילות** - ללא תלות בלוח זמנים של שבתות אמיתיות
2. **לשמור על יושרה** - באמצעות הקפדה על הפרדה ברורה בין סביבת פיתוח לסביבת ייצור
3. **להציג שקיפות מלאה לפייסבוק** - תוך הדגשת המגבלות המובנות במוצר הסופי

בדרך זו, נוכל לפתח אפליקציה אמינה ויעילה שעומדת בסטנדרטים המחמירים ביותר של פייסבוק, תוך כיבוד הדרישות הדתיות של קהל היעד שלנו.