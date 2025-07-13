/**
 * Subscription Management Page - Safe Stripe integration
 * This page is separate from existing functionality
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  hasSubscription: boolean;
  canStartTrial: boolean;
  subscription?: {
    id: string;
    userId: string;
    status: 'trial' | 'pending_payment' | 'active' | 'cancelled';
    planType: 'monthly' | 'annual';
    trialStartDate: string;
    paymentDueDate?: string;
    cardSetup: boolean;
    amount: number;
  };
  trialStatus?: {
    isInTrial: boolean;
    daysRemaining: number;
    paymentDue: boolean;
  };
  paymentRequired?: boolean;
  message?: string;
}

export default function Subscription() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/status'],
    retry: 1
  });

  // Start trial mutation (monthly)
  const startTrialMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/start-trial', { planType: 'monthly' }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "שבת ראשונה חינם!",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      } else {
        toast({
          title: "שגיאה",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחלת ניסיון",
        description: error.message || "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  });

  // Start annual trial mutation
  const startAnnualTrialMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/start-trial', { planType: 'annual' }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "שבת ראשונה חינם!",
          description: "התחלת במנוי שנתי עם חודש במתנה",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      } else {
        toast({
          title: "שגיאה",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחלת ניסיון שנתי",
        description: error.message || "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  });

  // Setup payment method mutation  
  const setupPaymentMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/subscription/setup-payment'),
    onSuccess: (data) => {
      if (data.success) {
        // In real Stripe, would redirect to Stripe Elements
        toast({
          title: "הגדרת תשלום",
          description: "דמו: כרטיס אשראי הוגדר בהצלחה",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
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
      if (data.success) {
        toast({
          title: "מנוי בוטל",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      }
    }
  });

  const subscriptionData = status as SubscriptionStatus;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">טוען מידע מנוי...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="border-red-200">
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">ניהול מנוי</h1>
          <p className="text-muted-foreground">
            נהל את המנוי שלך לרובוט שבת - $9.90 לחודש לכל הפלטפורמות
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Monthly Plan */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">מנוי חודשי</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-blue-600">$9.90</span>
                <span className="text-muted-foreground">/חודש</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>YouTube</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Facebook</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>TikTok</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>אוטומציה 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>שבת ראשונה חינם</span>
                </div>
              </div>
              {/* Monthly Plan CTA */}
              {subscriptionData?.canStartTrial && (
                <div className="pt-4">
                  <Button 
                    onClick={() => startTrialMutation.mutate()}
                    disabled={startTrialMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {startTrialMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      'התחל ניסיון חינם - חודשי'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-green-200 bg-green-50/50 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white px-3 py-1">
                חודש במתנה!
              </Badge>
            </div>
            <CardHeader className="text-center pt-6">
              <CardTitle className="text-xl">מנוי שנתי</CardTitle>
              <CardDescription className="space-y-1">
                <div>
                  <span className="text-2xl font-bold text-green-600">$108</span>
                  <span className="text-muted-foreground">/שנה</span>
                </div>
                <div className="text-sm text-green-600">
                  חוסך $10.80 בשנה (חודש במתנה!)
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>YouTube</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Facebook</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>TikTok</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>אוטומציה 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>שבת ראשונה חינם</span>
                </div>
              </div>
              <div className="pt-2 text-center">
                <div className="text-sm font-medium text-green-700">
                  רק $9/חודש במקום $9.90
                </div>
              </div>
              {/* Annual Plan CTA */}
              {subscriptionData?.canStartTrial && (
                <div className="pt-4">
                  <Button 
                    onClick={() => startAnnualTrialMutation.mutate()}
                    disabled={startAnnualTrialMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {startAnnualTrialMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      'התחל ניסיון חינם - שנתי'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        {subscriptionData?.hasSubscription ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>מצב מנוי נוכחי</span>
                <Badge variant={
                  subscriptionData.subscription?.status === 'active' ? 'default' :
                  subscriptionData.subscription?.status === 'trial' ? 'secondary' :
                  subscriptionData.subscription?.status === 'pending_payment' ? 'destructive' :
                  'outline'
                }>
                  {subscriptionData.subscription?.status === 'trial' && 'ניסיון חינם'}
                  {subscriptionData.subscription?.status === 'pending_payment' && 'ממתין לתשלום'}
                  {subscriptionData.subscription?.status === 'active' && 'פעיל'}
                  {subscriptionData.subscription?.status === 'cancelled' && 'בוטל'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Subscription Plan Info */}
              {subscriptionData.subscription && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-700">
                        {subscriptionData.subscription.planType === 'annual' ? 'מנוי שנתי' : 'מנוי חודשי'}
                      </div>
                      <div className="text-sm text-blue-600">
                        {subscriptionData.subscription.planType === 'annual' 
                          ? '$108/שנה (חודש במתנה!)' 
                          : '$9.90/חודש'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      {subscriptionData.subscription.planType === 'annual' ? 'שנתי' : 'חודשי'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Trial Status */}
              {subscriptionData.trialStatus?.isInTrial && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      שבת ראשונה חינם - נותרו {subscriptionData.trialStatus.daysRemaining} ימים
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    תאריך תשלום: {subscriptionData.subscription?.paymentDueDate && 
                      new Date(subscriptionData.subscription.paymentDueDate).toLocaleDateString('he-IL')}
                  </p>
                </div>
              )}

              {/* Payment Due */}
              {subscriptionData.paymentRequired && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">תשלום נדרש</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    הניסיון הסתיים. נדרש תשלום כדי להמשיך לגשת לשירות.
                  </p>
                </div>
              )}

              {/* Payment Setup Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">כרטיס אשראי</p>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionData.subscription?.cardSetup ? 
                        'הוגדר בהצלחה' : 'לא הוגדר'}
                    </p>
                  </div>
                </div>
                {!subscriptionData.subscription?.cardSetup && 
                 subscriptionData.subscription?.status === 'trial' && (
                  <Button 
                    onClick={() => setupPaymentMutation.mutate()}
                    disabled={setupPaymentMutation.isPending}
                    size="sm"
                  >
                    {setupPaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      'הגדר כרטיס'
                    )}
                  </Button>
                )}
              </div>

              {/* Cancel Option */}
              {subscriptionData.subscription?.status !== 'cancelled' && 
               subscriptionData.subscription?.status !== 'active' && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => cancelMutation.mutate('User cancelled during trial')}
                    disabled={cancelMutation.isPending}
                    className="w-full"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      'בטל מנוי'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    אפשר לבטל בכל עת ללא חיוב
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // No subscription - Start trial option
          <Card>
            <CardHeader className="text-center">
              <CardTitle>התחל שבת ראשונה חינם</CardTitle>
              <CardDescription>
                נסה את כל התכונות ללא תשלום. תחויב רק ביום שלישי אחרי השבת הראשונה.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Trial Benefits */}
              <div className="space-y-2">
                <h4 className="font-medium">מה כלול בניסיון החינמי:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>גישה לכל הפלטפורמות (YouTube, Facebook, Instagram, TikTok)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>אוטומציה מלאה בזמן השבת</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>ללא התחייבות - אפשר לבטל בכל עת</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>תחויב רק אם תמשיך אחרי השבת הראשונה</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => startTrialMutation.mutate()}
                disabled={startTrialMutation.isPending}
                className="w-full"
                size="lg"
              >
                {startTrialMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  'התחל ניסיון חינם'
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                ביום שלישי אחרי השבת הראשונה תתבקש להזין פרטי כרטיס אשראי. 
                ללא כרטיס - השירות יפסק אוטומטית.
              </p>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>איך זה עובד?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">התחל ניסיון חינם</p>
                  <p className="text-sm text-muted-foreground">
                    גישה מלאה לכל התכונות במשך השבת הראשונה
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">הגדר כרטיס אשראי</p>
                  <p className="text-sm text-muted-foreground">
                    שמירה בטוחה ללא חיוב מיידי
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">תשלום ביום שלישי</p>
                  <p className="text-sm text-muted-foreground">
                    $9.90 יחויבו ביום שלישי אחרי השבת הראשונה
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}