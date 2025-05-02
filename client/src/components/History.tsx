import useHistory from "@/hooks/useHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, History as HistoryIcon, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date);
};

const History = () => {
  const { historyEntries, isLoading } = useHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>היסטוריית פעולות</CardTitle>
        <CardDescription>
          תיעוד של פעולות שבוצעו באפליקציה
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-4 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : historyEntries.length === 0 ? (
          <Alert>
            <HistoryIcon className="h-4 w-4" />
            <AlertTitle>אין היסטוריה</AlertTitle>
            <AlertDescription>
              עדיין לא בוצעו פעולות באפליקציה
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {historyEntries.map((entry) => (
                <div key={entry.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="shrink-0">
                    {entry.action === 'hide' ? (
                      <Lock className={`h-6 w-6 ${entry.success ? 'text-primary' : 'text-destructive'}`} />
                    ) : (
                      <Unlock className={`h-6 w-6 ${entry.success ? 'text-primary' : 'text-destructive'}`} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {entry.action === 'hide' ? 'הסתרת תוכן' : 'שחזור תוכן'}
                      </h4>
                      <Badge variant={entry.success ? 'outline' : 'destructive'}>
                        {entry.success ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {entry.success ? 'הצלחה' : 'שגיאה'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium ml-1">זמן:</span>
                      {formatDate(entry.timestamp)}
                    </div>
                    {entry.affectedItems > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium ml-1">פריטים:</span>
                        {entry.affectedItems}
                      </div>
                    )}
                    {entry.error && (
                      <div className="text-sm text-destructive">
                        <span className="font-medium ml-1">שגיאה:</span>
                        {entry.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default History;