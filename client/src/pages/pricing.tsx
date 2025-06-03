import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Crown, 
  Youtube, 
  Instagram, 
  Facebook,
  ArrowRight,
  Shield,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'youtube_only' | 'all_platforms' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'youtube_only',
      name: 'YouTube בלבד',
      price: 14.90,
      description: 'מושלם למתחילים',
      features: [
        'הסתרה אוטומטית של סרטוני YouTube',
        'שחזור אוטומטי בצאת השבת',
        'זיכרון מצב מקורי של הסרטונים',
        'מנגנון נעילה ידנית',
        'לוח זמני שבת',
        'תמיכה בצ\'אט'
      ],
      platforms: ['youtube'],
      popular: false
    },
    {
      id: 'all_platforms',
      name: 'כל הרשתות',
      price: 24.90,
      description: 'הפתרון המלא',
      features: [
        'כל התכונות של YouTube',
        'הסתרה ב-Facebook Pages',
        'הסתרה ב-Instagram',
        'תמיכה ב-TikTok (בקרוב)',
        'ניהול מרכזי של כל הפלטפורמות',
        'דוחות מפורטים',
        'תמיכה עדיפות'
      ],
      platforms: ['youtube', 'facebook', 'instagram', 'tiktok'],
      popular: true
    }
  ];

  const handleSelectPlan = async (planId: 'youtube_only' | 'all_platforms') => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('shabbat-robot-user') || '{}');
      
      // Create subscription
      const response = await apiRequest('POST', '/api/create-subscription', {
        userId: user.id,
        plan: planId,
        price: plans.find(p => p.id === planId)?.price
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.requiresPayment) {
          // Redirect to Stripe checkout
          window.location.href = result.checkoutUrl;
        } else {
          // Subscription created successfully (manual/demo)
          toast({
            title: 'מנוי הופעל בהצלחה!',
            description: 'כעת תוכל להפעיל מצב שבת'
          });
          setLocation('/');
        }
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה ביצירת המנוי',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube className="h-4 w-4 text-red-600" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">רובוט שבת</h1>
            </div>
            
            <Button variant="ghost" onClick={() => setLocation('/')}>
              חזרה לדף הבית
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            בחר את התוכנית המתאימה לך
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            הפעל מצב שבת אוטומטי ברשתות החברתיות שלך
          </p>
          <p className="text-sm text-gray-500">
            ביטול בכל עת • ללא התחייבות • תמיכה מלאה בעברית
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all hover:shadow-lg ${
                plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Crown className="h-3 w-3 mr-1" />
                    הכי פופולרי
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">₪{plan.price}</span>
                  <span className="text-gray-600 text-lg">/חודש</span>
                </div>

                {/* Supported Platforms */}
                <div className="flex justify-center space-x-2 mt-4">
                  {plan.platforms.map((platform) => (
                    <div key={platform} className="flex items-center">
                      {getPlatformIcon(platform)}
                    </div>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-right">
                      <Check className="h-4 w-4 text-green-600 ml-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Action Button */}
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id as 'youtube_only' | 'all_platforms')}
                  disabled={isLoading}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  התחל עכשיו
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  7 ימי ניסיון חינם • ביטול בכל עת
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">שאלות נפוצות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <h4 className="font-medium text-sm mb-2">איך עובד מצב שבת?</h4>
                <p className="text-sm text-gray-600">
                  המערכת מסתירה אוטומטית את הפוסטים שלך לפני שבת ומחזירה אותם לפעילות בצאת השבת.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">מה קורה לפוסטים קיימים?</h4>
                <p className="text-sm text-gray-600">
                  המערכת זוכרת את המצב המקורי של כל פוסט ולא תשחזר פוסטים שהיו מוסתרים מלכתחילה.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">האם אפשר לבטל?</h4>
                <p className="text-sm text-gray-600">
                  כן, ניתן לבטל את המנוי בכל עת ללא עמלות ביטול או התחייבות.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">איך משלמים?</h4>
                <p className="text-sm text-gray-600">
                  תשלום מאובטח באמצעות כרטיס אשראי דרך מערכת Stripe. התשלום חודשי.
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            🔒 כל הנתונים מוצפנים ומאובטחים • אנחנו לא שומרים פרטי כרטיס אשראי
          </p>
        </div>

      </div>
    </div>
  );
}