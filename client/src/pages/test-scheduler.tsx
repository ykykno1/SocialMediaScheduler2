import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function TestScheduler() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: schedulerStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/scheduler/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const testHideOperation = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/scheduler/test-hide");
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "הצלחה",
          description: data.message,
        });
      } else {
        throw new Error('שגיאה בהפעלת הסתרה');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRestoreOperation = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/scheduler/test-restore");
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "הצלחה",
          description: data.message,
        });
      } else {
        throw new Error('שגיאה בהפעלת שחזור');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unlockAllVideos = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/youtube/unlock-all");
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "הצלחה",
          description: data.message || "כל הסרטונים שוחררו מחסימה",
        });
      } else {
        throw new Error('שגיאה בשחרור החסימה');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>בדיקת סקדולר שבת</CardTitle>
          <CardDescription>בדיקה ידנית של הסתרה ושחזור אוטומטי של תוכן</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* סטטוס התזמון */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">סטטוס מערכת תזמון שבת</h3>
            {schedulerStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${schedulerStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{schedulerStatus.isRunning ? 'פועל' : 'לא פועל'}</span>
                </div>
                <div>משימות פעילות: {schedulerStatus.activeJobs || 0}</div>
                {schedulerStatus.jobs && schedulerStatus.jobs.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">תזמונים מתוכננים:</div>
                    <ul className="text-sm text-gray-600">
                      {schedulerStatus.jobs.map((job: string, index: number) => (
                        <li key={index}>• {job}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div>טוען סטטוס...</div>
            )}
          </div>

          {/* כפתורי בדיקה */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testHideOperation} 
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? 'מבצע...' : 'בדוק הסתרה'}
              </Button>
              <Button 
                onClick={testRestoreOperation} 
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? 'מבצע...' : 'בדוק שחזור'}
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">פתרון בעיות</div>
              <Button 
                onClick={unlockAllVideos} 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? 'מבצע...' : 'שחרר כל הסרטונים מחסימה'}
              </Button>
              <div className="text-xs text-muted-foreground mt-1">
                אם הסרטונים חסומים ולא מתעדכנים, לחץ כאן לשחרר אותם
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            הכפתורים הללו יפעילו ידנית את הפעולות שהמערכת האוטומטית אמורה לבצע בזמני השבת.
            המערכת תריץ את אותן הפעולות שמוגדרות בדף הגדרות השבת.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}