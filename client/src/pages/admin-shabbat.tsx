import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Settings } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

interface AdminShabbatTimes {
  entryTime: string | null;
  exitTime: string | null;
}

export default function AdminShabbatPage() {
  const { toast } = useToast();
  const [times, setTimes] = useState<AdminShabbatTimes>({ entryTime: null, exitTime: null });
  const [entryDateTime, setEntryDateTime] = useState("");
  const [exitDateTime, setExitDateTime] = useState("");
  const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

  useEffect(() => {
    fetchCurrentTimes();
  }, []);

  const fetchCurrentTimes = async () => {
    try {
      const response = await fetch('/api/admin/shabbat-times');
      if (response.ok) {
        const data = await response.json();
        setTimes(data);

        if (data.entryTime) {
          setEntryDateTime(new Date(data.entryTime).toISOString().slice(0, 16));
        }
        if (data.exitTime) {
          setExitDateTime(new Date(data.exitTime).toISOString().slice(0, 16));
        }
      }
    } catch (error) {
      console.error('Error fetching times:', error);
    }
  };

  const handleSetTimes = async () => {
    if (!entryDateTime || !exitDateTime) {
      toast({
        title: "שגיאה",
        description: "יש להזין גם זמן כניסה וגם זמן יציאה",
        variant: "destructive"
      });
      return;
    }

    if (new Date(entryDateTime) >= new Date(exitDateTime)) {
      toast({
        title: "שגיאה", 
        description: "זמן הכניסה חייב להיות לפני זמן היציאה",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/set-shabbat-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTime: entryDateTime,
          exitTime: exitDateTime
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTimes({
          entryTime: result.entryTime,
          exitTime: result.exitTime
        });

        toast({
          title: "הצלחה!",
          description: "זמני שבת עודכנו בהצלחה למיקום מנהל"
        });

				// Invalidate cache after successful update
				queryClient.invalidateQueries({ queryKey: ['shabbatTimes'] });
      } else {
        throw new Error('Failed to set times');
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון זמני השבת",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "לא נקבע";
    return new Date(dateTime).toLocaleString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ניהול זמני שבת למנהל</h1>
        <p className="text-muted-foreground">
          הגדר זמני שבת מותאמים אישית למיקום "מנהל" לצורך בדיקות
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Times Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              זמני שבת נוכחיים
            </CardTitle>
            <CardDescription>
              זמני השבת הנוכחיים שנקבעו למיקום מנהל
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">כניסת שבת</span>
              </div>
              <p className="text-blue-800">{formatDateTime(times.entryTime)}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">צאת השבת</span>
              </div>
              <p className="text-purple-800">{formatDateTime(times.exitTime)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Set New Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              קביעת זמנים חדשים
            </CardTitle>
            <CardDescription>
              הזן תאריך ושעה מותאמים אישית לבדיקת המערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-time">זמן כניסת שבת</Label>
              <Input
                id="entry-time"
                type="datetime-local"
                value={entryDateTime}
                onChange={(e) => setEntryDateTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-time">זמן צאת השבת</Label>
              <Input
                id="exit-time"
                type="datetime-local"
                value={exitDateTime}
                onChange={(e) => setExitDateTime(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleSetTimes}
              disabled={loading || !entryDateTime || !exitDateTime}
              className="w-full"
            >
              {loading ? "מעדכן..." : "עדכן זמני שבת"}
            </Button>

            <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg">
              <strong>הערה:</strong> זמנים אלו ישמשו עבור משתמשים שיבחרו במיקום "מנהל" 
              בהגדרות השבת שלהם. זה מאפשר בדיקה של מערכת התזמון ללא תלות בזמני שבת אמיתיים.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}