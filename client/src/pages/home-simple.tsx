import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Calendar, Settings, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  username: string;
  youtubeChannelTitle?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: "התנתקת בהצלחה",
      description: "תוכל להתחבר שוב בכל עת",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthSection onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">שלום, {user.username}</h1>
            <p className="text-gray-600">ברוך הבא לרובוט שבת</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {user.email}
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="ml-2 h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* YouTube Card */}
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-6 w-6 text-red-600" />
                YouTube
              </CardTitle>
              <CardDescription>
                נהל את הסרטונים שלך ב-YouTube
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.youtubeChannelTitle ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ערוץ מחובר:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {user.youtubeChannelTitle}
                    </Badge>
                  </div>
                  <Link href="/youtube">
                    <Button className="w-full">
                      נהל סרטונים
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    התחבר ל-YouTube כדי לנהל את הסרטונים שלך
                  </p>
                  <Link href="/youtube">
                    <Button className="w-full" variant="outline">
                      <Youtube className="ml-2 h-4 w-4" />
                      התחבר ל-YouTube
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                לוח זמנים
              </CardTitle>
              <CardDescription>
                הגדר זמני שבת והפעלה אוטומטית
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  הגדר זמני כניסת ויציאת שבת לניהול אוטומטי של התוכן
                </p>
                <Button className="w-full" variant="outline" disabled>
                  <Calendar className="ml-2 h-4 w-4" />
                  הגדר לוח זמנים
                  <Badge className="mr-2" variant="secondary">בקרוב</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-600" />
                הגדרות
              </CardTitle>
              <CardDescription>
                נהל את החשבון והעדפות שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  התאם אישית את החוויה שלך
                </p>
                <Button className="w-full" variant="outline" disabled>
                  <Settings className="ml-2 h-4 w-4" />
                  הגדרות
                  <Badge className="mr-2" variant="secondary">בקרוב</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">פעולות מהירות</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">מה זה רובוט שבת?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  כלי לניהול אוטומטי של תוכן ברשתות חברתיות במהלך שבת וחגים
                </p>
                <Button variant="outline" size="sm" disabled>
                  למד עוד
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">תמיכה וסיוע</h3>
                <p className="text-sm text-gray-600 mb-4">
                  צריך עזרה? פנה לתמיכה שלנו לקבלת סיוע מהיר
                </p>
                <Button variant="outline" size="sm" disabled>
                  צור קשר
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthSection({ onLogin }: { onLogin: (user: UserData) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          onLogin(data.user);
        } else {
          // Registration successful, now login
          const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password })
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            localStorage.setItem('token', loginData.token);
            onLogin(loginData.user);
          }
        }
        
        toast({
          title: isLogin ? "התחברת בהצלחה" : "נרשמת בהצלחה",
          description: "ברוך הבא לרובוט שבת!",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בהתחברות');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isLogin ? 'התחברות' : 'הרשמה'} לרובוט שבת
          </CardTitle>
          <CardDescription>
            {isLogin ? 'התחבר לחשבונך' : 'צור חשבון חדש'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">אימייל</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">שם משתמש</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">סיסמה</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'מעבד...' : (isLogin ? 'התחבר' : 'הירשם')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? 'אין לך חשבון? הירשם כאן' : 'יש לך חשבון? התחבר כאן'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}