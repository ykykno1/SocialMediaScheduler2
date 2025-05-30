import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type User = {
  accountType: 'free' | 'premium';
};

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description: string;
  icon?: React.ReactNode;
}

export default function PremiumFeature({ 
  children, 
  featureName, 
  description, 
  icon 
}: PremiumFeatureProps) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('shabbat-robot-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleUpgrade = () => {
    toast({
      title: "שדרוג נדרש",
      description: `${featureName} זמין רק לחשבונות פרימיום`,
    });
  };

  // If user is premium, show the feature
  if (user?.accountType === 'premium') {
    return <>{children}</>;
  }

  // If user is free or not logged in, show upgrade prompt
  return (
    <Card className="relative border-2 border-dashed border-gray-300 bg-gray-50/50">
      <div className="absolute top-2 right-2 bg-yellow-100 rounded-full p-1">
        <Crown className="h-4 w-4 text-yellow-600" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-600">
          {icon}
          {featureName}
          <Lock className="h-4 w-4" />
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg text-center">
          <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 mb-2">תכונה פרימיום</h3>
          <p className="text-sm text-gray-700 mb-3">
            גישה ל{featureName} זמינה רק למנויי פרימיום
          </p>
          
          <div className="space-y-2 text-xs text-gray-600 mb-4">
            <div>• גישה לכל הרשתות החברתיות</div>
            <div>• תזמון גמיש</div>
            <div>• זיהוי שבת אוטומטי</div>
            <div>• תמיכה מועדפת</div>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Crown className="h-4 w-4 mr-2" />
            שדרג לפרימיום
          </Button>
        </div>
        
        {!user && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              התחבר לחשבון קיים
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}