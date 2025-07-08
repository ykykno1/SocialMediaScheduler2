import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Facebook, Lock, Unlock, Users, Megaphone, User, Eye, EyeOff, CheckCircle, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useFacebookPages from "@/hooks/useFacebookPages";

// דמו דאטה למחדשים
interface DemoPost {
  id: string;
  message: string;
  created_time: string;
  privacy: { value: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME' };
  type: 'status' | 'photo' | 'video' | 'link';
  reactions?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  full_picture?: string;
}

interface DemoPage {
  id: string;
  name: string;
  category: string;
  followers_count: number;
  posts: DemoPost[];
}

interface DemoCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  objective: string;
  daily_budget: string;
  reach: number;
  impressions: number;
  campaign_type: 'sponsored_post' | 'video_ad' | 'carousel_ad';
}

// דמו דאטה
const demoPosts: DemoPost[] = [
  {
    id: "demo_user_post_1",
    message: "שבת שלום לכולם! מקווה שתהנו מהשבת המדהימה הזו 🕯️",
    created_time: "2025-07-05T15:30:00+0000",
    privacy: { value: 'PUBLIC' },
    type: 'status',
    reactions: { summary: { total_count: 15 } },
    comments: { summary: { total_count: 3 } }
  },
  {
    id: "demo_user_post_2", 
    message: "התמונות מהטיול המדהים לירושלים! איזה יופי של עיר 📸",
    created_time: "2025-07-03T09:15:00+0000",
    privacy: { value: 'PUBLIC' },
    type: 'photo',
    reactions: { summary: { total_count: 32 } },
    comments: { summary: { total_count: 8 } },
    full_picture: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e3f2fd'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%231976d2' font-size='20' font-family='Arial'%3E🏛️ ירושלים %3C/text%3E%3C/svg%3E"
  },
  {
    id: "demo_user_post_3",
    message: "הרגע סיימתי לקרוא ספר מדהים על יהדות וטכנולוגיה. ממליץ בחום! 📚",
    created_time: "2025-07-01T18:45:00+0000", 
    privacy: { value: 'ONLY_ME' },
    type: 'link',
    reactions: { summary: { total_count: 8 } },
    comments: { summary: { total_count: 2 } }
  }
];

const demoPages: DemoPage[] = [
  {
    id: "demo_page_1",
    name: "קהילת טכנולוגיה יהודית",
    category: "Community Organization",
    followers_count: 1247,
    posts: [
      {
        id: "demo_page_post_1",
        message: "הזמנה לכנס השנתי שלנו בנושא יהדות וטכנולוגיה! פרטים בלינק",
        created_time: "2025-07-04T10:00:00+0000",
        privacy: { value: 'PUBLIC' },
        type: 'link',
        reactions: { summary: { total_count: 45 } },
        comments: { summary: { total_count: 15 } }
      }
    ]
  },
  {
    id: "demo_page_2",
    name: "חדשות טכנולוגיה",
    category: "News & Media Website", 
    followers_count: 5832,
    posts: [
      {
        id: "demo_page_post_2",
        message: "פריצת דרך חדשה בתחום הבינה המלאכותית! מה זה אומר עלינו?",
        created_time: "2025-07-05T08:15:00+0000",
        privacy: { value: 'ONLY_ME' },
        type: 'link',
        reactions: { summary: { total_count: 123 } },
        comments: { summary: { total_count: 34 } }
      }
    ]
  }
];

const demoCampaigns: DemoCampaign[] = [
  {
    id: "demo_campaign_1",
    name: "קמפיין קיץ 2025 - מוצרי טכנולוגיה",
    status: 'ACTIVE',
    objective: "CONVERSIONS",
    daily_budget: "150.00",
    reach: 8450,
    impressions: 15200,
    campaign_type: 'sponsored_post'
  },
  {
    id: "demo_campaign_2", 
    name: "פרסום עמוד עסקי - שירותי ייעוץ",
    status: 'PAUSED',
    objective: "PAGE_LIKES",
    daily_budget: "75.00",
    reach: 3200,
    impressions: 7800,
    campaign_type: 'video_ad'
  }
];

export default function FacebookAdvancedSection() {
  const { isAuthenticated, isAuthenticating, login, logout } = useFacebookAuth();
  const { toast } = useToast();
  
  // טעינת נתונים אמיתיים
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useFacebookPosts();
  const { data: pages = [], isLoading: pagesLoading, refetch: refetchPages } = useFacebookPages();
  
  // העדפות ניהול תוכן
  const [preferences, setPreferences] = useState({
    managePersonalPosts: true,
    manageBusinessPages: true,
    manageCampaigns: true,
    enabledPageIds: ['demo_page_1'] // רק העמוד הראשון מופעל כברירת מחדל
  });

  // מצבי טעינה
  const [isHiding, setIsHiding] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<{
    type: 'hide' | 'restore';
    personal: number;
    pages: number;
    campaigns: number;
  } | null>(null);

  const handleHideAll = async () => {
    setIsHiding(true);
    setLastActionResult(null);
    try {
      // דמוי פעולת הסתרה עם תוצאות מציאותיות
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // מדמה תוצאות ההסתרה
      const result = {
        type: 'hide' as const,
        personal: preferences.managePersonalPosts ? demoPosts.filter(p => p.privacy.value === 'PUBLIC').length : 0,
        pages: preferences.manageBusinessPages ? preferences.enabledPageIds.length * 2 : 0, // דמוי פוסטים בעמודים
        campaigns: preferences.manageCampaigns ? demoCampaigns.filter(c => c.status === 'ACTIVE').length : 0
      };
      
      setLastActionResult(result);
      
      // הודעת הצלחה
      toast({
        title: "תוכן הוסתר בהצלחה",
        description: `הוסתרו: ${result.personal} פוסטים אישיים, ${result.pages} פוסטים מעמודים, ${result.campaigns} קמפיינים`,
      });
      
      // רענון הנתונים
      refetchPosts();
      refetchPages();
      
      console.log('הסתרת כל התוכן לפי העדפות:', preferences);
    } catch (error) {
      toast({
        title: "שגיאה בהסתרת תוכן",
        description: "נסה שוב בעוד כמה רגעים",
        variant: "destructive"
      });
    } finally {
      setIsHiding(false);
    }
  };

  const handleRestoreAll = async () => {
    setIsRestoring(true);
    setLastActionResult(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // מדמה תוצאות השחזור
      const result = {
        type: 'restore' as const,
        personal: preferences.managePersonalPosts ? demoPosts.filter(p => p.privacy.value === 'ONLY_ME').length : 0,
        pages: preferences.manageBusinessPages ? preferences.enabledPageIds.length * 1 : 0, // דמוי פוסטים מוסתרים
        campaigns: preferences.manageCampaigns ? demoCampaigns.filter(c => c.status === 'PAUSED').length : 0
      };
      
      setLastActionResult(result);
      
      // הודעת הצלחה
      toast({
        title: "תוכן שוחזר בהצלחה", 
        description: `שוחזרו: ${result.personal} פוסטים אישיים, ${result.pages} פוסטים מעמודים, ${result.campaigns} קמפיינים`,
      });
      
      // רענון הנתונים
      refetchPosts();
      refetchPages();
      
      console.log('שחזור כל התוכן לפי העדפות:', preferences);
    } catch (error) {
      toast({
        title: "שגיאה בשחזור תוכן",
        description: "נסה שוב בעוד כמה רגעים",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const togglePageEnabled = (pageId: string) => {
    setPreferences(prev => ({
      ...prev,
      enabledPageIds: prev.enabledPageIds.includes(pageId) 
        ? prev.enabledPageIds.filter(id => id !== pageId)
        : [...prev.enabledPageIds, pageId]
    }));
  };

  const getPrivacyIcon = (privacyValue: string) => {
    return privacyValue === 'PUBLIC' ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-500" />;
  };

  const getPrivacyText = (privacyValue: string) => {
    switch (privacyValue) {
      case 'PUBLIC': return 'ציבורי';
      case 'FRIENDS': return 'חברים';
      case 'ONLY_ME': return 'מוסתר';
      default: return privacyValue;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    return status === 'ACTIVE' 
      ? <Badge variant="default" className="bg-green-100 text-green-800">פעיל</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-800">מושהה</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
            פייסבוק - ניהול מתקדם
          </CardTitle>
          <CardDescription>
            נהל פוסטים אישיים, עמודים עסקיים וקמפיינים ממומנים בזמן שבת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>התחברות נדרשת</AlertTitle>
            <AlertDescription>
              התחבר לפייסבוק כדי לנהל את כל סוגי התוכן שלך
            </AlertDescription>
          </Alert>
          <Button 
            onClick={login} 
            disabled={isAuthenticating}
            className="bg-[#1877F2] hover:bg-[#166FE5]"
          >
            <Facebook className="mr-2 h-4 w-4" />
            {isAuthenticating ? "מתחבר..." : "התחבר עם פייסבוק"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
              פייסבוק - ניהול מתקדם
            </CardTitle>
            <CardDescription>
              נהל פוסטים אישיים, עמודים עסקיים וקמפיינים ממומנים
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              מחובר לפייסבוק
            </Badge>
            <Button variant="outline" onClick={logout} size="sm">
              התנתק
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* הגדרות ניהול תוכן - מותאם למובייל */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3">הגדרות ניהול תוכן</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div>
                  <Label htmlFor="personal-posts" className="font-medium">פוסטים אישיים</Label>
                  <p className="text-xs text-gray-600">פוסטים מהפרופיל האישי שלך</p>
                </div>
              </div>
              <Switch
                id="personal-posts"
                checked={preferences.managePersonalPosts}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, managePersonalPosts: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div>
                  <Label htmlFor="business-pages" className="font-medium">עמודים עסקיים</Label>
                  <p className="text-xs text-gray-600">עמודי עסק ודפי פייסבוק שלך</p>
                </div>
              </div>
              <Switch
                id="business-pages"
                checked={preferences.manageBusinessPages}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, manageBusinessPages: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div>
                  <Label htmlFor="campaigns" className="font-medium">קמפיינים ממומנים</Label>
                  <p className="text-xs text-gray-600">פרסומות ממומנות וקמפיינים</p>
                </div>
              </div>
              <Switch
                id="campaigns"
                checked={preferences.manageCampaigns}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, manageCampaigns: checked }))
                }
              />
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* תוצאות פעולה אחרונה */}
        {lastActionResult && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>
              {lastActionResult.type === 'hide' ? 'תוכן הוסתר בהצלחה' : 'תוכן שוחזר בהצלחה'}
            </AlertTitle>
            <AlertDescription>
              {lastActionResult.personal > 0 && `${lastActionResult.personal} פוסטים אישיים `}
              {lastActionResult.pages > 0 && `${lastActionResult.pages} פוסטים מעמודים `}
              {lastActionResult.campaigns > 0 && `${lastActionResult.campaigns} קמפיינים`}
            </AlertDescription>
          </Alert>
        )}

        {/* כפתורי פעולה ראשיים - מותאמים למובייל */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button 
            onClick={handleHideAll}
            disabled={isHiding || isRestoring}
            className="w-full sm:flex-1"
            variant="destructive"
            size="lg"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isHiding ? "מסתיר..." : "הסתר הכל"}
          </Button>
          <Button 
            onClick={handleRestoreAll}
            disabled={isHiding || isRestoring}
            className="w-full sm:flex-1"
            variant="default"
            size="lg"
          >
            <Unlock className="mr-2 h-4 w-4" />
            {isRestoring ? "משחזר..." : "שחזר הכל"}
          </Button>
        </div>

        {/* תצוגת תוכן בטאבים - מותאם למובייל */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="personal" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">פוסטים אישיים</span>
              <span className="sm:hidden">אישי</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">עמודים עסקיים</span>
              <span className="sm:hidden">עמודים</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 text-xs sm:text-sm">
              <Megaphone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">קמפיינים</span>
              <span className="sm:hidden">קמפיינים</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">הפוסטים האישיים שלך</h4>
              <Badge variant="outline">
                {postsLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  `${posts.length || demoPosts.length} פוסטים`
                )}
              </Badge>
            </div>
            
            {postsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(posts.length > 0 ? posts : demoPosts).map((post: any) => (
                  <Card key={post.id} className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-2 break-words">{post.message}</p>
                        {post.full_picture && (
                          <img 
                            src={post.full_picture} 
                            alt="תמונת פוסט" 
                            className="max-w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
                          <span>{new Date(post.created_time).toLocaleDateString('he-IL')}</span>
                          <span>👍 {post.reactions?.summary?.total_count || 0}</span>
                          <span>💬 {post.comments?.summary?.total_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getPrivacyIcon(post.privacy?.value)}
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {getPrivacyText(post.privacy?.value)}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pages" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">העמודים העסקיים שלך</h4>
              <Badge variant="outline">
                {pagesLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  `${pages.length || demoPages.length} עמודים`
                )}
              </Badge>
            </div>
            
            {pagesLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(pages.length > 0 ? pages : demoPages).map((page: any) => (
                  <Card key={page.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium truncate">{page.name}</h5>
                        <p className="text-sm text-gray-500">
                          {page.category} • {page.followers_count?.toLocaleString() || '0'} עוקבים
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={preferences.enabledPageIds.includes(page.id)}
                          onCheckedChange={() => togglePageEnabled(page.id)}
                        />
                        <Label className="text-xs whitespace-nowrap">נהל</Label>
                      </div>
                    </div>
                    
                    {/* פוסטים של העמוד */}
                    <div className="space-y-2">
                      {(page.posts || []).map((post: any) => (
                        <div key={post.id} className="bg-gray-50 rounded p-2">
                          <p className="text-sm mb-1 break-words">{post.message}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap">
                              <span>{new Date(post.created_time).toLocaleDateString('he-IL')}</span>
                              <span>👍 {post.reactions?.summary?.total_count || 0}</span>
                              <span>💬 {post.comments?.summary?.total_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getPrivacyIcon(post.privacy?.value)}
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {getPrivacyText(post.privacy?.value)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!page.posts || page.posts.length === 0) && (
                        <div className="text-center text-gray-500 text-sm py-2">
                          אין פוסטים אחרונים בעמוד זה
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">הקמפיינים הממומנים שלך</h4>
              <Badge variant="outline">{demoCampaigns.length} קמפיינים</Badge>
            </div>
            <div className="space-y-3">
              {demoCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium mb-1 break-words">{campaign.name}</h5>
                        <div className="flex items-center gap-2">
                          {getCampaignStatusBadge(campaign.status)}
                          <Badge variant="outline" className="text-xs">
                            {campaign.campaign_type === 'sponsored_post' ? 'פוסט ממומן' :
                             campaign.campaign_type === 'video_ad' ? 'פרסומת וידאו' : 'פרסומת קרוסלה'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex justify-between sm:block">
                        <span className="font-medium">תקציב יומי:</span>
                        <span className="sm:block">₪{campaign.daily_budget}</span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="font-medium">הגעה:</span>
                        <span className="sm:block">{campaign.reach.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="font-medium">יעד:</span>
                        <span className="sm:block">{campaign.objective}</span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="font-medium">הצגות:</span>
                        <span className="sm:block">{campaign.impressions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}