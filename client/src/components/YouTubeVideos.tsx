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
  console.log('YouTube component rendered with hideAllDisabled:', hideAllDisabled);
  console.log('Component version: v2.0 - With logout button');
  
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
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את כל הסרטונים הציבוריים? פעולה זו תהפוך את כל הסרטונים לפרטיים.")) {
      setHideAllDisabled(true);
      console.log('Setting hideAllDisabled to true');
      await hideAllVideos();
    }
  };
  
  const handleRestoreAll = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את כל הסרטונים? פעולה זו תהפוך את כל הסרטונים לציבוריים.")) {
      setHideAllDisabled(false);
      console.log('Setting hideAllDisabled to false');
      await restoreAllVideos();
    }
  };

  const handleLogout = () => {
    if (window.confirm("האם אתה בטוח שברצונך להתנתק מיוטיוב?")) {
      logout();
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            טוען סרטוני YouTube...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            שגיאה בטעינת הסרטונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">לא ניתן לטעון את רשימת הסרטונים</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            ניהול סרטוני YouTube ({videos.length})
          </CardTitle>
          <Button 
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "מתנתק..." : "התנתק"}
          </Button>
        </div>
        <CardDescription>
          נהל את הפרטיות של הסרטונים שלך בערוץ YouTube
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleHideAll}
            variant="destructive"
            disabled={hideAllDisabled || isHiding || videos.filter(v => v.privacyStatus === "public").length === 0}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            {isHiding ? "מסתיר..." : "הסתר הכל"}
          </Button>
          
          <Button 
            onClick={handleRestoreAll}
            variant="default"
            disabled={isRestoring || videos.filter(v => v.privacyStatus === "private").length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isRestoring ? "משחזר..." : "שחזר הכל"}
          </Button>
          
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            רענן רשימה
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">הכל ({videos.length})</TabsTrigger>
            <TabsTrigger value="public">
              ציבורי ({videos.filter(v => v.privacyStatus === "public").length})
            </TabsTrigger>
            <TabsTrigger value="private">
              פרטי ({videos.filter(v => v.privacyStatus === "private").length})
            </TabsTrigger>
            <TabsTrigger value="unlisted">
              לא רשום ({videos.filter(v => v.privacyStatus === "unlisted").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredVideos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                אין סרטונים להצגה בקטגוריה זו
              </p>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="flex items-start space-x-4 p-4">
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-40 h-24 object-cover rounded-md"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI4MCIgeT0iNDUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+YouTube</dGV4dD48L3N2Zz4=';
                          }}
                        />
                        <Badge 
                          className={`absolute bottom-1 right-1 text-xs ${
                            video.privacyStatus === "public" 
                              ? "bg-green-500 hover:bg-green-600" 
                              : video.privacyStatus === "private"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                          }`}
                        >
                          {video.privacyStatus === "public" && "ציבורי"}
                          {video.privacyStatus === "private" && "פרטי"}
                          {video.privacyStatus === "unlisted" && "לא רשום"}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span>{new Date(video.publishedAt).toLocaleDateString('he-IL')}</span>
                          {video.viewCount && (
                            <span>{parseInt(video.viewCount).toLocaleString('he-IL')} צפיות</span>
                          )}
                          {video.likeCount && (
                            <span>{parseInt(video.likeCount).toLocaleString('he-IL')} לייקים</span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {video.privacyStatus === "public" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleHideVideo(video.id)}
                              className="text-xs"
                            >
                              <EyeOff className="h-3 w-3 mr-1" />
                              הסתר
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleShowVideo(video.id)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              פרסם
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default YouTubeVideos;