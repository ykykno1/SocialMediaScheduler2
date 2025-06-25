import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Facebook, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useFacebookAuth from "@/hooks/useFacebookAuth";
import useFacebookPosts from "@/hooks/useFacebookPosts";
import useFacebookPages from "@/hooks/useFacebookPages";

export default function FacebookSection() {
  const { isAuthenticated, isAuthenticating, login, logout, pageAccess } = useFacebookAuth();
  const { posts, isLoading: isLoadingPosts, hidePosts, isHiding, restorePosts, isRestoring } = useFacebookPosts();
  const { pages, isLoading: isLoadingPages } = useFacebookPages();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
          פייסבוק
        </CardTitle>
        <CardDescription>
          נהל פוסטים ועמודים בפייסבוק - הסתר והצג תוכן בזמן שבת
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
                <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700">
                  גישה לעמודים
                </Badge>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-gray-600">
                  פוסטים: {posts?.length || 0} | עמודים: {pages?.length || 0}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (confirm('האם אתה בטוח שברצונך להתנתק מפייסבוק?')) {
                      try {
                        const response = await fetch('/api/facebook/disconnect', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        if (response.ok) {
                          // עדכון המצב המקומי
                          window.location.reload();
                        } else {
                          alert('שגיאה בהתנתקות מפייסבוק');
                        }
                      } catch (error) {
                        console.error('Error disconnecting Facebook:', error);
                        alert('שגיאה בהתנתקות מפייסבוק');
                      }
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  התנתק מפייסבוק
                </Button>
              </div>
              
              {/* Display Posts Preview */}
              {isLoadingPosts ? (
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="text-xs text-gray-500">טוען פוסטים...</div>
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto mt-3">
                  {(() => {
                    // Separate personal posts and page posts
                    const personalPosts = posts.filter(post => !post.pageId);
                    const pagePosts = posts.filter(post => post.pageId);
                    
                    // Group page posts by page
                    const pageGroups = pagePosts.reduce((groups, post) => {
                      const pageKey = post.pageId || 'unknown';
                      if (!groups[pageKey]) {
                        groups[pageKey] = {
                          pageName: post.pageName || 'עמוד לא ידוע',
                          posts: []
                        };
                      }
                      groups[pageKey].posts.push(post);
                      return groups;
                    }, {} as Record<string, { pageName: string; posts: typeof posts }>);

                    const renderPost = (post: typeof posts[0]) => (
                      <div key={post.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex space-x-2">
                          {/* Media thumbnail */}
                          {(() => {
                            const attachmentImage = post.attachments?.data?.[0]?.media?.image?.src;
                            const directImage = post.picture || post.full_picture;
                            const imageUrl = attachmentImage || directImage;
                            
                            return imageUrl ? (
                              <div className="flex-shrink-0">
                                <img 
                                  src={imageUrl} 
                                  alt="תמונת פוסט"
                                  className="w-12 h-12 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : null;
                          })()}
                          
                          <div className="flex-1">
                            <div className="font-medium">
                              {post.message || post.story || 'פוסט ללא טקסט'}
                            </div>
                            <div className="text-gray-500">
                              {new Date(post.created_time).toLocaleDateString('he-IL')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {post.type && (
                                <span className="mr-2">סוג: {post.type}</span>
                              )}
                              רמת פרטיות: {post.privacy?.value || 'לא ידוע'}
                            </div>
                            
                            {/* Multiple images indicator */}
                            {post.attachments?.data?.[0]?.subattachments?.data && post.attachments.data[0].subattachments.data.length > 1 && (
                              <div className="text-xs text-blue-600 mt-1">
                                +{post.attachments.data[0].subattachments.data.length - 1} תמונות נוספות
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <>
                        {/* Personal Posts Section */}
                        {personalPosts.length > 0 && (
                          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                            <h4 className="font-bold text-sm text-blue-800 mb-2">
                              📱 פוסטים אישיים ({personalPosts.length})
                            </h4>
                            <div className="space-y-2">
                              {personalPosts.slice(0, 2).map(renderPost)}
                              {personalPosts.length > 2 && (
                                <div className="text-xs text-blue-600 text-center">
                                  ועוד {personalPosts.length - 2} פוסטים אישיים...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Page Posts Sections */}
                        {Object.entries(pageGroups).map(([pageId, { pageName, posts: pagePosts }]) => (
                          <div key={pageId} className="border border-green-200 rounded-lg p-3 bg-green-50">
                            <h4 className="font-bold text-sm text-green-800 mb-2">
                              🏢 עמוד: {pageName} ({pagePosts.length})
                            </h4>
                            <div className="space-y-2">
                              {pagePosts.slice(0, 2).map(renderPost)}
                              {pagePosts.length > 2 && (
                                <div className="text-xs text-green-600 text-center">
                                  ועוד {pagePosts.length - 2} פוסטים מהעמוד...
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* No posts message */}
                        {personalPosts.length === 0 && Object.keys(pageGroups).length === 0 && (
                          <div className="text-center text-gray-500 text-sm py-4">
                            לא נמצאו פוסטים
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-3">
                  לא נמצאו פוסטים או שהטוקן פג תוקף
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
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
                  {isHiding ? "מסתיר..." : "הסתר פוסטים"}
                </Button>
                <Button 
                  onClick={() => {
                    if (window.confirm("האם אתה בטוח שברצונך לשחזר את הפוסטים?")) {
                      restorePosts();
                    }
                  }} 
                  disabled={isRestoring}
                  size="sm"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  {isRestoring ? "משחזר..." : "שחזר פוסטים"}
                </Button>
                <Button variant="outline" onClick={logout} size="sm">
                  התנתק
                </Button>
              </div>

              {/* Note about limitations */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>הערה:</strong> הסתרת פוסטים דורשת אישור מפייסבוק (App Review). 
                  כרגע האפליקציה מציגה את הפוסטים בלבד.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}