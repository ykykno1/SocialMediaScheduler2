import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Facebook, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HistoryEntry } from "@shared/schema";

const History = () => {
  // Fetch history entries
  const {
    data: historyEntries = [],
    isLoading,
    error,
  } = useQuery<HistoryEntry[]>({
    queryKey: ['/api/history'],
  });
  
  // Helper function to format dates
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(date));
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>היסטוריה</CardTitle>
          <CardDescription>רשימת פעולות הסתרה ושחזור אחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border p-4 rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>היסטוריה</CardTitle>
          <CardDescription>רשימת פעולות הסתרה ושחזור אחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>שגיאה בטעינת היסטוריה</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'אירעה שגיאה בטעינת נתוני ההיסטוריה'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (historyEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>היסטוריה</CardTitle>
          <CardDescription>רשימת פעולות הסתרה ושחזור אחרונות</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>אין פעולות</AlertTitle>
            <AlertDescription>
              לא נמצאו פעולות הסתרה או שחזור בהיסטוריה
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>היסטוריה</CardTitle>
        <CardDescription>רשימת פעולות הסתרה ושחזור אחרונות</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {historyEntries.map((entry) => (
              <div key={entry.id} className="border p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {entry.action === 'hide' ? (
                      <EyeOff className="h-4 w-4 mr-2 text-amber-500" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2 text-green-500" />
                    )}
                    <span className="font-medium">
                      {entry.action === 'hide' ? 'הסתרת תוכן' : 'שחזור תוכן'}
                    </span>
                  </div>
                  <Badge
                    variant={entry.success ? "default" : "destructive"}
                  >
                    {entry.success ? 'הצלחה' : 'כישלון'}
                  </Badge>
                </div>
                
                <div className="flex items-center mb-1">
                  <Facebook className="h-4 w-4 mr-2 text-[#1877F2]" />
                  <span className="text-sm">פייסבוק</span>
                </div>
                
                <div className="text-sm text-muted-foreground mb-1">
                  {formatDate(entry.timestamp)}
                </div>
                
                {entry.affectedItems > 0 && (
                  <div className="text-sm">
                    {entry.action === 'hide' 
                      ? `הוסתרו ${entry.affectedItems} פריטים`
                      : `שוחזרו ${entry.affectedItems} פריטים`}
                  </div>
                )}
                
                {entry.error && (
                  <div className="text-sm text-destructive mt-2">
                    שגיאה: {entry.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default History;