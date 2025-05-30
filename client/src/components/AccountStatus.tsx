import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, User, LogOut, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  accountType: 'free' | 'premium';
};

export default function AccountStatus() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('shabbat-robot-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('shabbat-robot-user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shabbat-robot-user');
    setUser(null);
    toast({
      title: "התנתקת בהצלחה",
      description: "תודה שהשתמשת ברובוט שבת",
    });
    window.location.reload();
  };

  const handleUpgrade = () => {
    toast({
      title: "שדרוג לפרימיום",
      description: "תכונה זו תהיה זמינה בקרוב עם אינטגרציית Stripe",
    });
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            לא מחובר
          </CardTitle>
          <CardDescription>
            התחבר כדי לקבל גישה לתכונות מותאמות אישית
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
            התחבר או הירשם
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.accountType === 'premium' ? (
              <Crown className="h-5 w-5 text-yellow-500" />
            ) : (
              <User className="h-5 w-5" />
            )}
            שלום, {user.firstName || user.username}
          </div>
          <Badge variant={user.accountType === 'premium' ? 'default' : 'secondary'}>
            {user.accountType === 'premium' ? 'פרימיום' : 'חינמי'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {user.accountType === 'free' ? (
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">חשבון חינמי</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• יוטיוב - גישה מלאה</li>
              <li>• תזמון שבת אוטומטי</li>
              <li>• היסטוריית פעולות</li>
            </ul>
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              שדרג לפרימיום
            </Button>
            <p className="text-xs text-gray-600 text-center">
              פרימיום: כל הרשתות + תזמון גמיש
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-purple-900">חשבון פרימיום</span>
            </div>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• יוטיוב - גישה מלאה</li>
              <li>• פייסבוק + אינסטגרם (בהליכי אישור)</li>
              <li>• תזמון גמיש</li>
              <li>• זיהוי שבת אוטומטי</li>
            </ul>
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          התנתק
        </Button>
      </CardContent>
    </Card>
  );
}