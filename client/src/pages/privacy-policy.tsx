export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">מדיניות פרטיות - שומר שבת</h1>
        
        <div className="prose prose-lg max-w-none text-right" dir="rtl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. מבוא</h2>
            <p className="mb-4">
              אפליקציית "שומר שבת" מיועדת לעזור למשתמשים יהודים לנהל את התוכן שלהם ברשתות חברתיות 
              במהלך השבת. אנו מחויבים להגן על הפרטיות שלכם ולהשתמש בנתונים שלכם באופן אחראי.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. איזה מידע אנחנו אוספים</h2>
            <ul className="list-disc pr-6 mb-4">
              <li>מידע חשבון מרשתות חברתיות (YouTube, Facebook, Instagram)</li>
              <li>רשימת הסרטונים והפוסטים שלכם</li>
              <li>הגדרות זמני שבת (כניסה ויציאה)</li>
              <li>העדפות אוטומציה</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. איך אנחנו משתמשים במידע</h2>
            <ul className="list-disc pr-6 mb-4">
              <li>לשנות הגדרות פרטיות של התוכן שלכם (הסתרה/שחזור)</li>
              <li>לתזמן פעולות אוטומטיות לפי זמני השבת</li>
              <li>לספק לכם דוחות על הפעילות</li>
              <li>לשפר את השירות</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. אבטחת מידע</h2>
            <p className="mb-4">
              אנו משתמשים בשיטות אבטחה מתקדמות כולל הצפנה ואימות מאובטח. 
              טוקני הגישה לרשתות החברתיות מאוחסנים בצורה מוצפנת ומאובטחת.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. שיתוף מידע עם צדדים שלישיים</h2>
            <p className="mb-4">
              איננו משתפים את המידע שלכם עם צדדים שלישיים למטרות פרסום או מסחר. 
              אנו משתמשים רק ב-APIs הרשמיים של הפלטפורמות (YouTube, Facebook, Instagram) 
              כדי לבצע את הפעולות שביקשתם.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. זכויותיכם</h2>
            <ul className="list-disc pr-6 mb-4">
              <li>זכות לגשת למידע האישי שלכם</li>
              <li>זכות לתקן מידע שגוי</li>
              <li>זכות למחוק את החשבון שלכם ואת כל הנתונים</li>
              <li>זכות לבטל הרשאות לרשתות חברתיות</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. מחיקת נתונים</h2>
            <p className="mb-4">
              לבקשת מחיקת כל הנתונים שלכם, אנא פנו אלינו בכתובת:
              <br />
              <strong>ykyk.yair@gmail.com</strong>
              <br />
              או השתמשו בעמוד המחיקה: 
              <a href="/data-deletion" className="text-blue-600 underline ml-2">
                הוראות מחיקת נתונים
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. עדכונים למדיניות</h2>
            <p className="mb-4">
              מדיניות זו עשויה להתעדכן מעת לעת. נודיע לכם על שינויים משמעותיים.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. יצירת קשר</h2>
            <p className="mb-4">
              לשאלות או בקשות בנוגע למדיניות הפרטיות, אנא פנו אלינו:
              <br />
              <strong>Email:</strong> ykyk.yair@gmail.com
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-600">
            <p>עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}