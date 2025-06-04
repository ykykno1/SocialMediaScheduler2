import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState({
    login: false,
    register: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState({
    login: false,
    register: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading({ ...isLoading, login: true });
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      
      toast({
        title: "התחברות הושלמה בהצלחה",
        description: `ברוך הבא ${data.user.username}!`,
      });
      
      onLogin();
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsLoading({ ...isLoading, login: false });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading({ ...isLoading, register: true });
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      
      toast({
        title: "רישום הושלם בהצלחה",
        description: `ברוך הבא ${data.user.username}!`,
      });
      
      onLogin();
    } catch (error) {
      toast({
        title: "שגיאה ברישום",
        description: error instanceof Error ? error.message : "שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsLoading({ ...isLoading, register: false });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-right">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              רובוט שבת
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              ניהול תוכן חכם לשבת - הסתר והחזר תוכן באופן אוטומטי
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center lg:justify-end">
              <span className="text-green-600">✓</span>
              <span>הסתרה אוטומטית של תוכן בכניסת שבת</span>
            </div>
            <div className="flex items-center gap-3 justify-center lg:justify-end">
              <span className="text-green-600">✓</span>
              <span>החזרה אוטומטית בסיום שבת</span>
            </div>
            <div className="flex items-center gap-3 justify-center lg:justify-end">
              <span className="text-green-600">✓</span>
              <span>תמיכה ביוטיוב, פייסבוק ואינסטגרם</span>
            </div>
            <div className="flex items-center gap-3 justify-center lg:justify-end">
              <span className="text-green-600">✓</span>
              <span>זמני שבת מדויקים לפי מיקום</span>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="w-full max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">רישום</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader>
                <CardTitle>התחברות</CardTitle>
                <CardDescription>הכנס את פרטי החשבון שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">אימייל</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                      disabled={isLoading.login}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword.login ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                        disabled={isLoading.login}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({...showPassword, login: !showPassword.login})}
                        disabled={isLoading.login}
                      >
                        {showPassword.login ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading.login}>
                    {isLoading.login ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מתחבר...
                      </>
                    ) : (
                      "התחבר"
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader>
                <CardTitle>רישום</CardTitle>
                <CardDescription>צור חשבון חדש</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">שם משתמש</Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                      required
                      disabled={isLoading.register}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">אימייל</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      required
                      disabled={isLoading.register}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword.register ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                        disabled={isLoading.register}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({...showPassword, register: !showPassword.register})}
                        disabled={isLoading.register}
                      >
                        {showPassword.register ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">אישור סיסמה</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                        required
                        disabled={isLoading.register}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                        disabled={isLoading.register}
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading.register}>
                    {isLoading.register ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        נרשם...
                      </>
                    ) : (
                      "הירשם"
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}