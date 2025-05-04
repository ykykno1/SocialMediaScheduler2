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
                <AlertTitle>עדכון חשוב!</AlertTitle>
                <AlertDescription>
                  <div className="font-bold text-amber-800 mt-1 mb-3 text-base">
                    לתשומת לבך: לא ניתן להסתיר פוסטים באופן אוטומטי עקב שינויים בפייסבוק
                  </div>
                  
                  <p className="mb-2">פייסבוק שינתה לאחרונה את מדיניות האבטחה וההרשאות שלה באופן שמונע מאפליקציות כמו זו להסתיר או לשנות תוכן באופן אוטומטי.</p>
                  
                  <div className="p-3 mt-3 mb-3 border-2 border-amber-300 rounded-md bg-amber-50 shadow-sm">
                    <div className="font-bold mb-2 text-center text-amber-800">מדריך מפורט להסתרת תוכן בפייסבוק</div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="font-bold">עבור פוסטים אישיים:</div>
                        <ol className="list-decimal list-inside mt-1 space-y-1 mr-2">
                          <li>היכנסו לפרופיל האישי שלכם</li>
                          <li>עברו לפוסט שתרצו להסתיר</li>
                          <li>לחצו על שלוש הנקודות בפינה הימנית העליונה של הפוסט</li>
                          <li>בחרו באפשרות "מי יכול לראות את זה?"</li>
                          <li>שנו ל"רק אני"</li>
                        </ol>
                        <a 
                          href="https://www.facebook.com/profile" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full mt-2 px-3 py-1.5 text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <Facebook className="mr-2 h-3 w-3 text-[#1877F2]" />
                          פתח את הפרופיל שלך
                        </a>
                      </div>
                      
                      <div>
                        <div className="font-bold">עבור עמודי פייסבוק:</div>
                        <ol className="list-decimal list-inside mt-1 space-y-1 mr-2">
                          <li>גשו ל"עמודים" בתפריט הצדדי של פייסבוק</li>
                          <li>בחרו את העמוד שברצונכם להסתיר</li>
                          <li>לחצו על "הגדרות" בפינה השמאלית התחתונה</li>
                          <li>לחצו על "כללי" מהתפריט הצדדי</li>
                          <li>תחת "נראות עמוד", כבו את האפשרות "פרסם את העמוד"</li>
                        </ol>
                        <a 
                          href="https://www.facebook.com/pages/?category=your_pages" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full mt-2 px-3 py-1.5 text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <Facebook className="mr-2 h-3 w-3 text-[#1877F2]" />
                          פתח את העמודים שלך
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="font-medium text-amber-800 mt-3">
                    אנחנו ממשיכים לעבוד על פתרונות חלופיים, כולל:
                    <ul className="list-disc list-inside mt-1 mr-2">
                      <li>תזכורות לפני שבת</li>
                      <li>מדריכים מפורטים לתזמון מראש</li>
                      <li>ייעוץ לניהול התוכן שלך בצורה שומרת שבת</li>
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
              <Alert className="mt-4 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>מדריך מפורט להסתרת פוסטים</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded-md border border-amber-200 shadow-sm mb-3">
                      <div className="font-bold text-amber-800 mb-1">למה כפתורי ההסתרה לא עובדים?</div>
                      <p>פייסבוק חסמה את האפשרות לאפליקציות צד שלישי לשנות הגדרות פרטיות של פוסטים ללא אישור מיוחד. לכן, עליך להסתיר את הפוסטים באופן ידני.</p>
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
              
              <Alert className="mt-4 bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
                <AlertTitle>מדריך מפורט לניהול עמודים בשבת</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded-md border border-blue-200 shadow-sm mb-2">
                      <div className="font-bold text-blue-800">למה האפליקציה לא יכולה להסתיר עמודים באופן אוטומטי?</div>
                      <p className="mt-1">פייסבוק חסמה את האפשרות לאפליקציות צד שלישי לשנות פרטי עמודים ללא אישור מיוחד. כיום, רק היישום הרשמי של פייסבוק יכול לבצע זאת.</p>
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