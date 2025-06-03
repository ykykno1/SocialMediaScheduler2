import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  Settings, 
  Shield, 
  Youtube, 
  Instagram, 
  Facebook,
  Play,
  LogOut,
  Crown,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { User, ConnectedAccount, Subscription, ShabbatTimes } from '@shared/schema';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTimes | null>(null);
  const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Check for Google OAuth success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuthSuccess = urlParams.get('google_auth_success');
    const userParam = urlParams.get('user');
    
    if (googleAuthSuccess && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('shabbat-robot-user', JSON.stringify(user));
        toast({
          title: 'התחברת בהצלחה עם Google!',
          description: `ברוך הבא ${user.firstName}`
        });
        // Clean URL
        window.history.replaceState({}, document.title, '/');
      } catch (error) {
        console.error('Failed to parse Google auth user:', error);
      }
    }
    
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user from localStorage (simple auth)
      const userData = localStorage.getItem('shabbat-robot-user');
      if (!userData) {
        setLocation('/login');
        return;
      }

      const parsedUser = JSON.parse(userData) as User;
      setUser(parsedUser);

      // Check existing auth tokens using the original system
      const platforms = ['youtube', 'facebook', 'instagram'];
      const connectedPlatforms = [];
      
      for (const platform of platforms) {
        try {
          const response = await apiRequest('GET', `/api/${platform}/auth-status`);
          if (response.ok) {
            const status = await response.json();
            if (status.isAuthenticated) {
              connectedPlatforms.push({
                id: platform,
                platform,
                platformUsername: status.platformUsername || status.username || 'Connected',
                isActive: true
              });
            }
          }
        } catch (error) {
          // Silent fail for platforms that aren't connected
        }
      }
      
      // Convert to proper ConnectedAccount format
      const properConnectedAccounts = connectedPlatforms.map(platform => ({
        id: platform.id,
        userId: parsedUser.id,
        platform: platform.platform as any,
        platformUserId: platform.id,
        platformUsername: platform.platformUsername,
        profilePictureUrl: undefined,
        accessToken: 'connected',
        refreshToken: undefined,
        expiresAt: undefined,
        isActive: platform.isActive,
        lastSync: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      setConnectedAccounts(properConnectedAccounts);
      setEnabledPlatforms(properConnectedAccounts.map(acc => acc.platform));

      // Load subscription
      const subResponse = await apiRequest('GET', `/api/users/${parsedUser.id}/subscription`);
      if (subResponse.ok) {
        const sub = await subResponse.json();
        setSubscription(sub);
      }

      // Load Shabbat times with default location (Jerusalem)
      const timesResponse = await apiRequest('GET', '/api/shabbat-times?latitude=31.7683&longitude=35.2137');
      if (timesResponse.ok) {
        const times = await timesResponse.json();
        setShabbatTimes(times);
      }

    } catch (error) {
      // Silent fail for initial load
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shabbat-robot-user');
    setLocation('/login');
  };

  const handleConnectPlatform = async (platform: string) => {
    try {
      if (platform === 'youtube') {
        // Get auth URL from server and redirect to Google
        const response = await apiRequest('GET', '/api/youtube/auth');
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.authUrl;
        } else {
          throw new Error('Failed to get YouTube auth URL');
        }
      } else if (platform === 'facebook') {
        window.location.href = '/api/facebook/auth';
      } else if (platform === 'instagram') {
        window.location.href = '/api/instagram/auth';
      } else {
        toast({
          title: 'פלטפורמה לא נתמכת',
          description: `${platform} עדיין לא נתמך`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה בחיבור',
        description: error.message || 'שגיאה לא ידועה',
        variant: 'destructive'
      });
    }
  };

  const handleDisconnectPlatform = async (platform: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להתנתק מ${getPlatformName(platform)}?`)) {
      return;
    }

    try {
      const response = await apiRequest('POST', `/api/${platform}/logout`);
      if (response.ok) {
        toast({
          title: 'התנתקות הצליחה',
          description: `התנתקת בהצלחה מ${getPlatformName(platform)}`,
        });
        // Reload data to update UI
        loadUserData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה בהתנתקות',
        description: error.message || 'שגיאה לא ידועה',
        variant: 'destructive'
      });
    }
  };

  const togglePlatform = (platform: string, enabled: boolean) => {
    if (enabled) {
      setEnabledPlatforms([...enabledPlatforms, platform]);
    } else {
      setEnabledPlatforms(enabledPlatforms.filter(p => p !== platform));
    }
  };

  const handleActivateShabbatMode = async () => {
    if (!subscription) {
      setLocation('/pricing');
      return;
    }

    setIsActivating(true);
    try {
      const response = await apiRequest('POST', '/api/activate-shabbat-mode', {
        enabledPlatforms,
        userId: user?.id
      });

      if (response.ok) {
        toast({
          title: 'מצב שבת הופעל בהצלחה!',
          description: 'הפוסטים יוסתרו אוטומטית כל שבת ויחזרו בצאת השבת'
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה בהפעלת מצב שבת',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="h-5 w-5 text-red-600" />;
      case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      default: return <Play className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'instagram': return 'Instagram';
      case 'facebook': return 'Facebook';
      default: return platform;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">רובוט שבת</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {subscription && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  פרימיום
                </Badge>
              )}
              <span className="text-sm text-gray-600">
                שלום {user?.firstName || user?.username}
              </span>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  מנהל
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Shabbat Times Banner */}
        {shabbatTimes && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-purple-900">
                  שבת פרשת נשא, י"א בסיוון ה'תשפ"ה
                </h2>
                <div className="flex justify-center items-center space-x-8 space-x-reverse text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800">כניסת שבת:</span>
                    <span className="font-semibold text-purple-900">{shabbatTimes.candleLighting}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800">צאת השבת:</span>
                    <span className="font-semibold text-purple-900">{shabbatTimes.havdalah}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">חיבור חשבונות</CardTitle>
                <CardDescription className="text-right">
                  חבר את החשבונות ברשתות החברתיות שלך כדי להתחיל
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['youtube', 'facebook', 'instagram', 'tiktok'].map((platform) => {
                    const connectedAccount = connectedAccounts.find(acc => acc.platform === platform);
                    const isConnected = !!connectedAccount;
                    
                    return (
                      <Card key={platform} className={`transition-all hover:shadow-md ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                        <CardContent className="p-4 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            {getPlatformIcon(platform)}
                            <div>
                              <h3 className="font-medium text-sm">{getPlatformName(platform)}</h3>
                              {isConnected ? (
                                <div className="space-y-2">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    מחובר
                                  </Badge>
                                  <div className="text-xs text-gray-600">
                                    {connectedAccount?.platformUsername}
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    <Link href={`/platform/${platform}`}>
                                      <Button size="sm" variant="outline" className="text-xs w-full">
                                        נהל תוכן
                                      </Button>
                                    </Link>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                                      onClick={() => handleDisconnectPlatform(platform)}
                                    >
                                      התנתק
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs mt-2"
                                  onClick={() => handleConnectPlatform(platform)}
                                >
                                  חבר חשבון
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Shabbat Mode Activation */}
            {connectedAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">הפעלת מצב שבת</CardTitle>
                  <CardDescription className="text-right">
                    הפעל הסתרה אוטומטית של פוסטים בכל שבת
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Platform Selection */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 text-right">בחר פלטפורמות להסתרה:</h4>
                    <div className="space-y-3">
                      {connectedAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between">
                          <Switch
                            id={account.platform}
                            checked={enabledPlatforms.includes(account.platform)}
                            onCheckedChange={(checked) => togglePlatform(account.platform, checked)}
                          />
                          <Label htmlFor={account.platform} className="flex items-center space-x-2 cursor-pointer">
                            <span className="text-sm">{getPlatformName(account.platform)}</span>
                            {getPlatformIcon(account.platform)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Activation Button */}
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      onClick={handleActivateShabbatMode}
                      disabled={isActivating || enabledPlatforms.length === 0}
                    >
                      {isActivating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      הפעל מצב שבת
                    </Button>
                    
                    {enabledPlatforms.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        יש לבחור לפחות פלטפורמה אחת
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Shabbat Times */}
            {shabbatTimes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center">
                    <Calendar className="h-5 w-5 ml-2" />
                    זמני שבת
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <h3 className="font-medium text-sm mb-2">שבת פרשת נשא</h3>
                    <p className="text-xs text-gray-600">י"א בסיוון ה'תשפ"ה</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">הדלקת נרות:</span>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 ml-1" />
                        {new Date(shabbatTimes.candleLighting).toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">הבדלה:</span>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 ml-1" />
                        {new Date(shabbatTimes.havdalah).toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">סטטוס מנוי</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">
                      {subscription.plan === 'youtube_only' ? 'YouTube בלבד' : 'כל הרשתות'}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      ₪{subscription.price} לחודש
                    </p>
                    <p className="text-xs text-gray-500">
                      מנוי פעיל עד {subscription.endDate && new Date(subscription.endDate).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">לא פעיל</p>
                    <Link href="/pricing">
                      <Button size="sm" className="w-full">
                        שדרג למנוי פרימיום
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}