import { useState } from "react";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useFacebookPages from "@/hooks/useFacebookPages";
import useYouTubeAuth from "@/hooks/useYouTubeAuth";
import useSettings from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Facebook, FileText, Globe, Lock, Unlock, Key, ExternalLink, Youtube, Instagram } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import YouTubeAuth from "@/components/YouTubeAuth";
import YouTubeVideos from "@/components/YouTubeVideos";
import { InstagramAuth } from "@/components/InstagramAuth";
import { InstagramPosts } from "@/components/InstagramPosts";

const Dashboard = () => {
  const { isAuthenticated, isAuthenticating, login, logout, isLoggingOut, pageAccess } = useFacebookAuth();
  const { posts, isLoading: isLoadingPosts, hidePosts, isHiding, restorePosts, isRestoring } = useFacebookPosts();
  const { pages, isLoading: isLoadingPages, hidePages, isHiding: isHidingPages, restorePages, isRestoring: isRestoringPages } = useFacebookPages();
  const { isAuthenticated: isYouTubeAuthenticated } = useYouTubeAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("overview");
  const [manualToken, setManualToken] = useState("");
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
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

      {/* Facebook Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
            פייסבוק
          </CardTitle>
          <CardDescription>
            נהל פוסטים ועמודים בפייסבוק
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="text-center">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>התחברות נדרשת</AlertTitle>
                <AlertDescription>
                  התחבר לפייסבוק כדי לנהל פוסטים ועמודים
                </AlertDescription>
              </Alert>
              <Button 
                onClick={login} 
                disabled={isAuthenticating}
                className="bg-[#1877F2] hover:bg-[#166FE5]"
              >
                <Facebook className="mr-2 h-4 w-4" />
                {isAuthenticating ? "מתחבר..." : "התחבר עם פייסבוק"}
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  מחובר לפייסבוק
                </Badge>
                {pageAccess && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 ml-2">
                    גישה לעמודים
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  פוסטים: {posts?.length || 0} | עמודים: {pages?.length || 0}
                </div>
                
                {/* Display Posts */}
                {isLoadingPosts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <h4 className="font-medium text-sm">הפוסטים שלך:</h4>
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{post.message || 'פוסט ללא טקסט'}</div>
                        <div className="text-gray-500">{new Date(post.created_time).toLocaleDateString('he-IL')}</div>
                      </div>
                    ))}
                    {posts.length > 5 && (
                      <div className="text-xs text-gray-500">ועוד {posts.length - 5} פוסטים...</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">לא נמצאו פוסטים</div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      if (window.confirm("האם אתה בטוח שברצונך להסתיר את הפוסטים?")) {
                        hidePosts();
                      }
                    }} 
                    disabled={isHiding}
                    size="sm"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    הסתר פוסטים
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (window.confirm("האם אתה בטוח שברצונך לשחזר את הפוסטים?")) {
                        restorePosts();
                      }
                    }} 
                    disabled={isRestoring}
                    size="sm"
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    שחזר פוסטים
                  </Button>
                  <Button variant="outline" onClick={logout} size="sm">
                    התנתק
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Instagram className="mr-2 h-5 w-5 text-pink-600" />
            אינסטגרם
          </CardTitle>
          <CardDescription>
            נהל פוסטים באינסטגרם
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstagramAuth />
          <InstagramPosts />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;