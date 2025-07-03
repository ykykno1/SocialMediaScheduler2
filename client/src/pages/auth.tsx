import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'verify' | 'complete'>('email');
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const userData = await response.json();
        // Store JWT token
        localStorage.setItem('auth_token', userData.token);
        // Store user data without token
        const userDataWithoutToken = { ...userData };
        delete userDataWithoutToken.token;
        queryClient.setQueryData(["/api/user"], userDataWithoutToken);
        toast({
          title: "התחברת בהצלחה",
          description: `ברוך הבא, ${userData.username || userData.email}`,
        });
        setLocation("/");
      } else {
        const errorData = await response.json();
        toast({
          title: "שגיאה בהתחברות",
          description: errorData.error || "נסה שוב",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: "בדוק את החיבור לאינטרנט",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!registerData.email) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת מייל",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerData.email }),
      });

      if (response.ok) {
        setVerificationEmail(registerData.email);
        setVerificationStep('verify');
        toast({
          title: "קוד אימות נשלח",
          description: "בדוק את תיבת המייל שלך לקוד האימות",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "שגיאה בשליחת אימות",
          description: errorData.error || "שגיאה בשליחת קוד האימות",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "בדוק את החיבור לאינטרנט",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!verificationCode) {
      toast({
        title: "שגיאה",
        description: "נא להזין קוד אימות",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: verificationEmail, 
          verificationCode 
        }),
      });

      if (response.ok) {
        setVerificationStep('complete');
        toast({
          title: "מייל אומת בהצלחה",
          description: "עכשיו אפשר להשלים את הרישום",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "שגיאה באימות",
          description: errorData.error || "קוד אימות שגוי",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "בדוק את החיבור לאינטרנט",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationStep === 'email') {
      await sendVerificationEmail();
      return;
    }

    if (verificationStep === 'verify') {
      await verifyEmailCode();
      return;
    }

    // Final registration step
    if (!registerData.username || !registerData.password || !registerData.confirmPassword) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/register-with-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail,
          username: registerData.username,
          password: registerData.password,
          verificationCode,
          registrationMethod: 'email'
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        // Store JWT token
        localStorage.setItem('auth_token', userData.token);
        // Store user data without token
        const userDataWithoutToken = { ...userData.user };
        queryClient.setQueryData(["/api/user"], userDataWithoutToken);
        toast({
          title: "נרשמת בהצלחה",
          description: `ברוך הבא, ${userData.user.username}`,
        });
        setLocation("/");
      } else {
        const errorData = await response.json();
        toast({
          title: "שגיאה ברישום",
          description: errorData.error || "נסה שוב",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה ברישום",
        description: "בדוק את החיבור לאינטרנט",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            ברוכים הבאים לרובוט שבת
          </CardTitle>
          <CardDescription className="text-center">
            התחבר או הרשם כדי להתחיל
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">אימייל</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="הכנס את האימייל שלך"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">סיסמה</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="הכנס את הסיסמה שלך"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "מתחבר..." : "התחבר"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Step 1: Email Entry */}
                {verificationStep === 'email' && (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">שלב 1: הזן כתובת מייל</h3>
                      <p className="text-sm text-gray-600">נשלח לך קוד אימות לאימייל</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">אימייל</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="הכנס את האימייל שלך"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {isLoading ? "שולח קוד אימות..." : "שלח קוד אימות"}
                    </Button>
                  </>
                )}

                {/* Step 2: Verification Code */}
                {verificationStep === 'verify' && (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">שלב 2: אמת את המייל</h3>
                      <p className="text-sm text-gray-600">
                        הזן את קוד האימות שנשלח ל-{verificationEmail}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">קוד אימות</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="הזן קוד בן 6 ספרות"
                        maxLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "מאמת..." : "אמת קוד"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setVerificationStep('email')}
                    >
                      חזור לשלב הקודם
                    </Button>
                  </>
                )}

                {/* Step 3: Complete Registration */}
                {verificationStep === 'complete' && (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">שלב 3: השלם רישום</h3>
                      <p className="text-sm text-gray-600">צור שם משתמש וסיסמה</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">שם משתמש</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        placeholder="בחר שם משתמש"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">סיסמה</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="צור סיסמה חזקה"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">אימות סיסמה</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="חזור על הסיסמה"
                        required
                      />
                    </div>
                    {registerData.password !== registerData.confirmPassword && registerData.confirmPassword && (
                      <p className="text-red-500 text-sm">הסיסמאות אינן תואמות</p>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || registerData.password !== registerData.confirmPassword}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {isLoading ? "משלים רישום..." : "הרשם"}
                    </Button>
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}