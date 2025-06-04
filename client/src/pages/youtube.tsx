import YouTubeAuth from "@/components/YouTubeAuth";
import YouTubeVideos from "@/components/YouTubeVideos";
import useYouTubeAuth from "@/hooks/useYouTubeAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function YouTubePage() {
  const { isAuthenticated: isYouTubeAuthenticated } = useYouTubeAuth();

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