import YouTubeAuth from "@/components/YouTubeAuth";
import YouTubeVideos from "@/components/YouTubeVideos";
import useYouTubeAuth from "@/hooks/useYouTubeAuth";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function YouTubePage() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated: isYouTubeAuthenticated } = useYouTubeAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              חזור לבית
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-600" />
              ניהול יוטיוב
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              נדרש חשבון משתמש
            </CardTitle>
            <CardDescription>
              עליך להתחבר למערכת לפני שתוכל לחבר את חשבון יוטיוב שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth">התחבר כעת</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            חזור לבית
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-600" />
            ניהול יוטיוב
          </h1>
          <p className="text-gray-600">נהל את הסרטונים שלך ביוטיוב לשבת</p>
        </div>
      </div>

      {/* YouTube Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            התחברות ליוטיוב
          </CardTitle>
          <CardDescription>
            התחבר לחשבון יוטיוב שלך כדי לנהל את הסרטונים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YouTubeAuth />
        </CardContent>
      </Card>

      {/* YouTube Videos Management */}
      {isYouTubeAuthenticated && <YouTubeVideos />}
    </div>
  );
}