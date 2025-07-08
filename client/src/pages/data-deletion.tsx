import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              חזור לדף הבית
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center">מחיקת נתונים - שומר שבת</h1>
        
        <div className="prose prose-lg max-w-none text-right" dir="rtl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">איך למחוק את הנתונים שלכם</h2>
            <p className="mb-4">
              אם אתם רוצים למחוק את כל הנתונים שלכם מהאפליקציה "שומר שבת", 
              אתם יכולים לעשות זאת בשתי דרכים:
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">דרך 1: מחיקה דרך האפליקציה</h2>
            <ol className="list-decimal pr-6 mb-4">
              <li className="mb-2">היכנסו לאפליקציה "שומר שבת"</li>
              <li className="mb-2">לכו לעמוד "הגדרות"</li>
              <li className="mb-2">לחצו על "נתק כל החשבונות"</li>
              <li className="mb-2">לחצו על "מחק את כל הנתונים שלי"</li>
              <li className="mb-2">אשרו את המחיקה</li>
            </ol>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm">
                <strong>שימו לב:</strong> פעולה זו תמחק את כל ההגדרות, ההיסטוריה והחיבורים לרשתות החברתיות באופן מיידי.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">דרך 2: בקשה דרך אימייל</h2>
            <p className="mb-4">
              שלחו אימייל לכתובת: <strong>ykyk.yair@gmail.com</strong>
            </p>
            <p className="mb-4">
              בנושא: "בקשה למחיקת נתונים - שומר שבת"
            </p>
            <p className="mb-4">
              כללו במייל:
            </p>
            <ul className="list-disc pr-6 mb-4">
              <li>השם המלא שלכם</li>
              <li>כתובת האימייל שרשומה באפליקציה</li>
              <li>בקשה ברורה למחיקת הנתונים</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">מה יימחק?</h2>
            <ul className="list-disc pr-6 mb-4">
              <li>כל ההגדרות האישיות שלכם</li>
              <li>רשימת הסרטונים והפוסטים שנשמרה</li>
              <li>היסטוריית הפעולות</li>
              <li>טוקני הגישה לרשתות החברתיות</li>
              <li>העדפות זמני השבת</li>
              <li>כל נתון אחר שנשמר באפליקציה</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">זמן טיפול</h2>
            <p className="mb-4">
              מחיקה דרך האפליקציה - מיידית
              <br />
              מחיקה דרך אימייל - תוך 30 יום מקבלת הבקשה
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">הסרת הרשאות מרשתות חברתיות</h2>
            <p className="mb-4">
              בנוסף למחיקת הנתונים מהאפליקציה שלנו, מומלץ גם להסיר את ההרשאות מהרשתות החברתיות:
            </p>
            <ul className="list-disc pr-6 mb-4">
              <li><strong>YouTube:</strong> Google Account → Security → Third-party apps with account access</li>
              <li><strong>Facebook:</strong> Settings → Apps and Websites → Active Apps</li>
              <li><strong>Instagram:</strong> Settings → Apps and Websites</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">שאלות ובעיות</h2>
            <p className="mb-4">
              אם יש לכם שאלות או בעיות עם תהליך המחיקה, אנא פנו אלינו:
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