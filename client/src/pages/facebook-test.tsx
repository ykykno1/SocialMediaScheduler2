import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function FacebookTest() {
  const [isConnectingNew, setIsConnectingNew] = useState(false);
  const [isConnectingOriginal, setIsConnectingOriginal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newError, setNewError] = useState("");
  const [originalMessage, setOriginalMessage] = useState("");
  const [originalError, setOriginalError] = useState("");

  const testNewFacebookConnection = async () => {
    setIsConnectingNew(true);
    setNewMessage("");
    setNewError("");

    try {
      console.log("🚀 Starting NEW Facebook connection test...");
      
      // Always use relative URL so server can decide correct redirect URI
      const testUrl = `/api/facebook/auth-test?version=new`;
      
      console.log("🔗 Current hostname:", window.location.hostname);
      console.log("🔗 Opening auth test URL:", testUrl);
      
      const popup = window.open(
        testUrl,
        'facebook-auth-new',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        // Try opening in new tab instead
        const newTab = window.open(testUrl, '_blank');
        if (newTab) {
          setNewMessage("נפתח בלשונית חדשה. אנא השלם את התהליך שם וחזור לכאן.");
          setIsConnectingNew(false);
          return;
        } else {
          throw new Error("חלון הקופץ נחסם על ידי הדפדפן. אנא אפשר חלונות קופצים לאתר זה");
        }
      }

      const handleMessage = (event: MessageEvent) => {
        console.log("📨 NEW Message received:", event.data);
        
        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          console.log("✅ NEW Facebook auth successful");
          setNewMessage("התחברות חדשה בוצעה בהצלחה!");
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnectingNew(false);
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          console.error("❌ NEW Facebook auth error:", event.data.error);
          setNewError(`שגיאה בגרסה חדשה: ${event.data.error}`);
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnectingNew(false);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log("🔒 NEW Popup was closed manually");
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (isConnectingNew) {
            setNewError("החלון נסגר ללא השלמת ההתחברות");
            setIsConnectingNew(false);
          }
        }
      }, 1000);

    } catch (err) {
      console.error("💥 NEW Connection error:", err);
      setNewError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setIsConnectingNew(false);
    }
  };

  const testOriginalFacebookConnection = async () => {
    setIsConnectingOriginal(true);
    setOriginalMessage("");
    setOriginalError("");

    try {
      console.log("🚀 Starting ORIGINAL Facebook connection test...");
      
      const popup = window.open(
        `/api/facebook/auth`,
        'facebook-auth-original', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        // Try opening in new tab instead
        const newTab = window.open(`/api/facebook/auth`, '_blank');
        if (newTab) {
          setOriginalMessage("נפתח בלשונית חדשה. אנא השלם את התהליך שם וחזור לכאן.");
          setIsConnectingOriginal(false);
          return;
        } else {
          throw new Error("חלון הקופץ נחסם על ידי הדפדפן. אנא אפשר חלונות קופצים לאתר זה");
        }
      }

      const handleMessage = (event: MessageEvent) => {
        console.log("📨 ORIGINAL Message received:", event.data);
        
        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          console.log("✅ ORIGINAL Facebook auth successful");
          setOriginalMessage("התחברות מקורית בוצעה בהצלחה!");
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnectingOriginal(false);
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          console.error("❌ ORIGINAL Facebook auth error:", event.data.error);
          setOriginalError(`שגיאה בגרסה מקורית: ${event.data.error}`);
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsConnectingOriginal(false);
        }
      };

      window.addEventListener('message', handleMessage);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log("🔒 ORIGINAL Popup was closed manually");
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (isConnectingOriginal) {
            setOriginalError("החלון נסגר ללא השלמת ההתחברות");
            setIsConnectingOriginal(false);
          }
        }
      }, 1000);

    } catch (err) {
      console.error("💥 ORIGINAL Connection error:", err);
      setOriginalError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setIsConnectingOriginal(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>בדיקת שתי דרכי התחברות לפייסבוק</CardTitle>
          <CardDescription>
            בדיקה של הגרסה המקורית והגרסה החדשה כדי לראות איזה עובד
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* גרסה חדשה */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-600">גרסה חדשה (נכתבה מאפס)</h3>
            <div className="space-y-2">
              <Button 
                onClick={testNewFacebookConnection}
                disabled={isConnectingNew}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isConnectingNew ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    מתחבר בגרסה חדשה...
                  </>
                ) : (
                  "התחבר בחלון קופץ - גרסה חדשה"
                )}
              </Button>

              <Button 
                onClick={() => window.open(`/api/facebook/auth-test?version=new`, '_blank')}
                variant="outline"
                className="w-full"
              >
                פתח בלשונית חדשה - גרסה חדשה
              </Button>
            </div>

            {newMessage && (
              <Alert>
                <AlertDescription>{newMessage}</AlertDescription>
              </Alert>
            )}

            {newError && (
              <Alert variant="destructive">
                <AlertDescription>{newError}</AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* גרסה מקורית */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-green-600">גרסה מקורית (קוד קיים)</h3>
            <div className="space-y-2">
              <Button 
                onClick={testOriginalFacebookConnection}
                disabled={isConnectingOriginal}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isConnectingOriginal ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    מתחבר בגרסה מקורית...
                  </>
                ) : (
                  "התחבר בחלון קופץ - גרסה מקורית"
                )}
              </Button>

              <Button 
                onClick={() => window.open(`/api/facebook/auth`, '_blank')}
                variant="outline"
                className="w-full"
              >
                פתח בלשונית חדשה - גרסה מקורית
              </Button>
            </div>

            {originalMessage && (
              <Alert>
                <AlertDescription>{originalMessage}</AlertDescription>
              </Alert>
            )}

            {originalError && (
              <Alert variant="destructive">
                <AlertDescription>{originalError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>השוואה בין שתי הגרסאות:</strong></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-md">
                <h4 className="font-semibold text-blue-800">גרסה חדשה:</h4>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Endpoint: `/api/facebook/auth-new`</li>
                  <li>קוד נכתב מאפס</li>
                  <li>לוגים מפורטים יותר</li>
                  <li>טיפול שגיאות משופר</li>
                </ul>
              </div>
              
              <div className="p-3 bg-green-50 rounded-md">
                <h4 className="font-semibold text-green-800">גרסה מקורית:</h4>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Endpoint: `/api/facebook/auth`</li>
                  <li>הקוד הקיים במערכת</li>
                  <li>לוגיקה מורכבת יותר</li>
                  <li>שמירה למסד נתונים</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>מטרה:</strong> לראות איזה מהן עובד ולהבין איפה הבעיה המקורית.
                שתי הגרסאות משתמשות באותו Facebook App ID וredirect URI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}