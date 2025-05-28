import { useState } from "react";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useFacebookPages from "@/hooks/useFacebookPages";
import useYouTubeAuth from "@/hooks/useYouTubeAuth";
import useSettings from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Facebook, FileText, Globe, Lock, Unlock, Key, ExternalLink, Youtube, Instagram } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import YouTubeAuth from "@/components/YouTubeAuth";
import YouTubeVideos from "@/components/YouTubeVideos";
import { InstagramAuth } from "@/components/InstagramAuth";
import { InstagramPosts } from "@/components/InstagramPosts";

const Dashboard = () => {
  const { isAuthenticated, isAuthenticating, login, logout, isLoggingOut, pageAccess } = useFacebookAuth();
  const { posts, isLoading: isLoadingPosts, hidePosts, isHiding, restorePosts, isRestoring } = useFacebookPosts();
  const { pages, isLoading: isLoadingPages, hidePages, isHiding: isHidingPages, restorePages, isRestoring: isRestoringPages } = useFacebookPages();
  const { isAuthenticated: isYouTubeAuthenticated } = useYouTubeAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("overview");
  const [manualToken, setManualToken] = useState("");
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  
  const handleManualTokenSubmit = async () => {
    if (!manualToken) {
      toast({
        title: "שגיאה",
        description: "נא להזין טוקן",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "בודק טוקן...",
        description: "מתחבר לפייסבוק ובודק את תקפות הטוקן",
      });
      
      const response = await fetch('/api/facebook/manual-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: manualToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'לא ניתן לשמור את הטוקן');
      }
      
      const result = await response.json();
      
      toast({
        title: "נשמר בהצלחה",
        description: result.pageAccess 
          ? "הטוקן נשמר בהצלחה עם גישה לעמודים! כעת תוכל להשתמש בפעולות ניהול העמודים." 
          : "הטוקן נשמר בהצלחה, אך ללא גישה לעמודים. בדוק את ההרשאות בטוקן.",
      });
      
      setIsTokenDialogOpen(false);
      setManualToken("");
      
      // רענון העמוד כדי לטעון את הנתונים מחדש עם הטוקן החדש
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error saving token:", error);
      toast({
        title: "שגיאה בשמירת הטוקן",
        description: error instanceof Error ? error.message : 'אירעה שגיאה בשמירת הטוקן',
        variant: "destructive",
      });
    }
  };

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
      {/* YouTube Integration Section */}
      <YouTubeAuth />
      
      {isYouTubeAuthenticated && <YouTubeVideos />}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="posts">פוסטים ({posts.length})</TabsTrigger>
          <TabsTrigger value="pages">עמודים ({pages.length})</TabsTrigger>
          <TabsTrigger value="instagram">אינסטגרם</TabsTrigger>
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
              <div className="flex space-x-2">
                <Button variant="outline" onClick={logout}>התנתק מפייסבוק</Button>
                <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <Key className="mr-2 h-4 w-4" />
                      הזן טוקן ידני
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>הזנת טוקן גישה ידני לפייסבוק</DialogTitle>
                      <DialogDescription>
                        הזן טוקן גישה שיצרת ידנית ב-Graph API Explorer. טוקן זה יאפשר גישה מתקדמת לעמודים ופוסטים.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label htmlFor="token" className="text-right block">טוקן גישה</Label>
                      <Input
                        id="token"
                        className="w-full"
                        placeholder="EAABk..."
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        dir="ltr"
                      />
                      <div className="text-sm border-t pt-2 space-y-2">
                        <p className="font-medium mb-1">כיצד ליצור טוקן עם הרשאות מתקדמות?</p>
                        <ol className="list-decimal list-inside space-y-1 mr-4">
                          <li>גש ל-Graph API Explorer</li>
                          <li>בחר את האפליקציה שלך</li>
                          <li>לחץ על "Get Token" → "Get User Access Token"</li>
                          <li>בחר את כל ההרשאות הזמינות:
                            <ul className="list-disc list-inside mr-6 mt-1 text-xs">
                              <li>email</li>
                              <li>user_likes</li>
                              <li>user_link</li>
                              <li>user_photos</li>
                              <li>user_posts</li>
                              <li>user_videos</li>
                            </ul>
                          </li>
                          <li>לחץ על "Generate Access Token"</li>
                          <li>אשר את הבקשה בחשבון הפייסבוק שלך</li>
                          <li>העתק את הטוקן לכאן</li>
                        </ol>

                        <div className="bg-amber-50 p-2 rounded-md border border-amber-200 text-xs">
                          <p className="font-medium text-amber-800">עדכון חשוב ממפתחי האפליקציה:</p>
                          <p>בדקנו את המגבלות החדשות של פייסבוק וגילינו שהרשאות הגישה לעמודים הוגבלו מאוד בגרסה 22.0. כרגע אין אפשרות לגשת לעמודים או לנהל אותם דרך API ללא אישור מיוחד מפייסבוק.</p>
                          <p className="mt-1">גם עם טוקן ידני, פייסבוק מחזירה שגיאת API Restriction. האפליקציה עדיין יכולה לגשת לפוסטים אישיים.</p>
                        </div>
                        
                        <a 
                          href="https://developers.facebook.com/tools/explorer/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 inline-flex items-center justify-center w-full mt-2"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          פתח את Graph API Explorer
                        </a>
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="button" onClick={handleManualTokenSubmit}>
                        שמור טוקן
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
              <Alert className="mt-4 text-sm bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>חדשות טובות!</AlertTitle>
                <AlertDescription>
                  <div className="font-bold text-amber-800 mt-1 mb-3 text-base">
                    עדכון: מגבלות חדשות בפייסבוק בגרסה API 22.0
                  </div>
                  
                  <p className="mb-2">בגרסה החדשה של ה-API של פייסבוק (22.0), נוספו מגבלות על ניהול עמודים. פייסבוק חסמה את האפשרות לאפליקציות לנהל עמודים ללא אישור מיוחד וסקירה.</p>
                  
                  <div className="p-3 mt-3 mb-3 border-2 border-amber-300 rounded-md bg-amber-50 shadow-sm">
                    <div className="font-bold mb-2 text-center text-amber-800">המצב העדכני</div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="font-bold">עדכון מהפיתוח:</div>
                        <ul className="list-disc list-inside mt-1 space-y-1 mr-2">
                          <li>בגרסה 22.0 של API של פייסבוק, כל ההרשאות לניהול עמודים הוגדרו כלא תקפות</li>
                          <li>גם עם טוקן ידני, פייסבוק לא מאפשרת גישה לניהול עמודים כרגע</li>
                          <li>הסיבה: פייסבוק עברה למדיניות מחמירה יותר לגבי אפליקציות שמנהלות עמודים</li>
                          <li>אנחנו ממשיכים לעקוב אחר השינויים ולחפש פתרונות חלופיים</li>
                        </ul>
                      </div>
                      
                      <div>
                        <div className="font-bold">שים לב:</div>
                        <ul className="list-disc list-inside mt-1 space-y-1 mr-2">
                          <li>האפליקציה פועלת רק על עמודי פייסבוק, לא על פרופילים אישיים</li>
                          <li>פוסטים אישיים בפרופיל שלך נדרשים להסתרה ידנית</li>
                          <li>ניתן לבחור אילו עמודים להסתיר בהגדרות</li>
                        </ul>
                        <a 
                          href="https://www.facebook.com/pages/?category=your_pages"
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full mt-2 px-3 py-1.5 text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <Facebook className="mr-2 h-3 w-3 text-[#1877F2]" />
                          צפה בעמודי הפייסבוק שלך
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="font-medium text-green-800 mt-3">
                    פיצ'רים נוספים שנוספו לאחרונה:
                    <ul className="list-disc list-inside mt-1 mr-2">
                      <li>תזמון אוטומטי לפי זמני שבת</li>
                      <li>ניטור היסטוריית פעילות להסתרה ושחזור</li>
                      <li>התראות בזמן אמת על שינויי מצב</li>
                    </ul>
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
                        <Badge variant={post.privacy.value === 'SELF' || post.privacy.value === 'ONLY_ME' ? 'secondary' : 'outline'}>
                          {post.privacy.value === 'SELF' || post.privacy.value === 'ONLY_ME' ? 'מוסתר' : 'גלוי'}
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
              <Alert className="mt-4 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>מדריך מפורט להסתרת פוסטים</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded-md border border-amber-200 shadow-sm mb-3">
                      <div className="font-bold text-amber-800 mb-1">למה כפתורי ההסתרה לא עובדים?</div>
                      <p>בדיקה שערכנו עם הגרסה האחרונה של Facebook API (v22.0) הראתה שההרשאות המתקדמות לגישה לדפים ולפוסטים אינן זמינות. פייסבוק מגדירה אותן כ"הרשאות לא תקפות".</p>
                      <p className="mt-2">פייסבוק כנראה חסמה לחלוטין את האפשרות לאפליקציות צד שלישי לשנות הגדרות פרטיות של פוסטים ללא הרשאות מיוחדות ואישור מדוקדק. לכן, הדרך היחידה כרגע היא להסתיר את הפוסטים באופן ידני דרך ממשק פייסבוק.</p>
                    </div>
                    
                    <div className="border-2 border-amber-300 rounded-md p-3 bg-white">
                      <div className="font-bold text-amber-800 mb-2">הסתרת פוסטים לשבת - מדריך צעד אחר צעד:</div>
                      
                      <ol className="list-decimal list-inside space-y-3 mr-2 text-gray-800">
                        <li className="font-medium">גש לפרופיל הפייסבוק שלך
                          <div className="text-gray-600 mr-5 mt-1">לחץ על השם שלך או על תמונת הפרופיל בתפריט העליון</div>
                        </li>
                        
                        <li className="font-medium">מצא את הפוסטים שברצונך להסתיר
                          <div className="flex flex-col mr-5 mt-1">
                            <span className="text-gray-600">גלול דרך הפוסטים או השתמש בפילטר "נהל פוסטים" (ממנהל הפרופיל)</span>
                            <a href="https://www.facebook.com/YOUR_USERNAME/allactivity/" 
                               target="_blank" rel="noopener noreferrer"
                               className="text-blue-600 hover:underline mt-1">או גש ישירות לרשימת הפעילות המלאה</a>
                          </div>
                        </li>
                        
                        <li className="font-medium">עבור כל פוסט שתרצה להסתיר:
                          <div className="text-gray-600 space-y-2 mr-5 mt-1">
                            <div className="flex items-start">
                              <span className="min-w-[20px] text-center">א.</span>
                              <span>לחץ על שלוש הנקודות (⋯) בפינה הימנית העליונה של הפוסט</span>
                            </div>
                            <div className="flex items-start">
                              <span className="min-w-[20px] text-center">ב.</span>
                              <span>בחר באפשרות "מי יכול לראות את זה?" או "פרטיות"</span>
                            </div>
                            <div className="flex items-start">
                              <span className="min-w-[20px] text-center">ג.</span>
                              <span>בחר באפשרות "רק אני"</span>
                            </div>
                          </div>
                        </li>
                        
                        <li className="font-medium">לאחר השבת, חזור על התהליך אך בחר "ציבורי" או "חברים" במקום "רק אני"
                        </li>
                      </ol>
                      
                      <div className="bg-amber-50 p-2 rounded-md mt-3 border border-amber-200">
                        <div className="font-medium">טיפ:</div>
                        <p>שימוש ב"מנהל הפוסטים" של פייסבוק מאפשר לך לעדכן פרטיות של מספר פוסטים בבת אחת.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 mt-3">
                      <a 
                        href="https://www.facebook.com/profile" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        פתח את הפרופיל שלך
                      </a>
                      
                      <a 
                        href="https://www.facebook.com/settings?tab=privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 rounded-md border border-amber-600 text-amber-700 hover:bg-amber-50"
                      >
                        פתח הגדרות פרטיות
                      </a>
                    </div>
                  </div>
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
                  <AlertTitle>עדכון פייסבוק API מאי 2025 (גרסה 22.0)</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="p-3 border border-amber-200 rounded-md bg-white">
                        <strong className="text-amber-800">הודעה חשובה:</strong> בעדכון האחרון של פייסבוק (API v22.0), 
                        חברת פייסבוק הגדירה את כל ההרשאות לניהול עמודים כ"לא תקפות". הבעיה אומתה באמצעות:
                        <ul className="list-disc list-inside mt-1 space-y-1 mr-4 text-sm">
                          <li>בדיקות שנעשו ב-Graph API Explorer</li>
                          <li>ניסיונות התחברות עם הרשאות שונות</li>
                          <li>שימוש בטוקנים ידניים</li>
                        </ul>
                      </div>
                      
                      <div className="p-3 border border-amber-200 rounded-md bg-white">
                        <strong className="text-amber-800">המלצות בינתיים:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 mr-4 text-sm">
                          <li>לניהול עמודי פייסבוק בזמן שבת, השתמש במנהל העמודים של פייסבוק ושנה את הסטטוס ידנית</li>
                          <li>אנחנו ממשיכים לעקוב אחר עדכוני API ונעדכן את האפליקציה ברגע שפייסבוק תחזיר את ההרשאות</li>
                        </ul>
                      </div>
                      
                      <div className="p-3 border border-blue-300 rounded-md bg-blue-50 mt-3">
                        <strong className="text-blue-800">אפשרות לפיתוח ובדיקות:</strong>
                        <p className="mt-1 text-sm">ניתן להשתמש בטוקן גישה מותאם אישית ישירות מ-Graph API Explorer לצורך פיתוח ובדיקות.</p>
                        <div className="flex justify-center mt-2">
                          <Button 
                            onClick={() => setIsTokenDialogOpen(true)} 
                            variant="outline" 
                            className="border-blue-300 text-blue-700"
                          >
                            <Key className="mr-2 h-4 w-4" />
                            הזן טוקן גישה ידני
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-3 flex-row-reverse mt-3">
                        <a 
                          href="https://www.facebook.com/pages/?category=your_pages" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Facebook className="mr-2 h-4 w-4" />
                          נהל את העמודים שלך
                        </a>
                        
                        <Button 
                          onClick={login} 
                          variant="outline" 
                          className="border-amber-300 text-amber-700"
                        >
                          התחבר מחדש לפייסבוק
                        </Button>
                      </div>
                    </div>
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
              
              <Alert className="mt-4 bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
                <AlertTitle>מדריך מפורט לניהול עמודים בשבת</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded-md border border-blue-200 shadow-sm mb-2">
                      <div className="font-bold text-blue-800">למה האפליקציה לא יכולה להסתיר עמודים באופן אוטומטי?</div>
                      <p className="mt-1">בגרסה החדשה של Facebook API (v22.0), פייסבוק שינתה את מדיניות ההרשאות ומגבילה עוד יותר אפליקציות צד שלישי. כרגע אין אפשרות לשנות פרטי עמודים ללא אישור מיוחד ותהליך סקירה מחמיר שנערך על ידי פייסבוק. לכן, הדרך הבטוחה ביותר היא להשתמש בממשק הרשמי של פייסבוק.</p>
                    </div>
                    
                    <div className="mt-1 font-bold text-blue-800">תזמון אוטומטי באמצעות פייסבוק:</div>
                    <div className="border-2 border-blue-300 rounded-md p-3 bg-white shadow-sm">
                      <ol className="list-decimal list-inside mt-1 space-y-2 mr-2">
                        <li className="font-medium">פתח את מנהל העמודים של פייסבוק
                          <div className="text-gray-600 mr-5 mt-1">לחץ על "עמודים" בתפריט הראשי של פייסבוק</div>
                        </li>
                        <li className="font-medium">היכנס לעמוד שברצונך לנהל
                          <div className="text-gray-600 mr-5 mt-1">בחר את העמוד מרשימת העמודים שלך</div>
                        </li>
                        <li className="font-medium">לחץ על "הגדרות" בתחתית התפריט השמאלי
                          <div className="text-gray-600 mr-5 mt-1">האייקון נראה כמו גלגל שיניים</div>
                        </li>
                        <li className="font-medium">בחר ב"כללי" מהתפריט
                          <div className="text-gray-600 mr-5 mt-1">זה בדרך כלל האפשרות הראשונה בתפריט</div>
                        </li>
                        <li className="font-medium">מצא את האפשרות "תזמון עמוד" תחת "נראות עמוד"
                          <div className="text-gray-600 mr-5 mt-1">בחלק עליון של העמוד</div>
                        </li>
                        <li className="font-medium">הגדר תזמון להסתרת העמוד לפני שבת
                          <div className="text-gray-600 mr-5 mt-1">בחר תאריך ושעה לפני כניסת השבת (לדוגמה: יום שישי 16:00)</div>
                        </li>
                        <li className="font-medium">הגדר תזמון לפרסום העמוד אחרי שבת
                          <div className="text-gray-600 mr-5 mt-1">בחר תאריך ושעה אחרי צאת השבת (לדוגמה: מוצאי שבת 20:00)</div>
                        </li>
                        <li className="font-medium">שמור את השינויים
                          <div className="text-gray-600 mr-5 mt-1">לחץ על "שמור שינויים" בתחתית העמוד</div>
                        </li>
                      </ol>
                    </div>
                    
                    <div className="flex justify-center mt-4 space-x-2">
                      <a 
                        href="https://www.facebook.com/pages/?category=your_pages" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        פתח את העמודים שלך
                      </a>
                      
                      <a 
                        href="https://www.facebook.com/business/help/2244749539166489" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        מדריך פייסבוק הרשמי
                      </a>
                    </div>
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