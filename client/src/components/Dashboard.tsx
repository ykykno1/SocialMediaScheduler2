import { useState } from "react";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useSettings from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Facebook, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { isAuthenticated, isAuthenticating, login, logout, isLoggingOut } = useFacebookAuth();
  const { posts, isLoading: isLoadingPosts, hidePosts, isHiding, restorePosts, isRestoring } = useFacebookPosts();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("overview");

  const handleHidePosts = () => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את הפוסטים? פעולה זו תהפוך אותם לפרטיים.")) {
      toast({
        title: "מסתיר פוסטים...",
        description: "מעדכן את הגדרות הפרטיות של הפוסטים",
      });
      
      hidePosts();
    }
  };

  const handleRestorePosts = () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את הפוסטים? פעולה זו תהפוך אותם לציבוריים.")) {
      toast({
        title: "משחזר פוסטים...",
        description: "מעדכן את הגדרות הפרטיות של הפוסטים",
      });
      
      restorePosts();
    }
  };

  // Render authentication state
  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>ברוכים הבאים לרובוט שבת</CardTitle>
          <CardDescription>
            אפליקציה להסתרה אוטומטית של תוכן ברשתות החברתיות בשבת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>התחברות נדרשת</AlertTitle>
            <AlertDescription>
              יש להתחבר לפייסבוק כדי להשתמש באפליקציה זו
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center">
            <Button 
              onClick={login} 
              disabled={isAuthenticating}
              className="bg-[#1877F2] hover:bg-[#166FE5]"
            >
              <Facebook className="mr-2 h-4 w-4" />
              {isAuthenticating ? "מתחבר..." : "התחבר עם פייסבוק"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="posts">פוסטים ({posts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>מצב נוכחי</CardTitle>
              <CardDescription>
                סקירה כללית של מצב חשבון הפייסבוק שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Facebook className="h-5 w-5 mr-2 text-[#1877F2]" />
                    <span>חשבון פייסבוק</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">מחובר</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>זמן הסתרה אוטומטי</span>
                  </div>
                  <span className="font-medium">{settings.hideTime}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>זמן שחזור אוטומטי</span>
                  </div>
                  <span className="font-medium">{settings.restoreTime}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    <span>הסתרה אוטומטית</span>
                  </div>
                  <Badge variant={settings.autoSchedule ? "default" : "secondary"}>
                    {settings.autoSchedule ? "פעיל" : "לא פעיל"}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={logout}>התנתק מפייסבוק</Button>
              <div className="space-x-2 flex flex-row-reverse">
                <Button onClick={handleHidePosts} disabled={isHiding}>
                  <Lock className="mr-2 h-4 w-4" />
                  הסתר כעת
                </Button>
                <Button variant="outline" onClick={handleRestorePosts} disabled={isRestoring}>
                  <Unlock className="mr-2 h-4 w-4" />
                  שחזר כעת
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>הפוסטים שלך</CardTitle>
              <CardDescription>
                רשימת הפוסטים מחשבון הפייסבוק שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2 border p-4 rounded-lg">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>אין פוסטים</AlertTitle>
                  <AlertDescription>
                    לא נמצאו פוסטים בחשבון הפייסבוק שלך
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_time).toLocaleDateString('he-IL')}
                        </span>
                        <Badge variant={post.privacy.value === 'SELF' ? 'secondary' : 'outline'}>
                          {post.privacy.value === 'SELF' ? 'מוסתר' : 'גלוי'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{post.message || "אין תוכן טקסט"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                סה"כ {posts.length} פוסטים
              </div>
              <div className="space-x-2 flex flex-row-reverse">
                <Button onClick={handleHidePosts} disabled={isHiding}>
                  <Lock className="mr-2 h-4 w-4" />
                  הסתר הכל
                </Button>
                <Button variant="outline" onClick={handleRestorePosts} disabled={isRestoring}>
                  <Unlock className="mr-2 h-4 w-4" />
                  שחזר הכל
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;