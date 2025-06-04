import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, DollarSign, Settings, Eye, EyeOff, Crown, Trash2, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email?: string;
  createdAt: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  lastActive?: string;
  totalActions?: number;
  hideCount?: number;
}

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  youtubeProUsers: number;
  premiumUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  amount: number;
  type: 'youtube_pro' | 'premium';
  method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer';
  description?: string;
  timestamp: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Admin authentication
  const authenticateAdmin = async () => {
    try {
      const response = await apiRequest('POST', '/api/admin/login', { password });
      if (response.ok) {
        setIsAuthenticated(true);
        toast({
          title: "התחברות מוצלחת",
          description: "ברוך הבא לממשק האדמין"
        });
      } else {
        toast({
          title: "שגיאת התחברות",
          description: "סיסמת אדמין שגויה",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהתחברות",
        variant: "destructive"
      });
    }
  };

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated,
  });

  // Upgrade user mutation
  const upgradeUserMutation = useMutation({
    mutationFn: async ({ userId, accountType }: { userId: string; accountType: string }) => {
      const response = await apiRequest('POST', '/api/admin/upgrade-user', { userId, accountType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "שדרוג הושלם",
        description: "החשבון שודרג בהצלחה"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בשדרוג החשבון",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "משתמש נמחק",
        description: "המשתמש נמחק בהצלחה מהמערכת"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת המשתמש",
        variant: "destructive"
      });
    }
  });

  // Payments queries
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments'],
    enabled: isAuthenticated
  });

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      userId: string;
      amount: number;
      type: 'youtube_pro' | 'premium';
      method: 'manual' | 'coupon' | 'credit_card' | 'bank_transfer';
      description?: string;
    }) => {
      const response = await apiRequest('POST', '/api/admin/payments', paymentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "תשלום נוסף",
        description: "התשלום נוסף בהצלחה למערכת"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת התשלום",
        variant: "destructive"
      });
    }
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    userId: '',
    amount: '',
    type: 'youtube_pro' as 'youtube_pro' | 'premium',
    method: 'manual' as 'manual' | 'coupon' | 'credit_card' | 'bank_transfer',
    description: ''
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-6 w-6" />
              ממשק אדמין
            </CardTitle>
            <CardDescription>
              הכנס סיסמת אדמין כדי לגשת לממשק הניהול
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמת אדמין</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && authenticateAdmin()}
                  placeholder="הכנס סיסמת אדמין"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={authenticateAdmin} className="w-full">
              התחבר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            ממשק אדמין - רובוט שבת
          </h1>
          <p className="text-gray-600">ניהול משתמשים ומערכת</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsAuthenticated(false)}
        >
          התנתק
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך משתמשים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשי פרימיום</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות חודשיות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{stats?.monthlyRevenue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכנסות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{stats?.totalRevenue || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">משתמשים</TabsTrigger>
          <TabsTrigger value="payments">ניהול תשלומים</TabsTrigger>
          <TabsTrigger value="settings">הגדרות מערכת</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ניהול משתמשים</CardTitle>
              <CardDescription>
                נהל את כל המשתמשים במערכת, שדרג חשבונות ומחק משתמשים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מזהה משתמש</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>סוג חשבון</TableHead>
                    <TableHead>תאריך הצטרפות</TableHead>
                    <TableHead>פעילות אחרונה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell>{user.email || "לא זמין"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            user.accountType === 'premium' ? 'default' :
                            user.accountType === 'youtube_pro' ? 'secondary' : 'outline'
                          }
                        >
                          {user.accountType === 'premium' ? 'פרימיום' :
                           user.accountType === 'youtube_pro' ? 'יוטיוב פרו' : 'חינם'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('he-IL')}</TableCell>
                      <TableCell>
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString('he-IL') : 'לא פעיל'}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => upgradeUserMutation.mutate({ 
                            userId: user.id, 
                            accountType: 'premium' 
                          })}
                          disabled={user.accountType === 'premium'}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          שדרג לפרימיום
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>הוסף תשלום ידני</CardTitle>
                <CardDescription>
                  תעד תשלום שהתקבל מחוץ למערכת (מזומן, העברה בנקאית וכו')
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">מזהה משתמש</Label>
                  <Input
                    id="userId"
                    value={paymentForm.userId}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="הזן מזהה משתמש"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">סכום (₪)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="הזן סכום בשקלים"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">סוג מנוי</Label>
                  <select
                    id="type"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value as 'youtube_pro' | 'premium' }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="youtube_pro">יוטיוב פרו (₪14.90)</option>
                    <option value="premium">פרימיום (₪24.90)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="method">אמצעי תשלום</Label>
                  <select
                    id="method"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="manual">תשלום ידני</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="credit_card">כרטיס אשראי</option>
                    <option value="coupon">קופון</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">הערות (אופציונלי)</Label>
                  <Input
                    id="description"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="הערות נוספות על התשלום"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    if (paymentForm.userId && paymentForm.amount) {
                      addPaymentMutation.mutate({
                        userId: paymentForm.userId,
                        amount: parseFloat(paymentForm.amount),
                        type: paymentForm.type,
                        method: paymentForm.method,
                        description: paymentForm.description || undefined
                      });
                      setPaymentForm({
                        userId: '',
                        amount: '',
                        type: 'youtube_pro',
                        method: 'manual',
                        description: ''
                      });
                    }
                  }}
                  disabled={!paymentForm.userId || !paymentForm.amount || addPaymentMutation.isPending}
                  className="w-full"
                >
                  {addPaymentMutation.isPending ? 'מוסיף...' : 'הוסף תשלום'}
                </Button>
              </CardContent>
            </Card>

            {/* Payments List */}
            <Card>
              <CardHeader>
                <CardTitle>תשלומים אחרונים</CardTitle>
                <CardDescription>
                  רשימת התשלומים שנרשמו במערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="text-center py-4">טוען תשלומים...</div>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {payments.slice(0, 10).map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{payment.userEmail}</p>
                            <p className="text-sm text-gray-500">{payment.username}</p>
                          </div>
                          <Badge variant={payment.type === 'premium' ? 'default' : 'secondary'}>
                            ₪{payment.amount}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>סוג: {payment.type === 'premium' ? 'פרימיום' : 'יוטיוב פרו'}</p>
                          <p>אמצעי: {
                            payment.method === 'manual' ? 'ידני' :
                            payment.method === 'bank_transfer' ? 'העברה בנקאית' :
                            payment.method === 'credit_card' ? 'כרטיס אשראי' : 'קופון'
                          }</p>
                          <p>תאריך: {new Date(payment.timestamp).toLocaleDateString('he-IL')}</p>
                          {payment.description && <p>הערות: {payment.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    עדיין לא נרשמו תשלומים במערכת
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות מערכת</CardTitle>
              <CardDescription>
                הגדרות כלליות של המערכת והאפליקציה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  הגדרות המערכת יתווספו בגרסאות הבאות
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}