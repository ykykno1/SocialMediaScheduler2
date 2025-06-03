import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Youtube, 
  Instagram, 
  Facebook,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlatformStatus {
  platform: string;
  name: string;
  icon: React.ReactNode;
  isConnected: boolean;
  username?: string;
  error?: string;
  color: string;
}

export default function PlatformsPage() {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPlatformStatuses();
  }, []);

  const loadPlatformStatuses = async () => {
    try {
      setIsLoading(true);
      
      const platformConfigs = [
        { 
          platform: 'youtube', 
          name: 'YouTube', 
          icon: <Youtube className="h-6 w-6 text-red-600" />,
          color: 'red'
        },
        { 
          platform: 'facebook', 
          name: 'Facebook', 
          icon: <Facebook className="h-6 w-6 text-blue-600" />,
          color: 'blue'
        },
        { 
          platform: 'instagram', 
          name: 'Instagram', 
          icon: <Instagram className="h-6 w-6 text-pink-600" />,
          color: 'pink'
        }
      ];

      const statuses = await Promise.all(
        platformConfigs.map(async (config) => {
          try {
            const response = await apiRequest('GET', `/api/${config.platform}/auth-status`);
            if (response.ok) {
              const data = await response.json();
              return {
                ...config,
                isConnected: data.isAuthenticated,
                username: data.platformUsername || data.username,
                error: data.error
              };
            } else {
              return {
                ...config,
                isConnected: false,
                error: 'שגיאת חיבור'
              };
            }
          } catch (error) {
            return {
              ...config,
              isConnected: false,
              error: 'שגיאת רשת'
            };
          }
        })
      );

      setPlatforms(statuses);
    } catch (error) {
      console.error('Failed to load platform statuses:', error);
      toast({
        title: "שגיאה",
        description: "נכשל בטעינת מצב הפלטפורמות",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPlatformStatuses();
    setIsRefreshing(false);
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/${platform}/auth`;
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const response = await apiRequest('POST', `/api/${platform}/disconnect`);
      if (response.ok) {
        toast({
          title: "הניתוק הושלם",
          description: `החשבון נותק מ-${platform} בהצלחה`
        });
        await loadPlatformStatuses();
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "נכשל בניתוק החשבון",
        variant: "destructive"
      });
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  חזרה לדף הבית
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-bold text-gray-900">
                ניהול פלטפורמות
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              רענן
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <Card key={platform.platform} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {platform.icon}
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      {platform.username && (
                        <CardDescription className="text-sm">
                          {platform.username}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  {platform.isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {platform.isConnected ? (
                      <Badge className="bg-green-100 text-green-800">
                        מחובר
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        {platform.error || 'לא מחובר'}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {platform.isConnected ? (
                      <>
                        <Link href={`/platform/${platform.platform}`}>
                          <Button className="w-full" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            נהל תוכן
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleDisconnect(platform.platform)}
                        >
                          נתק חשבון
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleConnect(platform.platform)}
                      >
                        התחבר לחשבון
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>מידע חשוב</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                • <strong>YouTube:</strong> מאפשר הסתרה והצגה של סרטונים באמצעות שינוי מצב הפרטיות
              </p>
              <p>
                • <strong>Facebook:</strong> מאפשר הסתרה והצגה של פוסטים מציבוריים לפרטיים
              </p>
              <p>
                • <strong>Instagram:</strong> מאפשר ארכוב והוצאה מארכיון של פוסטים
              </p>
              <p className="mt-4 font-medium text-gray-900">
                לאחר החיבור, תוכל לנהל את התוכן שלך ולהגדיר הסתרה אוטומטית לשבת
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}