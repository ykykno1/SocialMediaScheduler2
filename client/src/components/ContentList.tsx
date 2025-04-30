import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SocialPlatformIcon from './SocialPlatformIcon';
import ApiService from '../services/apiService';
import AuthService from '../services/authService';
import CONFIG from '../config';

interface ContentListProps {
  onBackToDashboard: () => void;
}

const ContentList: React.FC<ContentListProps> = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<string>('facebook');
  const [contentItems, setContentItems] = useState<Record<string, any[]>>({
    facebook: [],
    instagram: [],
    youtube: [],
    tiktok: []
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    facebook: false,
    instagram: false,
    youtube: false,
    tiktok: false
  });
  const [updatingItems, setUpdatingItems] = useState<Record<string, string[]>>({
    facebook: [],
    instagram: [],
    youtube: [],
    tiktok: []
  });
  const { toast } = useToast();

  // Get platform name in Hebrew
  const getPlatformDisplayName = (platform: string): string => {
    const displayNames: Record<string, string> = {
      facebook: 'פייסבוק',
      instagram: 'אינסטגרם',
      youtube: 'יוטיוב',
      tiktok: 'טיקטוק'
    };
    return displayNames[platform] || platform;
  };

  // Function to load content items for a platform
  const loadContentItems = async (platform: string) => {
    if (!AuthService.isAuthenticated(platform)) {
      return;
    }

    setLoading(prev => ({ ...prev, [platform]: true }));

    try {
      const result = await ApiService.getContentItems(platform);
      
      // Process and normalize results based on platform
      let normalizedItems = [];
      
      switch (platform) {
        case 'facebook':
          normalizedItems = result.data.map((item: any) => ({
            id: item.id,
            title: item.message || '(ללא כותרת)',
            date: new Date(item.created_time),
            privacyStatus: 'public', // Simulated status
            url: `https://facebook.com/${item.id}`,
            isHidden: false // Simulated visibility state
          }));
          break;
          
        case 'instagram':
          normalizedItems = result.data.map((item: any) => ({
            id: item.id,
            title: item.caption || '(ללא כותרת)',
            date: new Date(item.timestamp),
            mediaUrl: item.media_url,
            url: item.permalink,
            mediaType: item.media_type,
            isHidden: false // Simulated visibility state
          }));
          break;
          
        case 'youtube':
          normalizedItems = result.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            date: new Date(item.snippet.publishedAt),
            thumbnailUrl: item.snippet.thumbnails?.default?.url,
            privacyStatus: item.status.privacyStatus,
            url: `https://youtube.com/watch?v=${item.id}`,
            isHidden: item.status.privacyStatus === 'private'
          }));
          break;
          
        case 'tiktok':
          normalizedItems = result.data.videos.map((item: any) => ({
            id: item.id,
            title: item.title || '(ללא כותרת)',
            date: new Date(item.create_time * 1000),
            url: item.share_url,
            isHidden: false // Simulated visibility state
          }));
          break;
      }
      
      setContentItems(prev => ({ ...prev, [platform]: normalizedItems }));
    } catch (error) {
      toast({
        title: 'שגיאה בטעינת פריטים',
        description: `לא ניתן לטעון פריטים מ${getPlatformDisplayName(platform)}: ${(error as Error).message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Function to toggle content visibility
  const toggleContentVisibility = async (platform: string, contentId: string, isHidden: boolean) => {
    // Add to updating items
    setUpdatingItems(prev => ({
      ...prev,
      [platform]: [...prev[platform], contentId]
    }));

    try {
      const action = isHidden ? CONFIG.ACTIONS.RESTORE : CONFIG.ACTIONS.HIDE;
      await ApiService.updateContentVisibility(platform, contentId, action);
      
      // Update the local state to reflect the change
      setContentItems(prev => ({
        ...prev,
        [platform]: prev[platform].map(item => 
          item.id === contentId ? { ...item, isHidden: !isHidden } : item
        )
      }));
      
      toast({
        title: isHidden ? 'התוכן הוחזר' : 'התוכן הוסתר',
        description: `הפעולה בוצעה בהצלחה.`
      });
    } catch (error) {
      toast({
        title: 'שגיאה בעדכון הגדרות פרטיות',
        description: `לא ניתן לעדכן את הפריט: ${(error as Error).message}`,
        variant: 'destructive'
      });
    } finally {
      // Remove from updating items
      setUpdatingItems(prev => ({
        ...prev,
        [platform]: prev[platform].filter(id => id !== contentId)
      }));
    }
  };

  // Load content when tab changes
  useEffect(() => {
    if (activeTab && AuthService.isAuthenticated(activeTab)) {
      loadContentItems(activeTab);
    }
  }, [activeTab]);

  // Format date to readable string
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Determine which platforms are connected
  const connectedPlatforms = ['facebook', 'instagram', 'youtube', 'tiktok']
    .filter(platform => AuthService.isAuthenticated(platform));
  
  if (connectedPlatforms.length === 0) {
    return (
      <Card className="mb-6">
        <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3 flex justify-between items-center">
          <h2 className="font-bold text-[#3466ad]">רשימת תוכן</h2>
          <Button 
            variant="ghost" 
            className="ml-2"
            onClick={onBackToDashboard}
          >
            חזרה לדשבורד
          </Button>
        </div>
        <CardContent className="p-6 text-center">
          <p className="mb-4">אין פלטפורמות מחוברות. חבר לפחות פלטפורמה אחת כדי להציג תוכן.</p>
          <Button onClick={onBackToDashboard}>
            חזרה להגדרות
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-[#3466ad]">רשימת תוכן</h2>
        <Button 
          variant="ghost" 
          className="ml-2"
          onClick={onBackToDashboard}
        >
          חזרה לדשבורד
        </Button>
      </div>
      <CardContent className="p-4">
        <Tabs defaultValue={connectedPlatforms[0]} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid grid-cols-4 gap-2">
            {connectedPlatforms.includes('facebook') && (
              <TabsTrigger value="facebook" className="flex items-center justify-center space-x-2 space-x-reverse">
                <SocialPlatformIcon platform="facebook" size={16} />
                <span>פייסבוק</span>
              </TabsTrigger>
            )}
            {connectedPlatforms.includes('instagram') && (
              <TabsTrigger value="instagram" className="flex items-center justify-center space-x-2 space-x-reverse">
                <SocialPlatformIcon platform="instagram" size={16} />
                <span>אינסטגרם</span>
              </TabsTrigger>
            )}
            {connectedPlatforms.includes('youtube') && (
              <TabsTrigger value="youtube" className="flex items-center justify-center space-x-2 space-x-reverse">
                <SocialPlatformIcon platform="youtube" size={16} />
                <span>יוטיוב</span>
              </TabsTrigger>
            )}
            {connectedPlatforms.includes('tiktok') && (
              <TabsTrigger value="tiktok" className="flex items-center justify-center space-x-2 space-x-reverse">
                <SocialPlatformIcon platform="tiktok" size={16} />
                <span>טיקטוק</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {connectedPlatforms.map(platform => (
            <TabsContent key={platform} value={platform} className="space-y-4">
              {loading[platform] ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3466ad]" />
                  <span className="mr-3">טוען פריטים...</span>
                </div>
              ) : contentItems[platform].length === 0 ? (
                <div className="text-center p-8 border rounded-md bg-gray-50">
                  <p className="text-gray-500">לא נמצאו פריטי תוכן ב{getPlatformDisplayName(platform)}.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => loadContentItems(platform)}
                    className="mt-4"
                  >
                    רענון
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">סה"כ: {contentItems[platform].length} פריטים</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadContentItems(platform)}
                    >
                      רענון
                    </Button>
                  </div>
                  
                  <div className="divide-y">
                    {contentItems[platform].map(item => (
                      <div key={item.id} className="py-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                          <div className="text-sm text-gray-500">{formatDate(item.date)}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={`ml-3 text-sm px-2 py-1 rounded-full ${
                            item.isHidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.isHidden ? 'מוסתר' : 'מוצג'}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            disabled={updatingItems[platform].includes(item.id)}
                            onClick={() => toggleContentVisibility(platform, item.id, item.isHidden)}
                          >
                            {updatingItems[platform].includes(item.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : item.isHidden ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentList;