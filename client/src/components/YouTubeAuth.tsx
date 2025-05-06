import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Youtube } from "lucide-react";
import useYouTubeAuth from '@/hooks/useYouTubeAuth';

const YouTubeAuth: React.FC = () => {
  const { isAuthenticated, isAuthenticating, login, logout, isLoggingOut, channelTitle } = useYouTubeAuth();

  if (!isAuthenticated) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            התחברות ל-YouTube
          </CardTitle>
          <CardDescription>
            חבר את חשבון YouTube שלך כדי לנהל את הסרטונים שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>יתרונות שילוב עם YouTube</AlertTitle>
            <AlertDescription>
              חיבור ל-YouTube יאפשר לך לנהל את הפרטיות של הסרטונים שלך באופן אוטומטי בשבת. תוכל להסתיר את כל הסרטונים שלך בכניסת שבת ולהחזירם למצבם הקודם ביציאת השבת.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-center">
            <Button 
              onClick={login} 
              disabled={isAuthenticating}
              className="bg-red-600 hover:bg-red-700"
            >
              <Youtube className="mr-2 h-4 w-4" />
              {isAuthenticating ? "מתחבר..." : "התחבר עם YouTube"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Youtube className="mr-2 h-5 w-5 text-red-600" />
          חשבון YouTube מחובר
        </CardTitle>
        <CardDescription>
          החשבון מחובר וניתן לנהל את הסרטונים שלך
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
          <div className="flex items-center">
            <Youtube className="h-5 w-5 mr-2 text-red-600" />
            <span>חשבון YouTube</span>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">מחובר</Badge>
        </div>
        
        {channelTitle && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
              <Youtube className="h-5 w-5 mr-2 text-red-600" />
              <span>שם הערוץ</span>
            </div>
            <span className="font-medium">{channelTitle}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={logout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "מתנתק..." : "התנתק מ-YouTube"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default YouTubeAuth;