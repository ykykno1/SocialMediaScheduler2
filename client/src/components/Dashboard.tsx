import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Facebook, Instagram, ArrowLeft, Settings as SettingsIcon, History as HistoryIcon } from "lucide-react";
import { Link } from "wouter";
import { ShabbatWidget } from "@/components/widgets/ShabbatWidget";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">ברוכים הבאים לרובוט שבת</h1>
        <p className="text-gray-600 text-lg">נהל את התוכן שלך ברשתות החברתיות לשבת</p>
      </div>

      {/* Shabbat Timer Widget */}
      <div className="flex justify-center mb-8">
        <ShabbatWidget />
      </div>

      {/* Platform Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* YouTube Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Youtube className="mr-2 h-6 w-6 text-red-600" />
                יוטיוב
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>
              נהל סרטונים ביוטיוב - זמין לכל המשתמשים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/youtube">
                כנס לניהול יוטיוב
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Facebook Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Facebook className="mr-2 h-6 w-6 text-[#1877F2]" />
                פייסבוק
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>
              נהל פוסטים בפייסבוק - פרימיום בלבד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/facebook">
                כנס לניהול פייסבוק
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Instagram className="mr-2 h-6 w-6 text-[#E4405F]" />
                אינסטגרם
              </div>
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>
              נהל פוסטים באינסטגרם - פרימיום בלבד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/instagram">
                כנס לניהול אינסטגרם
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              הגדרות
            </CardTitle>
            <CardDescription>
              נהל זמני שבת ושדרג חשבון
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings">
                פתח הגדרות
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HistoryIcon className="mr-2 h-5 w-5" />
              היסטוריה
            </CardTitle>
            <CardDescription>
              צפה בפעולות שביצעת בעבר
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/history">
                צפה בהיסטוריה
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;