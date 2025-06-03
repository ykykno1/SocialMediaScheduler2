import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { UserPlus, LogIn, Calendar, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm<LoginData>();

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors }
  } = useForm<RegisterData>();

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      
      if (result.success) {
        // Save user to localStorage for simple auth
        localStorage.setItem('shabbat-robot-user', JSON.stringify(result.user));
        toast({
          title: "התחברת בהצלחה!",
          description: `ברוך הבא, ${result.user.firstName || result.user.username}`,
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בהתחברות",
        description: "אימייל או סיסמה לא נכונים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      if (result.success) {
        // Save user to localStorage for simple auth
        localStorage.setItem('shabbat-robot-user', JSON.stringify(result.user));
        toast({
          title: "נרשמת בהצלחה!",
          description: `ברוך הבא לשבת רובוט, ${result.user.firstName || result.user.username}`,
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה ברישום",
        description: error.message || "לא ניתן ליצור את החשבון",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemoUser = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-demo-user");
      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('shabbat-robot-user', JSON.stringify(result.user));
        toast({
          title: "משתמש דמו נוצר!",
          description: `ברוך הבא לשבת רובוט, ${result.user.firstName}`,
        });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה ביצירת משתמש דמו",
        description: error.message || "לא ניתן ליצור משתמש דמו",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="text-center lg:text-right space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              רובוט שבת
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              הפתרון הטכנולוגי המתקדם לניהול תוכן ברשתות החברתיות בשבת
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">זיהוי שבת אוטומטי</h3>
              <p className="text-sm text-gray-600">
                המערכת מזהה כניסת ויציאת שבת לפי המיקום שלך
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">תכניות גמישות</h3>
              <p className="text-sm text-gray-600">
                חשבון חינמי ליוטיוב, פרימיום לכל הרשתות
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center lg:justify-end space-x-2 space-x-reverse">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-600">יוטיוב - פעיל ועובד במלואו</span>
            </div>
            <div className="flex items-center justify-center lg:justify-end space-x-2 space-x-reverse">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-gray-600">פייסבוק ואינסטגרם - בהליכי אישור</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                התחברות
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                הרשמה
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>ברוך הבא בחזרה</CardTitle>
                  <CardDescription>
                    התחבר לחשבון שלך כדי להמשיך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="דוגמה@example.com"
                        {...loginRegister("email", { required: "שדה חובה" })}
                      />
                      {loginErrors.email && (
                        <p className="text-sm text-red-600">{loginErrors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">סיסמה</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="הזן סיסמה"
                        {...loginRegister("password", { required: "שדה חובה" })}
                      />
                      {loginErrors.password && (
                        <p className="text-sm text-red-600">{loginErrors.password.message}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "מתחבר..." : "התחבר"}
                    </Button>
                  </form>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      disabled={isLoading}
                      onClick={handleCreateDemoUser}
                    >
                      צור משתמש דמו
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ייצור משתמש עם הפרטים: demo@shabbat-robot.com / 123456
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>יצירת חשבון חדש</CardTitle>
                  <CardDescription>
                    הצטרף לרובוט שבת וקבל חשבון חינמי
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">שם פרטי</Label>
                        <Input
                          id="firstName"
                          placeholder="שם פרטי"
                          {...registerRegister("firstName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">שם משפחה</Label>
                        <Input
                          id="lastName"
                          placeholder="שם משפחה"
                          {...registerRegister("lastName")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">שם משתמש</Label>
                      <Input
                        id="username"
                        placeholder="בחר שם משתמש"
                        {...registerRegister("username", { required: "שדה חובה" })}
                      />
                      {registerErrors.username && (
                        <p className="text-sm text-red-600">{registerErrors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">אימייל</Label>
                      <Input
                        id="registerEmail"
                        type="email"
                        placeholder="דוגמה@example.com"
                        {...registerRegister("email", { required: "שדה חובה" })}
                      />
                      {registerErrors.email && (
                        <p className="text-sm text-red-600">{registerErrors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">סיסמה</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="לפחות 6 תווים"
                        {...registerRegister("password", { 
                          required: "שדה חובה",
                          minLength: { value: 6, message: "סיסמה חייבת להיות לפחות 6 תווים" }
                        })}
                      />
                      {registerErrors.password && (
                        <p className="text-sm text-red-600">{registerErrors.password.message}</p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "נרשם..." : "הירשם עכשיו"}
                    </Button>
                  </form>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      <strong>חשבון חינמי:</strong> גישה ליוטיוב + תזמון שבת
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}