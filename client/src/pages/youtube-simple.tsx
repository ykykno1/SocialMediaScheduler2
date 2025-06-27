import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Youtube, Unlink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function YouTubeSimplePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/auth-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isAuthenticated);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      toast({
        title: "מתנתק מיוטיוב...",
        description: "מוחק את הטוקנים",
      });
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setIsConnected(false);
        toast({
          title: "הותנקת בהצלחה מיוטיוב",
          description: "כעת ניתן להתחבר מחדש",
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה בהתנתקות",
          description: error.error || 'Failed to disconnect',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בהתנתקות",
        description: 'Failed to disconnect from YouTube',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectYouTube = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            ניהול YouTube
          </h1>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>התחבר ל-YouTube</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                התחבר לחשבון YouTube שלך כדי לנהל את הסרטונים שלך
              </p>
              <Button onClick={connectYouTube} disabled={loading}>
                התחבר ל-YouTube
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  ניהול YouTube - מחובר
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={disconnectYouTube}
                  disabled={loading}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  התנתק מיוטיוב
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 mb-4">
                ✓ מחובר בהצלחה ל-YouTube
              </p>
              <div className="space-y-4">
                <Button variant="outline">
                  רענן רשימת סרטונים
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}