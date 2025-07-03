import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Shield, 
  Edit3, 
  Save, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string; email: string }) => {
      const res = await apiRequest('PUT', '/api/user/profile', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditing(false);
      toast({
        title: "פרופיל עודכן בהצלחה!",
        description: "הפרטים החדשים נשמרו במערכת",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון פרופיל",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editData.username.trim() || !editData.email.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            אירעה שגיאה בטעינת פרטי המשתמש
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getAccountTypeBadge = (accountType: string) => {
    switch (accountType) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500"><Crown className="h-3 w-3 mr-1" />פרימיום</Badge>;
      case 'youtube_pro':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />יוטיוב פרו</Badge>;
      default:
        return <Badge variant="outline">חינמי</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">פרופיל משתמש</h1>
        <p className="text-muted-foreground">
          נהל את פרטיך האישיים ואת הגדרות החשבון
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg font-semibold">
                    {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.username || 'משתמש'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  עריכה
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    ביטול
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    שמירה
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">שם משתמש</Label>
                  <Input
                    id="username"
                    value={editData.username}
                    onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="הכנס שם משתמש"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">כתובת אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="הכנס כתובת אימייל"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">שם משתמש</p>
                    <p className="text-sm text-muted-foreground">{user.username || 'לא מוגדר'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">אימייל</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {updateProfileMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                מעדכן פרופיל...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              סטטוס חשבון
            </CardTitle>
            <CardDescription>
              פרטים על סוג החשבון וההרשאות שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">סוג חשבון</p>
                  <p className="text-sm text-muted-foreground">רמת הגישה שלך למערכת</p>
                </div>
              </div>
              {getAccountTypeBadge(user.accountType || 'free')}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">תאריך הצטרפות</p>
                  <p className="text-sm text-muted-foreground">
                    {user.createdAt ? formatDate(user.createdAt) : 'לא זמין'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">סטטוס חשבון</p>
                  <p className="text-sm text-green-600 font-medium">פעיל</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Features */}
        <Card>
          <CardHeader>
            <CardTitle>תכונות זמינות</CardTitle>
            <CardDescription>
              הפעולות שזמינות לך בהתאם לסוג החשבון
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">גישה בסיסית ליוטיוב</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">גישה בסיסית לפייסבוק</span>
              </div>
              {(user.accountType === 'premium' || user.accountType === 'youtube_pro') && (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">תזמון אוטומטי לשבת</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">תכונות מתקדמות</span>
                  </div>
                </>
              )}
              {user.accountType === 'premium' && (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">גישה לכל הפלטפורמות</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">תמיכה מועדפת</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}