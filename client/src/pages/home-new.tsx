import { useAuth } from "@/hooks/useAuth-clean";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Youtube, Facebook, Instagram, Calendar, Shield, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  // Get platform status
  const { data: platforms, isLoading: platformsLoading } = useQuery<{
    youtube: boolean;
    facebook: boolean;
    instagram: boolean;
    tiktok: boolean;
  }>({
    queryKey: ["/api/user/platforms"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  const getAccountTypeBadge = (accountType: string) => {
    switch (accountType) {
      case 'free':
        return <Badge variant="outline">חינמי</Badge>;
      case 'youtube_pro':
        return <Badge variant="secondary">YouTube Pro</Badge>;
      case 'premium':
        return <Badge variant="default">פרימיום</Badge>;
      default:
        return <Badge variant="outline">חינמי</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">רובוט שבת</h1>
            <p className="text-gray-600 mt-1">
              שלום {user.username}, ברוך הבא למערכת ניהול הרשתות החברתיות שלך
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {getAccountTypeBadge(user.accountType)}
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  התנתק
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Account Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                סטטוס חשבון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>סוג חשבון:</span>
                  <span className="font-medium">{user.accountType === 'free' ? 'חינמי' : user.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span>הסתרות בוצעו:</span>
                  <span className="font-medium">{user.hideCount} / {user.maxHides}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(user.hideCount / user.maxHides) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                שבת הקרובה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">יידרש הגדרת מיקום</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    הגדרות
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פעילות אחרונה</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                נרשמת ב-{new Date(user.createdAt).toLocaleDateString('he-IL')}
              </p>
              {user.lastActive && (
                <p className="text-sm text-gray-600 mt-1">
                  פעילות אחרונה: {new Date(user.lastActive).toLocaleDateString('he-IL')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle>חיבור פלטפורמות</CardTitle>
            <CardDescription>
              חברו את החשבונות שלכם ברשתות החברתיות כדי לנהל אותם
            </CardDescription>
          </CardHeader>
          <CardContent>
            {platformsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* YouTube */}
                <div className="border rounded-lg p-4 text-center space-y-3">
                  <Youtube className="h-8 w-8 mx-auto text-red-600" />
                  <div>
                    <h3 className="font-medium">YouTube</h3>
                    <p className="text-sm text-gray-600">
                      {platforms?.youtube ? "מחובר" : "לא מחובר"}
                    </p>
                  </div>
                  <Button 
                    variant={platforms?.youtube ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/youtube">
                      {platforms?.youtube ? "נהל" : "חבר"}
                    </Link>
                  </Button>
                </div>

                {/* Facebook */}
                <div className="border rounded-lg p-4 text-center space-y-3">
                  <Facebook className="h-8 w-8 mx-auto text-blue-600" />
                  <div>
                    <h3 className="font-medium">Facebook</h3>
                    <p className="text-sm text-gray-600">
                      {platforms?.facebook ? "מחובר" : "לא מחובר"}
                    </p>
                  </div>
                  <Button 
                    variant={platforms?.facebook ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/facebook">
                      {platforms?.facebook ? "נהל" : "חבר"}
                    </Link>
                  </Button>
                </div>

                {/* Instagram */}
                <div className="border rounded-lg p-4 text-center space-y-3">
                  <Instagram className="h-8 w-8 mx-auto text-pink-600" />
                  <div>
                    <h3 className="font-medium">Instagram</h3>
                    <p className="text-sm text-gray-600">
                      {platforms?.instagram ? "מחובר" : "לא מחובר"}
                    </p>
                  </div>
                  <Button 
                    variant={platforms?.instagram ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/instagram">
                      {platforms?.instagram ? "נהל" : "חבר"}
                    </Link>
                  </Button>
                </div>

                {/* TikTok */}
                <div className="border rounded-lg p-4 text-center space-y-3">
                  <div className="h-8 w-8 mx-auto bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">TT</span>
                  </div>
                  <div>
                    <h3 className="font-medium">TikTok</h3>
                    <p className="text-sm text-gray-600">
                      {platforms?.tiktok ? "מחובר" : "לא מחובר"}
                    </p>
                  </div>
                  <Button 
                    variant={platforms?.tiktok ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    בקרוב
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  הגדרות זמני שבת
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/activity">
                  <Calendar className="h-4 w-4 mr-2" />
                  היסטוריית פעילות
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>שדרוג חשבון</CardTitle>
            </CardHeader>
            <CardContent>
              {user.accountType === 'free' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    שדרגו לחשבון פרו עבור יותר תכונות
                  </p>
                  <Button className="w-full" asChild>
                    <Link href="/pricing">
                      צפה במחירים
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-green-600">
                    ✓ החשבון שלכם מופעל במלואו
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}