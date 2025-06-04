import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Play, Eye, EyeOff, ExternalLink, Unlink, Loader2 } from 'lucide-react';
import useYouTubeAuth from '@/hooks/useYouTubeAuth';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
  viewCount?: string;
  likeCount?: string;
}

export default function YouTubePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { 
    isAuthenticated, 
    isAuthenticating, 
    isLoading, 
    login, 
    logout, 
    isLoggingOut, 
    channelTitle 
  } = useYouTubeAuth();

  // Load videos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/youtube/videos');
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'שגיאה בטעינת הסרטונים');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const hideVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/youtube/videos/${videoId}/hide`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setVideos(videos.map(video => 
          video.id === videoId ? { ...video, privacyStatus: 'private' } : video
        ));
      }
    } catch (error) {
      console.error('Error hiding video:', error);
    }
  };

  const showVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/youtube/videos/${videoId}/show`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setVideos(videos.map(video => 
          video.id === videoId ? { ...video, privacyStatus: 'public' } : video
        ));
      }
    } catch (error) {
      console.error('Error showing video:', error);
    }
  };

  const hideSelectedVideos = async () => {
    for (const videoId of selectedVideos) {
      await hideVideo(videoId);
    }
    setSelectedVideos([]);
  };

  const showSelectedVideos = async () => {
    for (const videoId of selectedVideos) {
      await showVideo(videoId);
    }
    setSelectedVideos([]);
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllVideos = () => {
    setSelectedVideos(videos.map(video => video.id));
  };

  const clearSelection = () => {
    setSelectedVideos([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-gray-600">טוען...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול YouTube</h1>
                <p className="text-gray-600">נהל את הסרטונים שלך בזמן שבת</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {isAuthenticated ? 'מחובר ל-YouTube' : 'לא מחובר ל-YouTube'}
                    </h3>
                    {isAuthenticated && channelTitle && (
                      <p className="text-gray-600">ערוץ: {channelTitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  {!isAuthenticated ? (
                    <Button 
                      onClick={login}
                      disabled={isAuthenticating}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isAuthenticating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          מתחבר...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          התחבר ל-YouTube
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={logout}
                      disabled={isLoggingOut}
                      variant="outline"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          מתנתק...
                        </>
                      ) : (
                        <>
                          <Unlink className="w-4 h-4 mr-2" />
                          התנתק
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Videos Management */}
        {isAuthenticated && (
          <>
            {/* Bulk Actions */}
            {videos.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold">פעולות על סרטונים</h3>
                      <Badge variant="secondary">
                        {selectedVideos.length} נבחרו מתוך {videos.length}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVideos}
                        disabled={selectedVideos.length === videos.length}
                      >
                        בחר הכל
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        disabled={selectedVideos.length === 0}
                      >
                        בטל בחירה
                      </Button>
                      <Button
                        size="sm"
                        onClick={hideSelectedVideos}
                        disabled={selectedVideos.length === 0}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        הסתר נבחרים
                      </Button>
                      <Button
                        size="sm"
                        onClick={showSelectedVideos}
                        disabled={selectedVideos.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        הצג נבחרים
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos Grid */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">טוען סרטונים...</p>
              </div>
            ) : videos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Youtube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">אין סרטונים</h3>
                  <p className="text-gray-500">לא נמצאו סרטונים בערוץ שלך</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card 
                    key={video.id} 
                    className={`cursor-pointer transition-all ${
                      selectedVideos.includes(video.id) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => toggleVideoSelection(video.id)}
                  >
                    <CardContent className="p-0">
                      {/* Thumbnail */}
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={video.privacyStatus === 'public' ? 'default' : 'secondary'}
                            className={
                              video.privacyStatus === 'public' 
                                ? 'bg-green-600' 
                                : video.privacyStatus === 'private'
                                ? 'bg-red-600'
                                : 'bg-yellow-600'
                            }
                          >
                            {video.privacyStatus === 'public' ? 'פומבי' : 
                             video.privacyStatus === 'private' ? 'פרטי' : 'לא רשום'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {video.viewCount || '0'}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(video.publishedAt).toLocaleDateString('he-IL')}
                          </span>
                          <div className="flex gap-2">
                            {video.privacyStatus === 'public' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hideVideo(video.id);
                                }}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                <EyeOff className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showVideo(video.id);
                                }}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}