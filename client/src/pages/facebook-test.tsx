import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function FacebookTest() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const testFacebookConnection = async () => {
    setIsConnecting(true);
    setMessage("");
    setError("");

    try {
      console.log("🚀 Starting Facebook connection test...");
      
      // Create popup window
      const popup = window.open(
        `/api/facebook/auth-new`,
        'facebook-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error("חלון הקופץ נחסם על ידי הדפדפן");
      }

      // Listen for popup messages
      const handleMessage = (event: MessageEvent) => {
        console.log("📨 Message received:", event.data);
        
        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          console.log("✅ Facebook auth successful");
          setMessage("התחברות בוצעה בהצלחה!");
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          console.error("❌ Facebook auth error:", event.data.error);
          setError(`שגיאה: ${event.data.error}`);
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log("🔒 Popup was closed manually");
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (isConnecting) {
            setError("החלון נסגר ללא השלמת ההתחברות");
            setIsConnecting(false);
          }
        }
      }, 1000);

    } catch (err) {
      console.error("💥 Connection error:", err);
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setIsConnecting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>בדיקת חיבור פייסבוק חדש</CardTitle>
          <CardDescription>
            עמוד זמני לבדיקת חיבור פייסבוק שנכתב מחדש מאפס
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testFacebookConnection}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מתחבר לפייסבוק...
              </>
            ) : (
              "התחבר לפייסבוק (בדיקה)"
            )}
          </Button>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>מה הדף הזה עושה:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>קורא לendpoint חדש `/api/facebook/auth-new`</li>
              <li>פותח חלון קופץ חדש</li>
              <li>מקשיב להודעות מהחלון</li>
              <li>בודק איפה בדיוק נכשלת ההתחברות</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}