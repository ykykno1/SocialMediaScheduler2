import { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'תנאי שימוש - רובוט שבת';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            תנאי שימוש - רובוט שבת
          </h1>
          
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. מבוא והסכמה</h2>
              <p>
                ברוכים הבאים לרובוט שבת (robotshabat.com). השימוש באפליקציה מהווה הסכמה מלאה לתנאים אלה. אם אינכם מסכימים לתנאים כלשהם, אנא הימנעו משימוש בשירות.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. תיאור השירות</h2>
              <p className="mb-4">רובוט שבת הוא שירות המיועד לעזור למשתמשים:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>להסתיר תוכן ברשתות חברתיות (YouTube, Facebook, Instagram) לפני שבת וחגים</li>
                <li>לשחזר תוכן לאחר צאת שבת וחגים</li>
                <li>לנהל העדפות זמנים אישיות</li>
                <li>לקבל התראות על פעולות המערכת</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. רישום וחשבון משתמש</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 דרישות רישום</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>גיל מינימלי: 13 שנים</li>
                <li>מידע נכון ומעודכן</li>
                <li>כתובת דואר אלקטרוני תקפה</li>
                <li>סיסמה חזקה ומאובטחת</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">3.2 אחריות המשתמש</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>שמירה על סודיות פרטי ההתחברות</li>
                <li>עדכון מידע אישי כנדרש</li>
                <li>הודעה על שימוש לא מורשה בחשבון</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. הרשאות רשתות חברתיות</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 YouTube</h3>
              <p className="mb-3">בחיבור ל-YouTube, אתם מאשרים לרובוט שבת:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>לצפות ברשימת הסרטונים שלכם</li>
                <li>לשנות מצב פרטיות של סרטונים (פרטי/ציבורי)</li>
                <li>לקבל מידע על סרטונים (כותרת, תמונה ממוזערת)</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">4.2 Facebook ו-Instagram</h3>
              <p className="mb-3">בחיבור לפייסבוק/אינסטגרם, אתם מאשרים לרובוט שבת:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>לצפות בפוסטים ובדפי עסק</li>
                <li>לנהל מצב פרטיות של תוכן</li>
                <li>לקבל מידע על הפרופיל הציבורי</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. תשלומים ומנויים</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 סוגי מנוי</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li><strong>חינמי:</strong> ניהול YouTube בלבד</li>
                <li><strong>פרימיום:</strong> גישה לכל הפלטפורמות והתכונות</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">5.2 תנאי תשלום</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>התשלומים מעובדים באמצעות Stripe</li>
                <li>חיוב מחזורי (חודשי/שנתי) עד לביטול</li>
                <li>ללא החזרים על תקופות שכבר שולמו</li>
                <li>ביטול מנוי - השירות ימשך עד סוף התקופה ששולמה</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. שימוש מותר ואסור</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 שימוש מותר</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>ניהול תוכן אישי או עסקי שלכם</li>
                <li>שימוש בהתאם לכללי הדת והמסורת</li>
                <li>שיתוף חוויות עם משתמשים אחרים</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">6.2 שימוש אסור</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>שימוש לניהול חשבונות של אחרים ללא רשות</li>
                <li>פעילות בלתי חוקית או מזיקה</li>
                <li>ניסיון לפרוץ או לגשת ללא רשות למערכות</li>
                <li>שיתוף פרטי גישה עם אחרים</li>
                <li>שימוש אוטומטי או בוטים (למעט התכונות המובנות)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. זמינות השירות</h2>
              <p className="mb-4">אנו שואפים לזמינות מירבית, אך:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>אין ערובה לזמינות 100%</li>
                <li>תחזוקות מתוכננות יבוצעו עם הודעה מוקדמת</li>
                <li>השירות תלוי בזמינות של רשתות חברתיות חיצוניות</li>
                <li>אנו לא אחראים לשינויים בAPI של רשתות חברתיות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. מגבלות אחריות</h2>
              <p className="mb-4">השירות מוצע "כפי שהוא". אנו לא אחראים ל:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>אובדן תוכן או נתונים</li>
                <li>נזקים עקיפים או תוצאתיים</li>
                <li>הפרעות בשירותי רשתות חברתיות</li>
                <li>שגיאות בזמני שבת וחגים (למרות המאמצים לדיוק)</li>
                <li>שימוש לא נכון של המשתמש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. הפרת תנאים</h2>
              <p className="mb-4">במקרה של הפרת תנאים, אנו רשאים:</p>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>להשעות או לחסום חשבון</li>
                <li>למחוק תוכן לא מתאים</li>
                <li>לנקוט צעדים משפטיים</li>
                <li>לסרב מתן שירות בעתיד</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. סיום השירות</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 ביטול על ידי המשתמש</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>ניתן לבטל מנוי בכל עת מהגדרות החשבון</li>
                <li>הנתונים יישמרו 30 יום לאחר הביטול</li>
                <li>ניתן לבקש מחיקה מיידית</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">10.2 סיום על ידינו</h3>
              <ul className="list-disc list-inside space-y-2 mr-6">
                <li>הודעה של 30 יום על הפסקת השירות</li>
                <li>אפשרות לייצא נתונים לפני הסגירה</li>
                <li>החזר יחסי למנויים שנותרו</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. שינויים בתנאים</h2>
              <p>
                אנו עשויים לעדכן תנאים אלה מעת לעת. שינויים מהותיים יימסרו בדואר אלקטרוני ו/או הודעה באפליקציה לפחות 15 יום מראש. המשך השימוש לאחר השינויים מהווה הסכמה לתנאים החדשים.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. דין וסמכות</h2>
              <p>
                תנאים אלה כפופים לדיני מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים בישראל. במידה ותנאי כלשהו יימצא בלתי תקף, יתר התנאים יישארו בתוקפם.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. צור קשר</h2>
              <p className="mb-4">לשאלות או בעיות בנוגע לתנאי השימוש:</p>
              <ul className="list-none space-y-2">
                <li><strong>תמיכה:</strong> support@robotshabat.com</li>
                <li><strong>כללי:</strong> info@robotshabat.com</li>
                <li><strong>אתר:</strong> <a href="https://robotshabat.com" className="text-blue-600 hover:underline">robotshabat.com</a></li>
              </ul>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                <strong>תאריך עדכון אחרון:</strong> 14 ביולי 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                תנאי שימוש אלה נכתבו בהתאם לדיני הגנת הצרכן והדין הישראלי.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}