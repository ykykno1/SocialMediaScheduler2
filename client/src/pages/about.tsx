import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Clock, Users, Zap } from 'lucide-react';
import { Link } from 'wouter';

interface AboutPageProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onShowSettings, onShowHistory }) => {
  return (
    <Layout onShowSettings={onShowSettings} onShowHistory={onShowHistory}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-semibold ios-title mb-4 text-foreground">אודות רובוט שבת</h1>
          <p className="ios-subtitle text-xl text-muted-foreground max-w-2xl mx-auto">
            האפליקציה המתקדמת לניהול תוכן ברשתות חברתיות במהלך שבת ומועדים
          </p>
        </div>

        {/* Mission Card */}
        <Card className="ios-card">
          <CardHeader>
            <CardTitle className="ios-title text-2xl">המשימה שלנו</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="ios-body text-lg leading-relaxed">
              רובוט שבת נוצר כדי לעזור ליהודים שומרי מצוות לנהל את הנוכחות הדיגיטלית שלהם 
              באופן אוטומטי במהלך שבת ומועדים. האפליקציה מאפשרת הסתרה ושחזור אוטומטי של תוכן 
              ברשתות החברתיות, תוך שמירה על הקדושה והזמן המיוחד של השבת.
            </p>
            <p className="ios-body text-lg leading-relaxed">
              אנו מאמינים שטכנולוגיה צריכה לשרת את הערכים שלנו, ולא להיפך. 
              רובוט שבת מאפשר לכם ליהנות משבת שלווה מבלי לוותר על הנוכחות הדיגיטלית שלכם.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="flex items-center ios-title">
                <Clock className="ml-3 h-6 w-6 text-primary" />
                תזמון מדויק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ios-body">
                תזמון אוטומטי מבוסס על זמני שבת אמיתיים מחב"ד, 
                עם תמיכה ב-45+ עיר ברחבי העולם.
              </p>
            </CardContent>
          </Card>

          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="flex items-center ios-title">
                <Shield className="ml-3 h-6 w-6 text-primary" />
                אבטחה מתקדמת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ios-body">
                הצפנה ברמה בנקאית של כל הטוקנים והמידע האישי, 
                עם אחסון מאובטח בבסיס נתונים מוגן.
              </p>
            </CardContent>
          </Card>

          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="flex items-center ios-title">
                <Users className="ml-3 h-6 w-6 text-primary" />
                תמיכה מרובת פלטפורמות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ios-body">
                יוטיוב, פייסבוק, אינסטגרם - כל הפלטפורמות החשובות 
                במקום אחד עם ממשק אחיד ונוח.
              </p>
            </CardContent>
          </Card>

          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="flex items-center ios-title">
                <Zap className="ml-3 h-6 w-6 text-primary" />
                פעולה אוטומטית
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ios-body">
                פעולה 24/7 גם כשהאפליקציה סגורה - 
                המערכת פועלת באופן עצמאי בשרת.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <Card className="ios-card">
          <CardHeader>
            <CardTitle className="ios-title text-2xl">טכנולוגיה מתקדמת</CardTitle>
            <CardDescription className="ios-body">
              האפליקציה בנויה עם הטכנולוגיות החדישות ביותר
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/20 rounded-xl">
                <h4 className="font-semibold ios-title">Frontend</h4>
                <p className="text-sm ios-caption text-muted-foreground">React + TypeScript</p>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-xl">
                <h4 className="font-semibold ios-title">Backend</h4>
                <p className="text-sm ios-caption text-muted-foreground">Node.js + Express</p>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-xl">
                <h4 className="font-semibold ios-title">Database</h4>
                <p className="text-sm ios-caption text-muted-foreground">PostgreSQL</p>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-xl">
                <h4 className="font-semibold ios-title">Security</h4>
                <p className="text-sm ios-caption text-muted-foreground">AES-256 Encryption</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="ios-card bg-primary/5 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-semibold ios-title mb-4">מוכנים להתחיל?</h3>
            <p className="ios-body text-lg mb-6 text-muted-foreground">
              התחילו לנהל את התוכן שלכם באופן אוטומטי עוד היום
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="ios-button">
                <Link href="/pricing">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  צפו במחירים
                </Link>
              </Button>
              <Button asChild variant="outline" className="ios-button">
                <Link href="/">
                  חזרו לדף הבית
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-8">
          <p className="text-sm ios-caption text-muted-foreground">
            גרסה 2.0.0 | עדכון אחרון: יולי 2025
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;