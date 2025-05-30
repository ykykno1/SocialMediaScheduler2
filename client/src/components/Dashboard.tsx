import { useState } from "react";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useYouTubeAuth from "@/hooks/useYouTubeAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Facebook, Instagram, Crown } from "lucide-react";
import AccountStatus from "./AccountStatus";
import PremiumFeature from "./PremiumFeature";
import FacebookSection from "./FacebookSection";
import YouTubeAuth from "@/components/YouTubeAuth";
import YouTubeVideos from "@/components/YouTubeVideos";

const Dashboard = () => {
  const { isAuthenticated: isYouTubeAuthenticated } = useYouTubeAuth();

  return (
    <div className="space-y-4">
      {/* Account Status Section */}
      <AccountStatus />
      
      {/* YouTube Integration Section - Always visible */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-600" />
            יוטיוב
          </CardTitle>
          <CardDescription>
            נהל סרטונים ביוטיוב - הסתר והצג סרטונים בזמן שבת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YouTubeAuth />
          {isYouTubeAuthenticated && <YouTubeVideos />}
        </CardContent>
      </Card>

      {/* Facebook Section - Premium Only */}
      <PremiumFeature 
        featureName="פייסבוק" 
        description="נהל פוסטים ועמודים בפייסבוק - הסתר והצג תוכן בזמת שבת"
        icon={<Facebook className="h-5 w-5 text-[#1877F2]" />}
      >
        <FacebookSection />
      </PremiumFeature>

      {/* Instagram Section - Premium Only */}
      <PremiumFeature 
        featureName="אינסטגרם" 
        description="נהל פוסטים באינסטגרם - הסתר והצג תוכן בזמן שבת"
        icon={<Instagram className="h-5 w-5 text-pink-600" />}
      >
        <div></div>
      </PremiumFeature>
    </div>
  );
};

export default Dashboard;