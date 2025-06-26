import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, RefreshCw, Youtube, AlertCircle, LogOut } from "lucide-react";
import useYouTubeVideos from '@/hooks/useYouTubeVideos';
import useYouTubeAuth from '@/hooks/useYouTubeAuth';

const YouTubeVideos = () => {
  const { 
    videos, 
    isLoading, 
    error, 
    hideVideo, 
    showVideo, 
    hideAllVideos, 
    restoreAllVideos, 
    isHiding, 
    isRestoring,
    refetch
  } = useYouTubeVideos();
  
  const { logout, isLoggingOut } = useYouTubeAuth();
  
  const [activeTab, setActiveTab] = useState("all");
  const [hideAllDisabled, setHideAllDisabled] = useState(false);
  
  console.log('New YouTube component loaded - v3.0');
  console.log('hideAllDisabled state:', hideAllDisabled);
  
  const filteredVideos = videos.filter(video => {
    if (activeTab === "all") return true;
    if (activeTab === "public") return video.privacyStatus === "public";
    if (activeTab === "private") return video.privacyStatus === "private";
    if (activeTab === "unlisted") return video.privacyStatus === "unlisted";
    return true;
  });
  
  const handleHideVideo = (videoId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר סרטון זה? סרטון זה יהפוך לפרטי ולא יהיה נגיש לציבור.")) {
      hideVideo(videoId);
    }
  };
  
  const handleShowVideo = (videoId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר סרטון זה? סרטון זה יהפוך לציבורי ויהיה נגיש לכולם.")) {
      showVideo(videoId);
    }
  };
  
  const handleHideAll = async () => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את כל הסרטונים? כל הסרטונים יהפכו לפרטיים ולא יהיו נגישים לציבור.")) {
      try {
        await hideAllVideos();
        setHideAllDisabled(true);
        console.log('Hide all completed, disabled set to true');
      } catch (error) {
        console.error("Error hiding videos:", error);
      }
    }
  };
  
  const handleRestoreAll = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את כל הסרטונים? כל הסרטונים יחזרו למצבם הקודם.")) {
      try {
        await restoreAllVideos();
        setHideAllDisabled(false);
        console.log('Restore all completed, disabled set to false');
      } catch (error) {
        console.error("Error restoring videos:", error);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm("האם אתה בטוח שברצונך להתנתק מיוטיוב?")) {
      logout();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            סרטוני YouTube
          </CardTitle>
          <CardDescription>ניהול הסרטונים בערוץ YouTube שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            טוען סרטונים...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            שגיאה בטעינת סרטונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Youtube className="mr-2 h-5 w-5 text-red-600" />
              סרטוני YouTube - גרסה חדשה
            </CardTitle>
            <CardDescription>ניהול הסרטונים בערוץ YouTube שלך</CardDescription>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "מתנתק..." : "התנתק"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            סה"כ {videos.length} סרטונים ({videos.filter(v => v.privacyStatus === "public").length} ציבוריים,
            {videos.filter(v => v.privacyStatus === "private").length} פרטיים,
            {videos.filter(v => v.privacyStatus === "unlisted").length} לא רשומים)
          </div>
          <div className="space-x-2">
            <Button 
              onClick={handleRestoreAll} 
              disabled={isRestoring || videos.filter(v => v.privacyStatus === "private").length === 0}
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              {isRestoring ? "משחזר..." : "שחזר הכל"}
            </Button>
            <Button 
              onClick={handleHideAll} 
              disabled={isHiding || videos.filter(v => v.privacyStatus === "public").length === 0 || hideAllDisabled}
              variant="default"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              {isHiding ? "מסתיר..." : hideAllDisabled ? "הוסתר כבר" : "הסתר הכל"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">הכל ({videos.length})</TabsTrigger>
            <TabsTrigger value="public">ציבוריים ({videos.filter(v => v.privacyStatus === "public").length})</TabsTrigger>
            <TabsTrigger value="private">פרטיים ({videos.filter(v => v.privacyStatus === "private").length})</TabsTrigger>
            <TabsTrigger value="unlisted">לא רשומים ({videos.filter(v => v.privacyStatus === "unlisted").length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            <div className="grid gap-4">
              {filteredVideos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{video.title}</h3>
                    <p className="text-sm text-gray-500">פורסם: {new Date(video.publishedAt).toLocaleDateString('he-IL')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={video.privacyStatus === 'public' ? 'default' : 'secondary'}>
                        {video.privacyStatus === 'public' ? 'ציבורי' : 
                         video.privacyStatus === 'private' ? 'פרטי' : 'לא רשום'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {video.privacyStatus === 'public' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleHideVideo(video.id)}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        הסתר
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowVideo(video.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        הצג
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredVideos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  אין סרטונים להצגה בקטגוריה זו
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default YouTubeVideos;