import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Youtube, Facebook, Instagram, Calendar, Shield, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface HomePageProps {
  onLogout: () => void;
}

export default function HomePage({ onLogout }: HomePageProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        // If fetch fails, logout
        onLogout();
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      onLogout();
    }
  }, [onLogout]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>שגיאה בטעינת נתוני המשתמש</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              שלום {user.username}! 👋
            </h1>
            <p className="text-gray-600">
              ברוך הבא למערכת רובוט שבת - ניהול תוכן חכם לשבת
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>

        {/* Account Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              סטטוס חשבון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">תוכנית: <Badge variant="secondary">חינם</Badge></p>
                <p className="text-sm text-gray-600 mt-1">
                  ניתן להסתיר עד 4 סרטונים ביוטיוב באופן ידני
                </p>
              </div>
              <Button variant="default">
                שדרג לפרו
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Connections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Youtube className="w-5 h-5" />
                YouTube
              </CardTitle>
              <CardDescription>נהל את הסרטונים שלך ביוטיוב</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">לא מחובר</Badge>
              <Button className="w-full" variant="outline">
                התחבר ליוטיוב
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Facebook className="w-5 h-5" />
                Facebook
              </CardTitle>
              <CardDescription>נהל את הפוסטים שלך בפייסבוק</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">לא מחובר</Badge>
              <Button className="w-full" variant="outline" disabled>
                בקרוב
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Instagram className="w-5 h-5" />
                Instagram
              </CardTitle>
              <CardDescription>נהל את התמונות והסיפורים שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-3">לא מחובר</Badge>
              <Button className="w-full" variant="outline" disabled>
                בקרוב
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Shabbat Schedule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              זמני שבת הקרובה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">כניסת שבת:</p>
                <p className="text-lg">יום שישי, 18:30</p>
              </div>
              <div>
                <p className="font-medium">יציאת שבת:</p>
                <p className="text-lg">מוצאי שבת, 19:45</p>
              </div>
            </div>
            <Button className="mt-4" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              עדכן מיקום וזמנים
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">עדיין לא היתה פעילות במערכת</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}