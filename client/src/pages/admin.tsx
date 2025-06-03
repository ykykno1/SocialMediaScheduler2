import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  CreditCard, 
  Search,
  Settings,
  LogOut,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { User, Subscription, ConnectedAccount } from '@shared/schema';

interface AdminStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check if already authenticated as admin
    const adminAuth = localStorage.getItem('admin-auth');
    if (adminAuth === 'authenticated') {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

  const handleAdminLogin = async () => {
    if (!adminCode) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/admin/login', {
        code: adminCode
      });

      if (response.ok) {
        localStorage.setItem('admin-auth', 'authenticated');
        setIsAuthenticated(true);
        setAdminCode('');
        loadAdminData();
        toast({
          title: 'התחברת כמנהל',
          description: 'ברוך הבא למערכת הניהול'
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה בהתחברות',
        description: 'קוד שגוי או שגיאת מערכת',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load users
      const usersResponse = await apiRequest('GET', '/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Load subscriptions
      const subsResponse = await apiRequest('GET', '/api/admin/subscriptions');
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscriptions(subsData);
      }

      // Load stats
      const statsResponse = await apiRequest('GET', '/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleMarkAsPaid = async (userId: string, plan: 'youtube_only' | 'all_platforms') => {
    try {
      const response = await apiRequest('POST', '/api/admin/mark-paid', {
        userId,
        plan,
        price: plan === 'youtube_only' ? 14.90 : 24.90
      });

      if (response.ok) {
        toast({
          title: 'סומן כשולם',
          description: 'המנוי הופעל בהצלחה'
        });
        loadAdminData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleSubscription = async (subscriptionId: string, newStatus: 'active' | 'cancelled') => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/subscriptions/${subscriptionId}`, {
        status: newStatus
      });

      if (response.ok) {
        toast({
          title: newStatus === 'active' ? 'מנוי הופעל' : 'מנוי בוטל',
          description: 'הסטטוס עודכן בהצלחה'
        });
        loadAdminData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    setIsAuthenticated(false);
    setLocation('/');
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserSubscription = (userId: string) => {
    return subscriptions.find(sub => sub.userId === userId);
  };

  // Login form for admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">כניסת מנהל</CardTitle>
            <CardDescription>הזן קוד גישה למערכת הניהול</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminCode">קוד מנהל</Label>
              <div className="relative">
                <Input
                  id="adminCode"
                  type={showCode ? "text" : "password"}
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="הזן קוד גישה"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAdminLogin}
              disabled={isLoading || !adminCode}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              התחבר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">רובוט שבת - מערכת ניהול</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Settings className="h-3 w-3 mr-1" />
                מנהל
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">סה"כ משתמשים</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">משתמשים בתשלום</p>
                    <p className="text-2xl font-bold text-green-600">{stats.paidUsers}</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">משתמשים חינמיים</p>
                    <p className="text-2xl font-bold">{stats.freeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">הכנסה חודשית</p>
                    <p className="text-2xl font-bold text-green-600">₪{stats.monthlyRevenue}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>ניהול משתמשים</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="חפש משתמש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button onClick={loadAdminData} variant="outline" size="sm">
                רענן
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const subscription = getUserSubscription(user.id);
                const isPaid = subscription?.status === 'active';
                
                return (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">נרשם: {new Date(user.createdAt).toLocaleDateString('he-IL')}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isPaid ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              פעיל
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              חינמי
                            </Badge>
                          )}
                          
                          {subscription && (
                            <Badge variant="outline">
                              {subscription.plan === 'youtube_only' ? 'YouTube' : 'כל הרשתות'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isPaid && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(user.id, 'youtube_only')}
                            >
                              סמן YouTube (₪14.90)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(user.id, 'all_platforms')}
                            >
                              סמן כל הרשתות (₪24.90)
                            </Button>
                          </>
                        )}
                        
                        {subscription && isPaid && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleToggleSubscription(subscription.id, 'cancelled')}
                          >
                            בטל מנוי
                          </Button>
                        )}
                        
                        {subscription && subscription.status === 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleSubscription(subscription.id, 'active')}
                          >
                            הפעל מנוי
                          </Button>
                        )}
                      </div>
                    </div>

                    {subscription && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">תוכנית:</span>
                            <p className="font-medium">
                              {subscription.plan === 'youtube_only' ? 'YouTube בלבד' : 'כל הרשתות'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">מחיר:</span>
                            <p className="font-medium">₪{subscription.price}/חודש</p>
                          </div>
                          <div>
                            <span className="text-gray-600">תאריך התחלה:</span>
                            <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString('he-IL')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">לא נמצאו משתמשים</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}