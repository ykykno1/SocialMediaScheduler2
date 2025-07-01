import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Settings, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TimingPreferences {
  hideTimingPreference: 'immediate' | '15min' | '30min' | '1hour';
  restoreTimingPreference: 'immediate' | '30min' | '1hour';
}

interface User {
  id: string;
  email: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  hideTimingPreference?: string;
  restoreTimingPreference?: string;
}

export default function TimingSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [hidePreference, setHidePreference] = useState<'immediate' | '15min' | '30min' | '1hour'>('1hour');
  const [restorePreference, setRestorePreference] = useState<'immediate' | '30min' | '1hour'>('immediate');

  // Get current user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Load current preferences
  useEffect(() => {
    if (user) {
      setHidePreference((user.hideTimingPreference as any) || '1hour');
      setRestorePreference((user.restoreTimingPreference as any) || 'immediate');
    }
  }, [user]);

  // Save timing preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: TimingPreferences) => {
      return await apiRequest('/api/user/timing-preferences', 'POST', preferences);
    },
    onSuccess: () => {
      toast({
        title: "הצלחה!",
        description: "העדפות התזמון נשמרו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת העדפות התזמון",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    savePreferencesMutation.mutate({
      hideTimingPreference: hidePreference,
      restoreTimingPreference: restorePreference
    });
  };

  const getTimingLabel = (value: string, type: 'hide' | 'restore') => {
    switch (value) {
      case 'immediate':
        return type === 'hide' ? 'מיד כשמתחיל השבת' : 'מיד כשנגמר השבת';
      case '15min':
        return '15 דקות לפני כניסת שבת';
      case '30min':
        return type === 'hide' ? '30 דקות לפני כניסת שבת' : '30 דקות אחרי צאת השבת';
      case '1hour':
        return type === 'hide' ? 'שעה לפני כניסת שבת' : 'שעה אחרי צאת השבת';
      default:
        return value;
    }
  };

  if (userLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Check if user is premium - temporarily disabled for testing
  const isPremium = true; // user?.accountType === 'premium';

  if (!isPremium) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">הגדרות תזמון</h1>
          <p className="text-muted-foreground">
            התאם אישית את זמני ההסתרה והחזרה של תכנים במדיה חברתית
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Crown className="h-5 w-5" />
              תכונה לחברי פרמיום בלבד
            </CardTitle>
            <CardDescription className="text-amber-700">
              הגדרות תזמון מותאמות אישית זמינות רק לחברי פרמיום. 
              שדרג את החשבון שלך כדי לגשת לתכונה זו.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-amber-600 hover:bg-amber-700">
              שדרג לפרמיום
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">הגדרות תזמון מותאמות אישית</h1>
        <p className="text-muted-foreground">
          התאם אישית את זמני ההסתרה והחזרה של תכנים במדיה חברתית לפי השבת
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Settings Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              הגדרות נוכחיות
            </CardTitle>
            <CardDescription>
              העדפות התזמון הנוכחיות שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-900">זמן הסתרת תכנים</span>
              </div>
              <p className="text-red-800">{getTimingLabel(hidePreference, 'hide')}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-900">זמן החזרת תכנים</span>
              </div>
              <p className="text-green-800">{getTimingLabel(restorePreference, 'restore')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              קביעת זמנים חדשים
            </CardTitle>
            <CardDescription>
              בחר את הזמנים המועדפים עליך להסתרה והחזרה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="hide-timing">זמן הסתרת תכנים</Label>
              <Select value={hidePreference} onValueChange={(value: any) => setHidePreference(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">מיד כשמתחיל השבת</SelectItem>
                  <SelectItem value="15min">15 דקות לפני כניסת שבת</SelectItem>
                  <SelectItem value="30min">30 דקות לפני כניסת שבת</SelectItem>
                  <SelectItem value="1hour">שעה לפני כניסת שבת (מומלץ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="restore-timing">זמן החזרת תכנים</Label>
              <Select value={restorePreference} onValueChange={(value: any) => setRestorePreference(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">מיד כשנגמר השבת (מומלץ)</SelectItem>
                  <SelectItem value="30min">30 דקות אחרי צאת השבת</SelectItem>
                  <SelectItem value="1hour">שעה אחרי צאת השבת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSave}
              disabled={savePreferencesMutation.isPending}
              className="w-full"
            >
              {savePreferencesMutation.isPending ? "שומר..." : "שמור הגדרות"}
            </Button>

            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <strong>הסבר:</strong> הגדרות אלו יחולו על כל הפלטפורמות המחוברות שלך 
              (פייסבוק, יוטיוב וכו'). המערכת תפעל אוטומטית לפי הזמנים שבחרת.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>דוגמאות לתזמון</CardTitle>
          <CardDescription>
            הבן כיצד יפעלו ההגדרות שלך בפועל
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🕯️ שבת זה השבוע</h4>
              <p className="text-sm text-muted-foreground mb-2">כניסת שבת: יום ו' 19:15</p>
              <p className="text-sm text-muted-foreground mb-2">צאת השבת: יום ש' 20:30</p>
              <div className="text-sm">
                <div className="text-red-600">• הסתרה: {
                  hidePreference === 'immediate' ? 'יום ו\' 19:15' :
                  hidePreference === '15min' ? 'יום ו\' 19:00' :
                  hidePreference === '30min' ? 'יום ו\' 18:45' :
                  'יום ו\' 18:15'
                }</div>
                <div className="text-green-600">• החזרה: {
                  restorePreference === 'immediate' ? 'יום ש\' 20:30' :
                  restorePreference === '30min' ? 'יום ש\' 21:00' :
                  'יום ש\' 21:30'
                }</div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📱 מה יקרה?</h4>
              <ul className="text-sm space-y-1">
                <li>• פוסטים בפייסבוק יוסתרו</li>
                <li>• סרטונים ביוטיוב יהפכו לפרטיים</li>
                <li>• התכנים יחזרו אוטומטית</li>
                <li>• תקבל התראות על הפעולות</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}