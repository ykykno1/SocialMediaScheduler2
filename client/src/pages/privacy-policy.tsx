import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'מדיניות פרטיות - רובוט שבת';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            מדיניות פרטיות - רובוט שבת
          </h1>
          
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. מבוא</h2>
              <p>
                רובוט שבת (robotshabat.com) מתחייב להגן על פרטיותכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם בעת שימוש באפליקציה שלנו לניהול תוכן ברשתות חברתיות בזמן שבת וחגים.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. מידע שאנו אוספים</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 מידע אישי</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>כתובת דואר אלקטרוני (להרשמה ולהתחברות)</li>
                <li>שם משתמש</li>
                <li>העדפות זמני שבת ומיקום</li>
                <li>מידע על מנוי (אם רלוונטי)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">2.2 מידע מרשתות חברתיות</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li><strong>YouTube:</strong> רשימת סרטונים, מצב פרטיות, כותרות וסמינים</li>
                <li><strong>Facebook:</strong> פוסטים אישיים ודפי עסק (בהתאם לאישורכם)</li>
                <li><strong>Instagram:</strong> פוסטים וסטוריז (בהתאם לאישורכם)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">2.3 מידע טכני</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>כתובת IP</li>
                <li>סוג דפדפן ומערכת הפעלה</li>
                <li>לוגי שימוש לצורכי שיפור השירות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. כיצד אנו משתמשים במידע</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 תפקוד האפליקציה</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>הסתרה אוטומטית של תוכן ברשתות חברתיות לפני שבת/חגים</li>
                <li>שחזור אוטומטי של תוכן לאחר צאת שבת/חגים</li>
                <li>ניהול העדפות זמנים אישיות</li>
                <li>מעקב אחר מצב הסתרה/הצגה של התוכן</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">3.2 שירותי משתמש</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>אימות וניהול חשבונות משתמשים</li>
                <li>מתן תמיכה טכנית</li>
                <li>עדכונים על השירות</li>
                <li>שיפור חוויית המשתמש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. שיתוף מידע</h2>
              <p className="mb-4">
                <strong>אנו לא מוכרים, משתפים או מעבירים את המידע האישי שלכם לצדדים שלישיים</strong> למעט במקרים הבאים:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>בהתאם לדרישות חוק</li>
                <li>להגנה על זכויותינו החוקיות</li>
                <li>עם ספקי שירות הכרחיים לתפעול האפליקציה (תחת הסכמי סודיות)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. אבטחת מידע</h2>
              <p className="mb-4">אנו מיישמים אמצעי אבטחה מתקדמים להגנה על המידע שלכם:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>הצפנת AES-256 לטוקני גישה</li>
                <li>חיבורי HTTPS מוצפנים בלבד</li>
                <li>אחסון מאובטח בבסיסי נתונים מוגנים</li>
                <li>גישה מוגבלת למידע רק לצוות מורשה</li>
                <li>עדכוני אבטחה שוטפים</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. הרשאות רשתות חברתיות</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 YouTube</h3>
              <p className="mb-3">האפליקציה מבקשת גישה ל:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li><code>youtube.readonly</code> - קריאת פרטי סרטונים</li>
                <li><code>youtube</code> - שינוי מצב פרטיות סרטונים</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                שימוש במידע YouTube כפוף גם ל
                <a href="https://www.youtube.com/t/terms" className="text-blue-600 hover:underline"> תנאי השירות של YouTube</a> ו
                <a href="http://www.google.com/policies/privacy" className="text-blue-600 hover:underline">מדיניות הפרטיות של Google</a>.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">6.2 Facebook ו-Instagram</h3>
              <p className="mb-3">האפליקציה מבקשת גישה ל:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>פרופיל אישי ופוסטים</li>
                <li>דפי עסק (בהתאם לבחירה)</li>
                <li>ניהול תוכן ומצב פרטיות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. זכויות המשתמש</h2>
              <p className="mb-4">לכם יש הזכויות הבאות:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li><strong>צפייה:</strong> לראות איזה מידע אוספים עליכם</li>
                <li><strong>עדכון:</strong> לתקן מידע לא מדויק</li>
                <li><strong>מחיקה:</strong> לבקש מחיקת החשבון והמידע</li>
                <li><strong>התנתקות:</strong> לנתק גישה לרשתות חברתיות בכל עת</li>
                <li><strong>ייצוא:</strong> לקבל עותק של המידע שלכם</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. עוגיות (Cookies)</h2>
              <p className="mb-4">האתר משתמש בעוגיות לצורכים הבאים:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>שמירת מצב התחברות</li>
                <li>העדפות משתמש</li>
                <li>שיפור חוויית הגלישה</li>
                <li>אנליטיקה בסיסית (ללא זיהוי אישי)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. שינויים במדיניות</h2>
              <p>
                אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. שינויים מהותיים יימסרו למשתמשים באמצעות דואר אלקטרוני או הודעה באתר. המשך השימוש באפליקציה לאחר השינויים מהווה הסכמה למדיניות המעודכנת.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. צור קשר</h2>
              <p className="mb-4">לשאלות או בקשות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו:</p>
              <ul className="list-none space-y-2">
                <li><strong>דואר אלקטרוני:</strong> privacy@robotshabat.com</li>
                <li><strong>אתר:</strong> <a href="https://robotshabat.com" className="text-blue-600 hover:underline">robotshabat.com</a></li>
              </ul>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                <strong>תאריך עדכון אחרון:</strong> 14 ביולי 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                מדיניות פרטיות זו נכתבה בהתאם לתקנת הגנת הפרטיות הכללית (GDPR) ולחוק הגנת הפרטיות הישראלי.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}