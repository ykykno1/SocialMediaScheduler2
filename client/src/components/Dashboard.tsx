import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Facebook, Instagram, ArrowLeft, Settings as SettingsIcon, History as HistoryIcon } from "lucide-react";
import { Link } from "wouter";
import { UserChabadWidget } from "@/components/widgets/UserChabadWidget";

const Dashboard = () => {
  return (
    <div className="space-y-8">


      {/* Shabbat Timer Widget */}
      <div className="flex justify-center mb-10">
        <UserChabadWidget />
      </div>

      {/* iOS-style Platform Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* YouTube Card */}
        <Card className="ios-card group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between ios-title">
              <div className="flex items-center">
                <Youtube className="mr-3 h-7 w-7 text-youtube" />
                <span className="text-lg">יוטיוב</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardTitle>
            <CardDescription className="ios-body text-base">
              נהל סרטונים ביוטיוב - זמין לכל המשתמשים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full ios-button bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/youtube">
                כנס לניהול יוטיוב
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Facebook Card */}
        <Card className="ios-card group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between ios-title">
              <div className="flex items-center">
                <Facebook className="mr-3 h-7 w-7 text-facebook" />
                <span className="text-lg">פייסבוק</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardTitle>
            <CardDescription className="ios-body text-base">
              נהל פוסטים בפייסבוק - פרימיום בלבד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full ios-button" variant="outline">
              <Link href="/facebook">
                כנס לניהול פייסבוק
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="ios-card group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between ios-title">
              <div className="flex items-center">
                <Instagram className="mr-3 h-7 w-7 text-instagram" />
                <span className="text-lg">אינסטגרם</span>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardTitle>
            <CardDescription className="ios-body text-base">
              נהל פוסטים באינסטגרם - פרימיום בלבד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full ios-button" variant="outline">
              <Link href="/instagram">
                כנס לניהול אינסטגרם
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* iOS-style Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <Card className="ios-card group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center ios-title text-lg">
              <SettingsIcon className="mr-3 h-6 w-6 text-primary" />
              הגדרות
            </CardTitle>
            <CardDescription className="ios-body text-base">
              נהל זמני שבת ושדרג חשבון
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full ios-button">
              <Link href="/settings">
                פתח הגדרות
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="ios-card group">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center ios-title text-lg">
              <HistoryIcon className="mr-3 h-6 w-6 text-primary" />
              היסטוריה
            </CardTitle>
            <CardDescription className="ios-body text-base">
              צפה בפעולות שביצעת בעבר
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full ios-button">
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