import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function OAuthSetupPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const redirectUri = "https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev/api/youtube/callback";
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      toast({
        title: "הועתק!",
        description: "כתובת ה-callback הועתקה ללוח",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק את הטקסט",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">הגדרת Google OAuth</h1>
        <p className="text-muted-foreground">
          כדי להתחבר ל-YouTube, יש צורך להגדיר את כתובת ה-callback ב-Google Cloud Console
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Issue */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              בעיה נוכחית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              ההתחברות ל-YouTube נכשלת עקב "redirect_uri_mismatch". 
              כתובת ה-callback לא רשומה ב-Google Cloud Console.
            </p>
          </CardContent>
        </Card>

        {/* Step by step solution */}
        <Card>
          <CardHeader>
            <CardTitle>שלבי הפתרון</CardTitle>
            <CardDescription>
              בצע את השלבים הבאים כדי לתקן את בעיית ההתחברות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <h3 className="font-medium">פתח את Google Cloud Console</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    היכנס לקונסול של Google Cloud
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                      פתח Google Cloud Console
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <h3 className="font-medium">נווט לפרויקט שלך</h3>
                  <p className="text-sm text-muted-foreground">
                    בחר את הפרויקט שבו יצרת את Google OAuth credentials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <h3 className="font-medium">לך ל-APIs &amp; Services &gt; Credentials</h3>
                  <p className="text-sm text-muted-foreground">
                    במסך הפרויקט, לחץ על APIs &amp; Services ואז על Credentials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <h3 className="font-medium">מצא את OAuth 2.0 Client ID שלך</h3>
                  <p className="text-sm text-muted-foreground">
                    חפש בטבלה את OAuth 2.0 Client ID ולחץ על העיפרון לעריכה
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">5</Badge>
                <div>
                  <h3 className="font-medium">הוסף Authorized JavaScript origins</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    בחלק "Authorized JavaScript origins", הוסף את הכתובת הבאה:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-md border">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono break-all">
                        https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText('https://6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev')}
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">6</Badge>
                <div>
                  <h3 className="font-medium">הוסף Authorized redirect URI</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    בחלק "Authorized redirect URIs", הוסף את הכתובת הבאה:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-md border">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono break-all">
                        {redirectUri}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="ml-2"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">7</Badge>
                <div>
                  <h3 className="font-medium">שמור את השינויים</h3>
                  <p className="text-sm text-muted-foreground">
                    לחץ על "Save" כדי לשמור את ההגדרות החדשות
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">8</Badge>
                <div>
                  <h3 className="font-medium">חזור לאפליקציה ונסה שוב</h3>
                  <p className="text-sm text-muted-foreground">
                    חזור לעמוד YouTube ולחץ על "התחבר ל-YouTube"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <Card>
          <CardHeader>
            <CardTitle>מידע נוסף</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Client ID הנוכחי:</strong> 351828412701-rt3ts08rsials5q7tmqr9prdjtu7qdke.apps.googleusercontent.com
              </p>
              <p className="text-sm">
                <strong>דומיין האפליקציה:</strong> 6866a7b9-e37b-4ce0-b193-e54ab5171d02-00-1hjnl20rbozcm.janeway.replit.dev
              </p>
              <p className="text-sm text-muted-foreground">
                אם השינויים לא נכנסים לתוקף מיד, חכה כמה דקות ונסה שוב.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}