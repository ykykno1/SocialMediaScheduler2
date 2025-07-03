import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Clock, Users, Zap } from 'lucide-react';
import { Link } from 'wouter';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">רובוט שבת</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          פתרון מתקדם לניהול תוכן ברשתות חברתיות במהלך שבת וחגים
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>בטיחות ואבטחה</CardTitle>
            <CardDescription>
              הצפנת נתונים מתקדמת וחיבור מאובטח לכל הפלטפורמות
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Clock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>תזמון אוטומטי</CardTitle>
            <CardDescription>
              הסתרה ושחזור אוטומטיים לפי זמני שבת מדויקים
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>תמיכה בכל הפלטפורמות</CardTitle>
            <CardDescription>
              יוטיוב, פייסבוק, אינסטגרם ועוד פלטפורמות בקרוב
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">איך זה עובד?</CardTitle>
          <CardDescription>
            רובוט שבת מתחבר לחשבונות הרשתות החברתיות שלך ומנהל אוטומטית את הגלישות שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">התחברות לפלטפורמות</h3>
                <p className="text-muted-foreground">
                  חבר את חשבונות יוטיוב, פייסבוק ואינסטגרם שלך באופן מאובטח
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">הגדרת העדפות</h3>
                <p className="text-muted-foreground">
                  בחר את המיקום שלך להגדרת זמני שבת וקבע העדפות אישיות
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">ניהול אוטומטי</h3>
                <p className="text-muted-foreground">
                  המערכת מסתירה ומשחזרת תוכן אוטומטית לפי זמני שבת וחגים
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">פרטים טכניים</CardTitle>
          <CardDescription>
            מידע על הטכנולוגיות והפלטפורמות הנתמכות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">פלטפורמות נתמכות:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• יוטיוב (YouTube Data API v3)</li>
                <li>• פייסבוק (Graph API v22.0)</li>
                <li>• אינסטגרם (דרך Facebook Business API)</li>
                <li>• טיקטוק (בפיתוח)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">תכונות אבטחה:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• הצפנת AES-256-GCM</li>
                <li>• OAuth 2.0 מאובטח</li>
                <li>• אימות JWT</li>
                <li>• הגנה על נתונים אישיים</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">מוכן להתחיל?</h2>
        <p className="text-muted-foreground mb-6">
          הצטרף למאות משתמשים המנהלים את הנוכחות הדיגיטלית שלהם בצורה חכמה
        </p>
        <div className="space-x-4 rtl:space-x-reverse">
          <Button asChild>
            <Link href="/pricing">
              צפה במחירים
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">חזור לדף הבית</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;