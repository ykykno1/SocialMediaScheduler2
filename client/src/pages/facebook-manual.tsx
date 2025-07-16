import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function FacebookManual() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleManualToken = async () => {
    if (!token.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין token",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/facebook/manual-token', {
        accessToken: token.trim()
      });

      toast({
        title: "הצלחה!",
        description: "פייסבוק מחובר בהצלחה",
      });

      // Redirect to Facebook page
      window.location.href = '/facebook';

    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בחיבור פייסבוק",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">חיבור פייסבוק ידני</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">הוראות:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>לך ל-<a href="https://developers.facebook.com/tools/explorer" target="_blank" className="text-blue-600 underline">Graph API Explorer</a></li>
              <li>בחר באפליקציה: "Shabbat Robot"</li>
              <li>הוסף permissions: email, public_profile</li>
              <li>לחץ "Generate Access Token"</li>
              <li>העתק את הtoken ולהדבק כאן</li>
            </ol>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Facebook Access Token:</label>
            <Input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="הדבק כאן את הtoken מFacebook..."
              className="text-left"
              dir="ltr"
            />
          </div>

          <Button 
            onClick={handleManualToken}
            disabled={isLoading || !token.trim()}
            className="w-full"
          >
            {isLoading ? "מתחבר..." : "חבר פייסבוק"}
          </Button>

          <div className="text-center">
            <a href="/facebook-test" className="text-blue-600 underline text-sm">
              חזור לבדיקה האוטומטית
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}