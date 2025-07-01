import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TestScheduler() {
  const { toast } = useToast();

  const testHideOperation = async () => {
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
    }
  };

  const testRestoreOperation = async () => {
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
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>בדיקת סקדולר שבת</CardTitle>
          <CardDescription>בדיקה ידנית של הסתרה ושחזור אוטומטי של תוכן</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testHideOperation} variant="destructive">
              בדוק הסתרה
            </Button>
            <Button onClick={testRestoreOperation} variant="default">
              בדוק שחזור
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            הכפתורים הללו יפעילו ידנית את הפעולות שהסקדולר אמור לבצע אוטומטית בזמני השבת.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}