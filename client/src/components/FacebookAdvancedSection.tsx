import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Facebook, Lock, Unlock, Users, Megaphone, User, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useFacebookAuth from "@/hooks/useFacebookAuth";

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

  const handleHideAll = async () => {
    setIsHiding(true);
    try {
      // כאן נקרא לפונקציית הדמו
      await new Promise(resolve => setTimeout(resolve, 2000)); // דמוי טעינה
      console.log('הסתרת כל התוכן לפי העדפות:', preferences);
    } finally {
      setIsHiding(false);
    }
  };

  const handleRestoreAll = async () => {
    setIsRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // דמוי טעינה
      console.log('שחזור כל התוכן לפי העדפות:', preferences);
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
        {/* הגדרות ניהול תוכן */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">הגדרות ניהול תוכן</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <Label htmlFor="personal-posts">פוסטים אישיים</Label>
              </div>
              <Switch
                id="personal-posts"
                checked={preferences.managePersonalPosts}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, managePersonalPosts: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <Label htmlFor="business-pages">עמודים עסקיים</Label>
              </div>
              <Switch
                id="business-pages"
                checked={preferences.manageBusinessPages}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, manageBusinessPages: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-orange-600" />
                <Label htmlFor="campaigns">קמפיינים ממומנים</Label>
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

        {/* כפתורי פעולה ראשיים */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleHideAll}
            disabled={isHiding || isRestoring}
            className="flex-1"
            variant="destructive"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isHiding ? "מסתיר..." : "הסתר הכל לפי הגדרות"}
          </Button>
          <Button 
            onClick={handleRestoreAll}
            disabled={isHiding || isRestoring}
            className="flex-1"
            variant="default"
          >
            <Unlock className="mr-2 h-4 w-4" />
            {isRestoring ? "משחזר..." : "שחזר הכל לפי הגדרות"}
          </Button>
        </div>

        {/* תצוגת תוכן בטאבים */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              פוסטים אישיים
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              עמודים עסקיים
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              קמפיינים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">הפוסטים האישיים שלך</h4>
              <Badge variant="outline">{demoPosts.length} פוסטים</Badge>
            </div>
            <div className="space-y-3">
              {demoPosts.map((post) => (
                <Card key={post.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm mb-2">{post.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(post.created_time).toLocaleDateString('he-IL')}</span>
                        <span>👍 {post.reactions?.summary.total_count || 0}</span>
                        <span>💬 {post.comments?.summary.total_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPrivacyIcon(post.privacy.value)}
                      <Badge variant="outline" className="text-xs">
                        {getPrivacyText(post.privacy.value)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">העמודים העסקיים שלך</h4>
              <Badge variant="outline">{demoPages.length} עמודים</Badge>
            </div>
            <div className="space-y-4">
              {demoPages.map((page) => (
                <Card key={page.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium">{page.name}</h5>
                      <p className="text-sm text-gray-500">{page.category} • {page.followers_count.toLocaleString()} עוקבים</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={preferences.enabledPageIds.includes(page.id)}
                        onCheckedChange={() => togglePageEnabled(page.id)}
                      />
                      <Label className="text-xs">נהל</Label>
                    </div>
                  </div>
                  {page.posts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded p-2 mt-2">
                      <p className="text-sm mb-1">{post.message}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(post.created_time).toLocaleDateString('he-IL')}</span>
                          <span>👍 {post.reactions?.summary.total_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPrivacyIcon(post.privacy.value)}
                          <Badge variant="outline" className="text-xs">
                            {getPrivacyText(post.privacy.value)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">הקמפיינים הממומנים שלך</h4>
              <Badge variant="outline">{demoCampaigns.length} קמפיינים</Badge>
            </div>
            <div className="space-y-3">
              {demoCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{campaign.name}</h5>
                        {getCampaignStatusBadge(campaign.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">תקציב יומי:</span> ₪{campaign.daily_budget}
                        </div>
                        <div>
                          <span className="font-medium">הגעה:</span> {campaign.reach.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">יעד:</span> {campaign.objective}
                        </div>
                        <div>
                          <span className="font-medium">הצגות:</span> {campaign.impressions.toLocaleString()}
                        </div>
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