import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, CreditCard, Calendar, X } from 'lucide-react';

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription?: {
    id: string;
    status: 'trial' | 'active' | 'pending_payment' | 'cancelled';
    planType: 'monthly' | 'annual';
    trialStartDate?: string;
    paymentDueDate?: string;
    cardSetup: boolean;
    amount: number;
  };
  trialStatus?: {
    isInTrial: boolean;
    daysRemaining: number;
    paymentDue: boolean;
  };
  canStartTrial: boolean;
  paymentRequired: boolean;
  message?: string;
  error?: string;
}

export default function SubscriptionPage() {
  const { toast } = useToast();

  // Get subscription status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/status'],
    retry: 1
  });

  // Start trial mutation (monthly)
  const startTrialMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/start-trial', { planType: 'monthly' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      if (data.success) {
        toast({
          title: "שבת ראשונה חינם!",
          description: data.message,
        });
      } else {
        if (!data.error?.includes("already has a subscription") && 
            !data.error?.includes("already has a trial")) {
          toast({
            title: "שגיאה",
            description: data.error,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחלת ניסיון",
        description: "בעיה בתקשורת - נסה שוב",
        variant: "destructive",
      });
    }
  });

  // Start annual trial mutation
  const startAnnualTrialMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/start-trial', { planType: 'annual' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      if (data.success) {
        toast({
          title: "שבת ראשונה חינם!",
          description: "התחלת במנוי שנתי עם חודש במתנה",
        });
      } else {
        if (!data.error?.includes("already has a subscription") && 
            !data.error?.includes("already has a trial")) {
          toast({
            title: "שגיאה",
            description: data.error,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחלת ניסיון שנתי",
        description: "בעיה בתקשורת - נסה שוב",
        variant: "destructive",
      });
    }
  });

  // Setup payment method mutation  
  const setupPaymentMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/setup-payment'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      if (data.success) {
        toast({
          title: "הגדרת תשלום",
          description: "דמו: כרטיס אשראי הוגדר בהצלחה",
        });
      } else {
        toast({
          title: "שגיאה",
          description: data.error,
          variant: "destructive",
        });
      }
    }
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => 
      apiRequest('POST', '/api/subscription/cancel', { reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      
      if (data.success) {
        toast({
          title: "מנוי בוטל",
          description: data.message,
        });
      } else {
        toast({
          title: "שגיאה",
          description: data.error,
          variant: "destructive",
        });
      }
    }
  });

  const subscriptionData = status as SubscriptionStatus;
  
  // Debug info
  console.log('Subscription status:', subscriptionData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium">טוען מידע מנוי...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="border-red-200 max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>שגיאה בטעינת מידע המנוי</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>🤖</span>
            רובוט שבת - ניהול אוטומטי
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            בחר את התוכנית המתאימה לך
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ניהול אוטומטי של תוכן ברשתות חברתיות לשמירת שבת וחגים
          </p>
          
          {subscriptionData && (
            <div className="mt-8 inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
              <div className={`w-2 h-2 rounded-full ${subscriptionData.hasSubscription ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">
                {subscriptionData.hasSubscription ? 'מנוי פעיל' : 'אין מנוי פעיל'}
              </span>
            </div>
          )}
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/70 backdrop-blur-sm p-1 rounded-full border border-white/20">
            <div className="flex items-center">
              <div className="px-6 py-2 text-sm font-medium text-gray-600">חודשי</div>
              <div className="px-6 py-2 bg-green-500 text-white rounded-full text-sm font-medium flex items-center gap-2">
                שנתי
                <span className="bg-green-600 px-2 py-1 rounded text-xs">חסכון 10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Monthly Plan */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">מנוי חודשי</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-blue-600">$9.90</span>
                <span className="text-gray-500">/חודש</span>
              </div>
              <p className="text-gray-600 mt-2">מתאים להתחלה</p>
            </div>

            <div className="space-y-4 mb-8">
              {['YouTube', 'Facebook', 'Instagram', 'TikTok', 'אוטומציה 24/7', 'שבת ראשונה חינם'].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {subscriptionData?.canStartTrial && !subscriptionData?.hasSubscription ? (
              <Button 
                onClick={() => startTrialMutation.mutate()}
                disabled={startTrialMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {startTrialMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : (
                  'התחל ניסיון חינם'
                )}
              </Button>
            ) : subscriptionData?.subscription?.planType === 'monthly' ? (
              <div className="w-full bg-blue-100 text-blue-800 py-4 rounded-2xl text-center font-semibold">
                המנוי הנוכחי שלך ✓
              </div>
            ) : subscriptionData?.hasSubscription ? (
              <Button 
                variant="outline"
                className="w-full py-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300"
                size="lg"
                disabled
              >
                שנה למנוי חודשי
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  כבר ניצלת את השבת הראשונה החינם
                </p>
                <Button 
                  variant="outline"
                  className="w-full py-4 rounded-2xl border-2 border-gray-200"
                  size="lg"
                  disabled
                >
                  חיוב מיידי - $9.90/חודש
                </Button>
              </div>
            )}
          </div>

          {/* Annual Plan - Premium */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
            
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">מנוי שנתי</h3>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">הכי פופולרי</span>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80 line-through">$118.80</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$108</span>
                    <span className="opacity-80">/שנה</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 rounded-2xl p-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">$9</div>
                  <div className="text-sm opacity-90">לחודש במקום $9.90</div>
                  <div className="text-xs opacity-80 mt-1">חסכון של חודש שלם!</div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {['YouTube', 'Facebook', 'Instagram', 'TikTok', 'אוטומציה 24/7', 'שבת ראשונה חינם'].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {subscriptionData?.canStartTrial && !subscriptionData?.hasSubscription ? (
                <Button 
                  onClick={() => startAnnualTrialMutation.mutate()}
                  disabled={startAnnualTrialMutation.isPending}
                  className="w-full bg-white text-green-600 hover:bg-gray-50 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {startAnnualTrialMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  ) : (
                    'התחל ניסיון חינם - שנתי'
                  )}
                </Button>
              ) : subscriptionData?.subscription?.planType === 'annual' ? (
                <div className="w-full bg-white/20 py-4 rounded-2xl text-center font-semibold">
                  המנוי הנוכחי שלך ✓
                </div>
              ) : subscriptionData?.hasSubscription ? (
                <Button 
                  variant="outline"
                  className="w-full py-4 rounded-2xl border-2 border-white/30 hover:border-white/50 text-white hover:bg-white/10"
                  size="lg"
                  disabled
                >
                  שנה למנוי שנתי
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm opacity-80 mb-3">
                    כבר ניצלת את השבת הראשונה החינם
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full py-4 rounded-2xl border-2 border-white/30 text-white"
                    size="lg"
                    disabled
                  >
                    חיוב מיידי - $108/שנה
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Status */}
        {subscriptionData?.hasSubscription && (
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>מצב מנוי נוכחי</span>
                  <Badge variant={
                    subscriptionData.subscription?.status === 'active' ? 'default' :
                    subscriptionData.subscription?.status === 'trial' ? 'secondary' :
                    subscriptionData.subscription?.status === 'pending_payment' ? 'destructive' :
                    'outline'
                  }>
                    {subscriptionData.subscription?.status === 'trial' ? 'ניסיון' :
                     subscriptionData.subscription?.status === 'active' ? 'פעיל' :
                     subscriptionData.subscription?.status === 'pending_payment' ? 'ממתין לתשלום' :
                     'בוטל'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Subscription Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">סוג מנוי:</span>
                    <div className="font-medium">
                      {subscriptionData.subscription?.planType === 'annual' ? 'שנתי' : 'חודשי'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">מחיר:</span>
                    <div className="font-medium">
                      ${(subscriptionData.subscription?.amount || 0) / 100}
                      {subscriptionData.subscription?.planType === 'annual' ? '/שנה' : '/חודש'}
                    </div>
                  </div>
                </div>

                {/* Trial Status */}
                {subscriptionData.trialStatus?.isInTrial && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">תקופת ניסיון</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      נותרו {subscriptionData.trialStatus.daysRemaining} ימים בתקופת הניסיון
                    </p>
                    {subscriptionData.trialStatus.paymentDue && (
                      <p className="text-sm text-amber-600 mt-1">
                        תשלום נדרש להמשך השירות
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Setup */}
                {!subscriptionData.subscription?.cardSetup && subscriptionData.trialStatus?.isInTrial && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => setupPaymentMutation.mutate()}
                      disabled={setupPaymentMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {setupPaymentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 ml-2" />
                          הגדר אמצעי תשלום
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Cancel Button */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => cancelMutation.mutate("User cancelled during trial")}
                    disabled={cancelMutation.isPending}
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <>
                        <X className="h-4 w-4 ml-2" />
                        בטל מנוי
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}