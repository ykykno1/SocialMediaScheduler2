import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Shield, 
  Youtube, 
  Instagram, 
  Facebook,
  Play,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { YouTubeVideo, FacebookPost, ContentItem } from '@shared/schema';

export default function PlatformPage() {
  const [, params] = useRoute('/platform/:platform');
  const { toast } = useToast();
  const platform = params?.platform as string;
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    hidden: 0,
    visible: 0,
    locked: 0
  });

  useEffect(() => {
    if (platform) {
      loadPlatformData();
    }
  }, [platform]);

  const loadPlatformData = async () => {
    try {
      // Check connection status
      const statusResponse = await apiRequest('GET', `/api/${platform}/auth-status`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setIsConnected(status.isAuthenticated);
        
        if (status.isAuthenticated) {
          // Load content
          await loadContent();
        }
      }
    } catch (error) {
      console.error('Failed to load platform data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      let contentResponse;
      
      switch (platform) {
        case 'youtube':
          contentResponse = await apiRequest('GET', '/api/youtube/videos');
          break;
        case 'facebook':
          contentResponse = await apiRequest('GET', '/api/facebook/posts');
          break;
        case 'instagram':
          contentResponse = await apiRequest('GET', '/api/instagram/posts');
          break;
        default:
          return;
      }

      if (contentResponse.ok) {
        const data = await contentResponse.json();
        const normalizedContent = normalizeContent(data, platform);
        setContent(normalizedContent);
        calculateStats(normalizedContent);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  const normalizeContent = (data: any[], platformType: string): ContentItem[] => {
    return data.map(item => {
      if (platformType === 'youtube') {
        const video = item as YouTubeVideo;
        return {
          id: video.id,
          platform: 'youtube' as const,
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          thumbnailUrl: video.thumbnailUrl,
          privacyStatus: video.privacyStatus,
          originalPrivacyStatus: video.privacyStatus,
          isHidden: video.privacyStatus === 'private'
        };
      } else if (platformType === 'facebook') {
        const post = item as FacebookPost;
        return {
          id: post.id,
          platform: 'facebook' as const,
          title: post.message || 'פוסט ללא כותרת',
          description: post.message,
          publishedAt: post.created_time,
          privacyStatus: post.privacy.value,
          originalPrivacyStatus: post.privacy.value,
          isHidden: post.privacy.value === 'SELF'
        };
      }
      return item as ContentItem;
    });
  };

  const calculateStats = (contentList: ContentItem[]) => {
    const total = contentList.length;
    const hidden = contentList.filter(item => item.isHidden).length;
    const visible = total - hidden;
    const locked = contentList.filter(item => item.privacyStatus === 'locked').length;
    
    setStats({ total, hidden, visible, locked });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContent();
    setIsRefreshing(false);
    toast({
      title: 'התוכן עודכן',
      description: 'הרשימה נטענה מחדש בהצלחה'
    });
  };

  const handleToggleVisibility = async (contentId: string, currentlyHidden: boolean) => {
    try {
      const action = currentlyHidden ? 'restore' : 'hide';
      let endpoint = '';
      
      switch (platform) {
        case 'youtube':
          endpoint = `/api/youtube/videos/${contentId}/${action}`;
          break;
        case 'facebook':
          endpoint = `/api/facebook/posts/${contentId}/${action}`;
          break;
        case 'instagram':
          endpoint = `/api/instagram/posts/${contentId}/${action}`;
          break;
      }

      const response = await apiRequest('POST', endpoint);
      
      if (response.ok) {
        // Update local state
        setContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, isHidden: !currentlyHidden }
            : item
        ));
        
        toast({
          title: currentlyHidden ? 'התוכן הוצג' : 'התוכן הוסתר',
          description: 'הפעולה בוצעה בהצלחה'
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleLock = async (contentId: string) => {
    try {
      const response = await apiRequest('POST', `/api/${platform}/content/${contentId}/toggle-lock`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, privacyStatus: result.isLocked ? 'locked' : item.originalPrivacyStatus }
            : item
        ));
        
        toast({
          title: result.isLocked ? 'התוכן ננעל' : 'הנעילה הוסרה',
          description: result.isLocked ? 'התוכן לא ישוחזר אוטומטית' : 'התוכן ישוחזר אוטומטית'
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'youtube': return <Youtube className="h-6 w-6 text-red-600" />;
      case 'instagram': return <Instagram className="h-6 w-6 text-pink-600" />;
      case 'facebook': return <Facebook className="h-6 w-6 text-blue-600" />;
      default: return <Play className="h-6 w-6" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'instagram': return 'Instagram';
      case 'facebook': return 'Facebook';
      default: return platform;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              {getPlatformIcon()}
              <h1 className="text-xl font-bold text-gray-900">
                ניהול תוכן {getPlatformName()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  מחובר
                </Badge>
              ) : (
                <Badge variant="destructive">
                  לא מחובר
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing || !isConnected}
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!isConnected ? (
          // Not connected state
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">החשבון לא מחובר</h3>
              <p className="text-gray-600 mb-6">
                כדי לנהל תוכן ב-{getPlatformName()}, יש להתחבר תחילה לחשבון שלך
              </p>
              <Button onClick={() => window.location.href = `/api/${platform}/auth`}>
                התחבר ל-{getPlatformName()}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-600">סה"כ פריטים</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.visible}</p>
                    <p className="text-sm text-gray-600">גלויים</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.hidden}</p>
                    <p className="text-sm text-gray-600">מוסתרים</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.locked}</p>
                    <p className="text-sm text-gray-600">נעולים</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">רשימת תוכן</CardTitle>
                <CardDescription className="text-right">
                  נהל את הגלויות והסתרה של התוכן שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">לא נמצא תוכן</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          
                          {/* Content Info */}
                          <div className="flex items-start space-x-4 flex-1">
                            {item.thumbnailUrl && (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            )}
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatDate(item.publishedAt || '')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center space-x-3">
                            
                            {/* Status Badges */}
                            <div className="flex flex-col space-y-1">
                              {item.isHidden ? (
                                <Badge variant="destructive" className="text-xs">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  מוסתר
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  גלוי
                                </Badge>
                              )}
                              
                              {item.privacyStatus === 'locked' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  נעול
                                </Badge>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col space-y-2">
                              
                              {/* Visibility Toggle */}
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`visibility-${item.id}`} className="text-xs">
                                  {item.isHidden ? 'הצג' : 'הסתר'}
                                </Label>
                                <Switch
                                  id={`visibility-${item.id}`}
                                  checked={!item.isHidden}
                                  onCheckedChange={() => handleToggleVisibility(item.id, item.isHidden)}
                                />
                              </div>

                              {/* Lock Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleLock(item.id)}
                                className="text-xs"
                              >
                                {item.privacyStatus === 'locked' ? (
                                  <Unlock className="h-3 w-3 mr-1" />
                                ) : (
                                  <Lock className="h-3 w-3 mr-1" />
                                )}
                                {item.privacyStatus === 'locked' ? 'בטל נעילה' : 'נעל'}
                              </Button>
                            </div>

                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}