import { useState } from "react";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useFacebookPages from "@/hooks/useFacebookPages";
import useSettings from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Facebook, FileText, Globe, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { isAuthenticated, isAuthenticating, login, logout, isLoggingOut, pageAccess } = useFacebookAuth();
  const { posts, isLoading: isLoadingPosts, hidePosts, isHiding, restorePosts, isRestoring } = useFacebookPosts();
  const { pages, isLoading: isLoadingPages, hidePages, isHiding: isHidingPages, restorePages, isRestoring: isRestoringPages } = useFacebookPages();
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

  const handleHidePages = () => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את העמודים? פעולה זו תהפוך אותם ללא מפורסמים.")) {
      toast({
        title: "מסתיר עמודים...",
        description: "מעדכן את הגדרות הפרסום של העמודים",
      });
      
      hidePages();
    }
  };

  const handleRestorePages = () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את העמודים? פעולה זו תפרסם אותם מחדש.")) {
      toast({
        title: "משחזר עמודים...",
        description: "מעדכן את הגדרות הפרסום של העמודים",
      });
      
      restorePages();
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
          <TabsTrigger value="pages">עמודים ({pages.length})</TabsTrigger>
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
                    <FileText className="h-5 w-5 mr-2 text-[#1877F2]" />
                    <span>גישה לעמודי פייסבוק</span>
                  </div>
                  {pageAccess ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">מאושר</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">לא מאושר</Badge>
                  )}
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
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    <span>עמודי פייסבוק</span>
                  </div>
                  <span className="font-medium">{pages.length}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={logout}>התנתק מפייסבוק</Button>
              <div className="space-y-2">
                <div className="space-x-2 flex flex-row-reverse">
                  <Button onClick={handleHidePosts} disabled={isHiding}>
                    <Lock className="mr-2 h-4 w-4" />
                    הסתר פוסטים
                  </Button>
                  <Button variant="outline" onClick={handleRestorePosts} disabled={isRestoring}>
                    <Unlock className="mr-2 h-4 w-4" />
                    שחזר פוסטים
                  </Button>
                </div>
                
                {pages.length > 0 && pageAccess && (
                  <div className="space-x-2 flex flex-row-reverse mt-2">
                    <Button variant="secondary" onClick={handleHidePages} disabled={isHidingPages}>
                      <FileText className="mr-2 h-4 w-4" />
                      הסתר עמודים
                    </Button>
                    <Button variant="outline" onClick={handleRestorePages} disabled={isRestoringPages}>
                      <Globe className="mr-2 h-4 w-4" />
                      פרסם עמודים
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Add note about Facebook API limitations */}
              <Alert className="mt-4 text-sm bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>שים לב</AlertTitle>
                <AlertDescription>
                  עקב שינויים חדשים בהרשאות API של פייסבוק, ישנן מגבלות כרגע:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>לא ניתן להסתיר פוסטים אישיים באופן אוטומטי</li>
                    <li>גישה לניהול עמודי פייסבוק מוגבלת</li>
                    <li>אפליקציות צד שלישי נדרשות לעבור תהליך סקירה מקיף של פייסבוק</li>
                  </ul>
                  <div className="p-3 mt-2 border border-amber-200 rounded-md bg-amber-50/70">
                    <strong>המלצה:</strong> לניהול תוכן בשבת, מומלץ להשתמש בעמודי פייסבוק (לא פרופיל אישי) 
                    ולהיכנס ישירות לממשק הניהול של פייסבוק לפני שבת כדי להגדיר תזמוני פרסום.
                  </div>
                </AlertDescription>
              </Alert>
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
              
              {/* Add note about Facebook API limitations */}
              <Alert className="mt-4 text-sm bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>מגבלות חשובות</AlertTitle>
                <AlertDescription>
                  בשל שינויי מדיניות של פייסבוק, ה-API אינו מאפשר כיום לשנות הגדרות פרטיות של פוסטים באופן אוטומטי.
                  <div className="p-3 mt-2 border border-amber-200 rounded-md bg-amber-50/70">
                    <strong>פתרון חלופי:</strong> לפני שבת, יש לבצע הסתרת פוסטים באופן ידני דרך אתר פייסבוק בעצמו.
                  </div>
                  <a 
                    href="https://www.facebook.com/settings?tab=privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full mt-2 px-4 py-2 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                    פתח הגדרות פרטיות בפייסבוק
                  </a>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>העמודים שלך</CardTitle>
              <CardDescription>
                רשימת עמודי הפייסבוק שאתה מנהל
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pageAccess ? (
                <Alert className="bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>מגבלות גישה מפייסבוק</AlertTitle>
                  <AlertDescription>
                    עקב מגבלות בממשק של פייסבוק, כרגע לא ניתן לקבל הרשאות גישה לעמודים באופן אוטומטי. 
                    אנחנו עדיין עובדים על פתרון לבעיה זו.
                    <div className="mt-2 p-3 border border-amber-200 rounded-md bg-amber-50">
                      <strong>הערה:</strong> האפליקציה מוגבלת כרגע רק להרשאות בסיסיות של פייסבוק.
                      לניהול עמודי פייסבוק בזמן שבת, אנא השתמש במסך הניהול באתר פייסבוק עצמו.
                    </div>
                    <Button 
                      onClick={login} 
                      variant="outline" 
                      className="mt-2 w-full border-amber-300 text-amber-700"
                    >
                      <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                      התחבר מחדש לפייסבוק
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : isLoadingPages ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2 border p-4 rounded-lg">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pages.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>אין עמודים</AlertTitle>
                  <AlertDescription>
                    לא נמצאו עמודי פייסבוק שאתה מנהל, או שלחשבונך אין הרשאות מנהל בעמודים כלשהם.
                    
                    <a 
                      href="https://www.facebook.com/pages/?category=your_pages" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block mt-2 text-blue-600 hover:underline"
                    >
                      עבור לעמודי הפייסבוק שלך
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {pages.map((page) => (
                    <div key={page.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{page.name}</span>
                        <Badge variant={page.isHidden ? 'secondary' : 'outline'}>
                          {page.isHidden ? 'מוסתר' : 'מפורסם'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2 text-muted-foreground">
                        {page.category || "עמוד"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                סה"כ {pages.length} עמודים
              </div>
              {pages.length > 0 && pageAccess ? (
                <div className="space-x-2 flex flex-row-reverse">
                  <Button onClick={handleHidePages} disabled={isHidingPages}>
                    <Lock className="mr-2 h-4 w-4" />
                    הסתר עמודים
                  </Button>
                  <Button variant="outline" onClick={handleRestorePages} disabled={isRestoringPages}>
                    <Unlock className="mr-2 h-4 w-4" />
                    פרסם עמודים
                  </Button>
                </div>
              ) : (
                <div></div>
              )}
              
              <Alert className="mt-4 text-sm bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
                <AlertTitle>מידע על ניהול עמודים</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>הסתרת עמודי פייסבוק בשבת מסירה אותם זמנית מהתצוגה הציבורית.</p>
                    <p>עקב המגבלות הנוכחיות של פייסבוק, מומלץ לנהל את פרסום העמודים באופן ידני לפני כניסת השבת:</p>
                    
                    <div className="mt-2 border-t pt-2">
                      <strong>דרך מומלצת לניהול עמודים בשבת:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>גש למנהל העמודים שלך בפייסבוק</li>
                        <li>השתמש באפשרות "תזמון" כדי להגדיר מראש מתי העמוד יהיה מפורסם</li>
                        <li>תזמן הפסקת פרסום לפני כניסת השבת</li>
                        <li>תזמן חזרה לפרסום לאחר צאת השבת</li>
                      </ol>
                    </div>
                    
                    <a 
                      href="https://www.facebook.com/pages/?category=your_pages" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full mt-3 px-4 py-2 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                      פתח את מנהל העמודים שלך
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;