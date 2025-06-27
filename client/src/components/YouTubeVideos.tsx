import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, RefreshCw, Youtube, AlertCircle } from "lucide-react";
import useYouTubeVideos from '@/hooks/useYouTubeVideos';
import ContentLockButton from './ContentLockButton';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale/he';

const YouTubeVideos = () => {
  const { 
    videos, 
    isLoading, 
    error, 
    hideVideo, 
    showVideo, 
    hideAllVideos, 
    restoreAllVideos, 
    disconnect,
    isHiding, 
    isRestoring,
    isDisconnecting,
    refetch
  } = useYouTubeVideos();
  
  const [activeTab, setActiveTab] = useState("all");
  
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
  
  const handleHideAll = () => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את כל הסרטונים? כל הסרטונים יהפכו לפרטיים ולא יהיו נגישים לציבור.")) {
      hideAllVideos();
    }
  };
  
  const handleRestoreAll = () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את כל הסרטונים? כל הסרטונים יחזרו למצבם הקודם.")) {
      restoreAllVideos();
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
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
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
          <CardTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            סרטוני YouTube
          </CardTitle>
          <CardDescription>ניהול הסרטונים בערוץ YouTube שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה בטעינת הסרטונים</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'אירעה שגיאה בטעינת הסרטונים מ-YouTube. נסה שוב מאוחר יותר.'}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  // When there are no videos
  if (videos.length === 0) {
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>לא נמצאו סרטונים</AlertTitle>
            <AlertDescription>
              לא נמצאו סרטונים בערוץ YouTube שלך או שאין לך הרשאות גישה לסרטונים.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Youtube className="mr-2 h-5 w-5 text-red-600" />
          סרטוני YouTube
        </CardTitle>
        <CardDescription>ניהול הסרטונים בערוץ YouTube שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">הגנה על תוכן קיים</AlertTitle>
          <AlertDescription className="text-blue-700">
            סרטונים שהיו פרטיים כבר מלכתחילה מסומנים כ"מוסתר מלכתחילה" ולא ישוחזרו אוטומטית.
            ניתן לנעול סרטונים נוספים כדי למנוע שחזור אוטומטי בסוף שבת.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-between mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
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
          </Tabs>

          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              רענן
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (window.confirm("האם אתה בטוח שברצונך להתנתק מיוטיוב? זה יסיר את החיבור שלך לחשבון.")) {
                  disconnect();
                }
              }}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "מתנתק..." : "התנתק מיוטיוב"}
            </Button>
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>אין סרטונים</AlertTitle>
            <AlertDescription>
              לא נמצאו סרטונים בקטגוריה זו.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>סרטון</TableHead>
                  <TableHead>פרסום</TableHead>
                  <TableHead>תאריך פרסום</TableHead>
                  <TableHead>מנעול</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map(video => (
                  <TableRow key={video.id}>
                    <TableCell className="flex items-center space-x-3">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title} 
                          className="w-24 h-auto rounded ml-3"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center ml-3">
                          <Youtube className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="mr-3 flex-1">
                        <div className="font-medium truncate max-w-xs">{video.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {video.description || 'אין תיאור'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {video.privacyStatus === "public" && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          ציבורי
                        </Badge>
                      )}
                      {video.privacyStatus === "private" && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          פרטי
                        </Badge>
                      )}
                      {video.privacyStatus === "unlisted" && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          לא רשום
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(video.publishedAt), {
                        addSuffix: true,
                        locale: he
                      })}
                    </TableCell>
                    <TableCell>
                      <ContentLockButton 
                        platform="youtube" 
                        contentId={video.id}
                        currentPrivacyStatus={video.privacyStatus}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      {video.privacyStatus === "public" ? (
                        <Button 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleHideVideo(video.id)}
                          disabled={isHiding}
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          הסתר
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => handleShowVideo(video.id)}
                          disabled={isRestoring}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          הצג
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-gray-500">
          סה"כ: {videos.length} סרטונים 
          ({videos.filter(v => v.privacyStatus === "public").length} ציבוריים, 
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
            disabled={isHiding || videos.filter(v => v.privacyStatus === "public").length === 0}
            variant="default"
          >
            <EyeOff className="mr-2 h-4 w-4" />
            {isHiding ? "מסתיר..." : "הסתר הכל"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default YouTubeVideos;