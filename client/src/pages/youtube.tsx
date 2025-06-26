import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Play, Eye, EyeOff, ExternalLink, Unlink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import YouTubeVideos from '@/components/YouTubeVideos';

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
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [channelTitle, setChannelTitle] = useState('');
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get user info
      const userResponse = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);

        // Check platform status
        const platformResponse = await fetch('/api/user/platforms', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (platformResponse.ok) {
          const platforms = await platformResponse.json();
          setIsConnected(platforms.youtube);
          
          if (platforms.youtube) {
            loadVideos();
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectYouTube = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/youtube/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        const error = await response.json();
        setError('שגיאה בהתחברות ל-YouTube: יש צורך בהגדרת Google OAuth');
      }
    } catch (error) {
      setError('Failed to connect to YouTube');
    } finally {
      setLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setIsConnected(false);
        setVideos([]);
        setSelectedVideos([]);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to disconnect');
      }
    } catch (error) {
      setError('Failed to disconnect from YouTube');
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/youtube/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to load videos');
      }
    } catch (error) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const hideVideos = async () => {
    if (selectedVideos.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/youtube/hide', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: selectedVideos })
      });
      
      if (response.ok) {
        await loadVideos();
        setSelectedVideos([]);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to hide videos');
      }
    } catch (error) {
      setError('Failed to hide videos');
    } finally {
      setLoading(false);
    }
  };

  const restoreVideos = async () => {
    if (selectedVideos.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/youtube/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: selectedVideos })
      });
      
      if (response.ok) {
        await loadVideos();
        setSelectedVideos([]);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to restore videos');
      }
    } catch (error) {
      setError('Failed to restore videos');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllPublic = () => {
    const publicVideos = videos.filter(v => v.privacyStatus === 'public').map(v => v.id);
    setSelectedVideos(publicVideos);
  };

  const selectAllPrivate = () => {
    const privateVideos = videos.filter(v => v.privacyStatus === 'private').map(v => v.id);
    setSelectedVideos(privateVideos);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Check URL params for connection status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('youtube') === 'connected') {
      setIsConnected(true);
      loadVideos();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('youtube') === 'error') {
      setError('Failed to connect to YouTube');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            YouTube Management
          </h1>
          <p className="text-gray-600">
            Connect your YouTube channel to manage video visibility during Shabbat
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium mb-1">שגיאה בהתחברות ל-YouTube</p>
                <p className="text-sm">{error}</p>
                {error.includes('OAuth') && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/oauth-setup', '_blank')}
                      className="text-red-700 border-red-300 bg-red-50"
                    >
                      פתח הוראות תיקון
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                Connect YouTube Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                התחבר לערוץ YouTube שלך כדי להסתיר אוטומטית את הסרטונים שלך בשבת ולשחזר אותם אחר כך.
              </p>
              
              {error && error.includes('OAuth') && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm mb-2">
                    <strong>נדרשת הגדרה חד-פעמית:</strong> יש צורך להוסיף redirect URI ב-Google Cloud Console
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/oauth-setup', '_blank')}
                    className="text-orange-700 border-orange-300"
                  >
                    הוראות תיקון מפורטות
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={connectYouTube} 
                disabled={loading}
                className="bg-red-500 hover:bg-red-600"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {loading ? 'מתחבר...' : 'התחבר ל-YouTube'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* YouTube Videos Component */}
            <YouTubeVideos />
          </div>
        )}
      </div>
    </div>
  );
}