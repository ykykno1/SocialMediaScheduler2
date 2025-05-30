import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import useSettings, { Settings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Instagram } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const SettingsPanel = () => {
  const { settings, updateSettings, isUpdating } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state to track form values
  const [localSettings, setLocalSettings] = useState<Settings>({
    autoSchedule: settings.autoSchedule,
    hideTime: settings.hideTime,
    restoreTime: settings.restoreTime,
    timeZone: settings.timeZone
  });

  // Instagram token state
  const [instagramToken, setInstagramToken] = useState("");

  // Instagram token mutation
  const instagramTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/instagram/manual-token", { token });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "הצלחה!",
        description: `טוקן אינסטגרם נשמר. משתמש: ${data.user?.name || 'לא ידוע'}`,
      });
      setInstagramToken("");
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/auth-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לשמור את הטוקן",
        variant: "destructive",
      });
    },
  });
  
  // Handle changes to form inputs
  const handleChange = (field: keyof Settings, value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Validate time format (HH:MM)
  const isValidTimeFormat = (time: string): boolean => {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timePattern.test(time);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time formats
    if (!isValidTimeFormat(localSettings.hideTime)) {
      toast({
        title: "שגיאת הזנה",
        description: "זמן הסתרה אינו בפורמט חוקי. השתמש בפורמט HH:MM",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidTimeFormat(localSettings.restoreTime)) {
      toast({
        title: "שגיאת הזנה",
        description: "זמן שחזור אינו בפורמט חוקי. השתמש בפורמט HH:MM",
        variant: "destructive",
      });
      return;
    }
    
    // Save settings
    updateSettings(localSettings);
  };

  // Handle Instagram token submission
  const handleInstagramToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramToken.trim()) {
      instagramTokenMutation.mutate(instagramToken.trim());
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Instagram Token Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            הגדרת טוקן אינסטגרם
          </CardTitle>
          <CardDescription>
            הזן טוקן גישה לאינסטגרם למטרות בדיקה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInstagramToken} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="instagram-token">טוקן גישה לאינסטגרם</Label>
              <Textarea
                id="instagram-token"
                placeholder="הדבק כאן את הטוקן מ-Meta Graph Explorer..."
                value={instagramToken}
                onChange={(e) => setInstagramToken(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!instagramToken.trim() || instagramTokenMutation.isPending}
              className="w-full"
            >
              {instagramTokenMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  בודק טוקן...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  שמור טוקן
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>הגדרות</CardTitle>
            <CardDescription>
              הגדר את זמני ההסתרה והשחזור האוטומטיים עבור שבת
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-schedule" className="flex flex-col">
              <span>הסתרה אוטומטית</span>
              <span className="text-sm text-muted-foreground">
                הפעל את הסתרת התוכן האוטומטית בשבת
              </span>
            </Label>
            <Switch
              id="auto-schedule"
              checked={localSettings.autoSchedule}
              onCheckedChange={(checked) => handleChange("autoSchedule", checked)}
            />
          </div>
          
          <div className="grid gap-4">
            <Label htmlFor="hide-time">זמן הסתרה (שעה:דקה)</Label>
            <Input
              id="hide-time"
              placeholder="HH:MM"
              value={localSettings.hideTime}
              onChange={(e) => handleChange("hideTime", e.target.value)}
            />
          </div>
          
          <div className="grid gap-4">
            <Label htmlFor="restore-time">זמן שחזור (שעה:דקה)</Label>
            <Input
              id="restore-time"
              placeholder="HH:MM"
              value={localSettings.restoreTime}
              onChange={(e) => handleChange("restoreTime", e.target.value)}
            />
          </div>
          
          <div className="grid gap-4">
            <Label htmlFor="time-zone">אזור זמן</Label>
            <Input
              id="time-zone"
              placeholder="Asia/Jerusalem"
              value={localSettings.timeZone}
              onChange={(e) => handleChange("timeZone", e.target.value)}
              disabled
            />
            <p className="text-sm text-muted-foreground">אזור הזמן קבוע לירושלים</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocalSettings(settings)}
          >
            איפוס
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                שמירה
              </>
            )}
          </Button>
        </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default SettingsPanel;