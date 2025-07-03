import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function InstagramAuth() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // בדיקת סטטוס אותנטיקציה
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["/api/instagram/auth-status"],
    refetchInterval: 5000, // בדיקה כל 5 שניות
  });

  // פתיחת תהליך אותנטיקציה
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/instagram/auth");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        setIsConnecting(true);
        window.open(data.authUrl, "_blank", "width=600,height=700");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בחיבור לאינסטגרם",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ניתוק
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/instagram/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/auth-status"] });
      toast({
        title: "נותקת מאינסטגרם",
        description: "החיבור נותק בהצלחה",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            אינסטגרם
          </CardTitle>
          <CardDescription>טוען...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isAuthenticated = authStatus?.isAuthenticated;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          אינסטגרם
          {isAuthenticated ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              מחובר
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              לא מחובר
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isAuthenticated 
            ? "מחובר לאינסטגרם בהצלחה. ניתן לנהל פוסטים."
            : "התחבר לאינסטגרם כדי לנהל פוסטים אוטומטית בשבת."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            {authStatus.user && (
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <img
                  src={authStatus.user.profile_picture_url || "/placeholder-avatar.png"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{authStatus.user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {authStatus.user.account_type === "BUSINESS" ? "חשבון עסקי" : "חשבון אישי"}
                  </p>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="w-full"
            >
              {disconnectMutation.isPending ? "מתנתק..." : "נתק מאינסטגרם"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || isConnecting}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {connectMutation.isPending || isConnecting ? "מתחבר..." : "התחבר לאינסטגרם"}
            </Button>
            
            {isConnecting && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p>נפתח חלון חדש לאותנטיקציה...</p>
                <p>אחרי שתסיים את התהליך, חזור לכאן והדף יתעדכן אוטומטית.</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• נדרש חשבון אינסטגרם עסקי</p>
              <p>• הגישה רק לתוכן שלך</p>
              <p>• אבטח מלא לנתונים</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}