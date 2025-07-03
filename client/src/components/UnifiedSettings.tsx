import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, MapPin, Settings as SettingsIcon, Info, Calendar } from "lucide-react";

// רשימת ערים לבחירה
const CITIES = [
  { name: 'מנהל - זמנים ידניים', chabadId: 'admin' },
  { name: 'ירושלים', chabadId: '247' },
  { name: 'תל אביב', chabadId: '531' },
  { name: 'חיפה', chabadId: '689' },
  { name: 'באר שבע', chabadId: '688' },
  { name: 'אילת', chabadId: '687' },
  { name: 'צפת', chabadId: '695' },
  { name: 'טבריה', chabadId: '697' },
  { name: 'נתניה', chabadId: '694' },
  { name: 'אשדוד', chabadId: '700' },
  { name: 'פתח תקווה', chabadId: '852' },
  { name: 'ראשון לציון', chabadId: '853' },
  { name: 'חולון', chabadId: '851' },
  { name: 'בת ים', chabadId: '850' },
  { name: 'רמת גן', chabadId: '849' },
  { name: 'כפר סבא', chabadId: '937' },
  { name: 'הרצליה', chabadId: '981' },
  { name: 'רחובות', chabadId: '703' },
  { name: 'מודיעין', chabadId: '355' },
  { name: 'אשקלון', chabadId: '690' },
  { name: 'בית שמש', chabadId: '193' },
  { name: 'ניו יורק', chabadId: '370' },
  { name: 'לוס אנג\'לס', chabadId: '1481' },
  { name: 'לונדון', chabadId: '320' },
  { name: 'פריז', chabadId: '394' },
  { name: 'מילאנו', chabadId: '348' },
  { name: 'ברלין', chabadId: '189' },
  { name: 'ז\'נבה', chabadId: '253' },
  { name: 'סידני', chabadId: '523' },
  { name: 'מלבורן', chabadId: '337' },
  { name: 'טורונטו', chabadId: '554' },
  { name: 'מונטריאול', chabadId: '360' },
  { name: 'מיאמי', chabadId: '331' },
  { name: 'גטבורג', chabadId: '262' },
  { name: 'מוסקבה', chabadId: '347' },
  { name: 'פראג', chabadId: '421' },
  { name: 'אומן', chabadId: '801' },
  { name: 'בנגקוק', chabadId: '42' },

];

// תוויות לזמני הסתרה/שחזור
const getTimingLabel = (timing: string, type: 'hide' | 'restore') => {
  if (type === 'hide') {
    const hideLabels: Record<string, string> = {
      'immediate': 'בדיוק בכניסת שבת',
      '15min': '15 דקות לפני כניסת שבת',
      '30min': '30 דקות לפני כניסת שבת', 
      '1hour': 'שעה לפני כניסת שבת'
    };
    return hideLabels[timing] || timing;
  } else {
    const restoreLabels: Record<string, string> = {
      'immediate': 'בדיוק ביציאת שבת',
      '30min': '30 דקות אחרי יציאת שבת',
      '1hour': 'שעה אחרי יציאת שבת'
    };
    return restoreLabels[timing] || timing;
  }
};

interface User {
  id: string;
  email: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  hideTimingPreference?: string;
  restoreTimingPreference?: string;
}

const UnifiedSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for location settings
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [hidePreference, setHidePreference] = useState<'immediate' | '15min' | '30min' | '1hour'>('1hour');
  const [restorePreference, setRestorePreference] = useState<'immediate' | '30min' | '1hour'>('immediate');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  
  // State for manual admin times
  const [adminEntryDateTime, setAdminEntryDateTime] = useState("");
  const [adminExitDateTime, setAdminExitDateTime] = useState("");
  const [adminTimesLoaded, setAdminTimesLoaded] = useState(false);

  // Get current user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Get current location
  const { data: locationData, isLoading } = useQuery<{ shabbatCity: string; shabbatCityId: string }>({
    queryKey: ['/api/user/shabbat-location'],
    retry: false,
  });

  // Get admin times when user is in admin mode
  const { data: adminTimes } = useQuery<{ entryTime: string | null; exitTime: string | null }>({
    queryKey: ['/api/admin/shabbat-times'],
    enabled: selectedCity === 'admin',
    retry: false,
  });

  // Load current preferences from user data - only once when user data is loaded
  useEffect(() => {
    if (user && !preferencesLoaded) {
      console.log('=== CLIENT DEBUG ===');
      console.log('Full user object from server:', user);
      console.log('User object keys:', Object.keys(user));
      console.log('hideTimingPreference value:', user.hideTimingPreference, 'type:', typeof user.hideTimingPreference);
      console.log('restoreTimingPreference value:', user.restoreTimingPreference, 'type:', typeof user.restoreTimingPreference);
      console.log('===================');
      
      // Set preferences from user data, with fallbacks only if user data is missing
      if (user.hideTimingPreference) {
        console.log('Setting hidePreference to:', user.hideTimingPreference);
        setHidePreference(user.hideTimingPreference as any);
      }
      if (user.restoreTimingPreference) {
        console.log('Setting restorePreference to:', user.restoreTimingPreference);
        setRestorePreference(user.restoreTimingPreference as any);
      }
      setPreferencesLoaded(true);
    }
  }, [user, preferencesLoaded]);

  useEffect(() => {
    if (locationData) {
      setSelectedCity(locationData.shabbatCityId);
    }
  }, [locationData]);

  // Load admin times when available
  useEffect(() => {
    if (adminTimes && selectedCity === 'admin' && !adminTimesLoaded) {
      if (adminTimes.entryTime) {
        setAdminEntryDateTime(new Date(adminTimes.entryTime).toISOString().slice(0, 16));
      }
      if (adminTimes.exitTime) {
        setAdminExitDateTime(new Date(adminTimes.exitTime).toISOString().slice(0, 16));
      }
      setAdminTimesLoaded(true);
    }
  }, [adminTimes, selectedCity, adminTimesLoaded]);

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (cityData: { cityName: string; cityId: string }) => {
      const res = await apiRequest('POST', '/api/user/shabbat-location', cityData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/shabbat-location'] });
      toast({
        title: "מיקום עודכן בהצלחה!",
        description: "זמני השבת יעודכנו אוטומטית",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון מיקום",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    },
  });

  // Update timing preferences mutation
  const updateTimingMutation = useMutation({
    mutationFn: async (preferences: { hideTimingPreference: string; restoreTimingPreference: string }) => {
      const res = await apiRequest('POST', '/api/user/timing-preferences', preferences);
      return await res.json();
    },
    onSuccess: () => {
      // Don't invalidate queries to prevent reloading and resetting preferences
      // Instead, update the local cache with current values
      queryClient.setQueryData(['/api/user'], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            hideTimingPreference: hidePreference,
            restoreTimingPreference: restorePreference
          };
        }
        return oldData;
      });
      
      toast({
        title: "העדפות תזמון עודכנו!",
        description: "ההגדרות שלך נשמרו בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון העדפות",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    },
  });

  // Mutation for saving admin times
  const saveAdminTimesMutation = useMutation({
    mutationFn: async (timeData: { entryTime: string; exitTime: string }) => {
      const res = await apiRequest('POST', '/api/admin/set-shabbat-times', timeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shabbat-times'] });
      toast({
        title: "זמנים ידניים נשמרו!",
        description: "הזמנים החדשים יחולו על המערכת האוטומטית",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשמירת זמנים",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    },
  });

  const handleLocationChange = (cityId: string) => {
    const city = CITIES.find(c => c.chabadId === cityId);
    if (city) {
      setSelectedCity(cityId);
      updateLocationMutation.mutate({
        cityName: city.name,
        cityId: city.chabadId,
      });
    }
  };

  const handleTimingUpdate = () => {
    updateTimingMutation.mutate({
      hideTimingPreference: hidePreference,
      restoreTimingPreference: restorePreference,
    });
  };

  const handleSaveAdminTimes = () => {
    if (!adminEntryDateTime || !adminExitDateTime) {
      toast({
        title: "שגיאה",
        description: "יש להזין גם זמן כניסה וגם זמן יציאה",
        variant: "destructive"
      });
      return;
    }

    if (new Date(adminEntryDateTime) >= new Date(adminExitDateTime)) {
      toast({
        title: "שגיאה", 
        description: "זמן הכניסה חייב להיות לפני זמן היציאה",
        variant: "destructive"
      });
      return;
    }

    saveAdminTimesMutation.mutate({
      entryTime: adminEntryDateTime,
      exitTime: adminExitDateTime
    });
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentCity = CITIES.find(c => c.chabadId === selectedCity);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">הגדרות תזמון שבת</h1>
        <p className="text-muted-foreground">
          התאם אישית את הגדרות ההסתרה והשחזור האוטומטיים של תכנים
        </p>
      </div>

      {/* How it works explanation */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>איך זה עובד:</strong> המערכת משתמשה בזמני שבת אמיתיים מחב"ד לפי העיר שבחרת, 
          ומתזמנת הסתרה ושחזור של תכנים לפי העדפותיך. הכל קורה אוטומטית - גם כשהאתר סגור!
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              הגדרות נוכחיות
            </CardTitle>
            <CardDescription>
              ההגדרות הפעילות שלך כרגע
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">מיקום</span>
              </div>
              <p className="text-blue-800">{currentCity?.name || 'לא נבחר'}</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-900">זמן הסתרה</span>
              </div>
              <p className="text-red-800">{getTimingLabel(hidePreference, 'hide')}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-900">זמן שחזור</span>
              </div>
              <p className="text-green-800">{getTimingLabel(restorePreference, 'restore')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              הגדרת מיקום
            </CardTitle>
            <CardDescription>
              בחר את העיר שלך לקבלת זמני שבת מדויקים מחב"ד
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="city-select">עיר</Label>
              <Select value={selectedCity} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר עיר..." />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city.chabadId} value={city.chabadId}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedCity === 'admin' 
                  ? 'במצב מנהל - קבע זמנים ידניים' 
                  : 'זמני השבת יעודכנו אוטומטית כל שבוע מ-API של חב"ד'
                }
              </p>
            </div>
            
            {/* Manual time settings for admin mode */}
            {selectedCity === 'admin' && (
              <div className="mt-6 p-4 border rounded-lg bg-orange-50">
                <h4 className="font-medium mb-4 text-orange-900">זמנים ידניים למנהל</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry-time">זמן כניסת שבת</Label>
                    <Input
                      id="entry-time"
                      type="datetime-local"
                      value={adminEntryDateTime}
                      onChange={(e) => setAdminEntryDateTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exit-time">זמן יציאת שבת</Label>
                    <Input
                      id="exit-time"
                      type="datetime-local"
                      value={adminExitDateTime}
                      onChange={(e) => setAdminExitDateTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveAdminTimes}
                  className="mt-4 w-full"
                  disabled={!adminEntryDateTime || !adminExitDateTime || saveAdminTimesMutation.isPending}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {saveAdminTimesMutation.isPending ? 'שומר...' : 'שמור זמנים ידניים'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            העדפות תזמון
          </CardTitle>
          <CardDescription>
            קבע מתי להסתיר ולשחזר תכנים ביחס לזמני השבת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Hide timing */}
            <div className="space-y-3">
              <Label>זמן הסתרת תכנים</Label>
              <Select value={hidePreference} onValueChange={(value: any) => setHidePreference(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">שעה לפני כניסת שבת</SelectItem>
                  <SelectItem value="30min">30 דקות לפני כניסת שבת</SelectItem>
                  <SelectItem value="15min">15 דקות לפני כניסת שבת</SelectItem>
                  <SelectItem value="immediate">בדיוק בכניסת שבת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Restore timing */}
            <div className="space-y-3">
              <Label>זמן שחזור תכנים</Label>
              <Select value={restorePreference} onValueChange={(value: any) => setRestorePreference(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">בדיוק ביציאת שבת</SelectItem>
                  <SelectItem value="30min">30 דקות אחרי יציאת שבת</SelectItem>
                  <SelectItem value="1hour">שעה אחרי יציאת שבת</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleTimingUpdate}
              disabled={updateTimingMutation.isPending}
              className="w-full md:w-auto"
            >
              {updateTimingMutation.isPending ? (
                <>
                  <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  שמור העדפות
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account type notice */}
      {user && user.accountType !== 'premium' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>הערה:</strong> תזמון אוטומטי זמין רק למשתמשי פרימיום. 
            {user.accountType === 'free' && ' שדרג לחשבון פרימיום כדי להפעיל תזמון אוטומטי.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UnifiedSettings;