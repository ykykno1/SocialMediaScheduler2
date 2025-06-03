import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Youtube, Facebook, Instagram, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const PricingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleUpgrade = async (planType: 'youtube' | 'premium') => {
    const user = localStorage.getItem('shabbat-robot-user');
    if (!user) {
      toast({
        title: "נדרשת התחברות",
        description: "יש להתחבר תחילה כדי לשדרג",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-payment", {
        planType,
        amount: planType === 'youtube' ? 14.9 : 24.9
      });
      
      const result = await response.json();
      
      if (result.paymentUrl) {
        // Redirect to Stripe payment
        window.location.href = result.paymentUrl;
      }
    } catch (error: any) {
      toast({
        title: "שגיאה ביצירת תשלום",
        description: error.message || "לא ניתן ליצור קישור תשלום",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'חשבון חינמי',
      price: 0,
      currency: 'ח״ש',
      description: 'מושלם להתחלה',
      features: [
        'ניהול יוטיוב בלבד',
        'תזמון שבת אוטומטי',
        'הסתרה ושחזור פוסטים',
        'מעקב אחר מצב מקורי',
        'תמיכה בסיסית'
      ],
      icon: Youtube,
      popular: false,
      buttonText: 'מתחיל חינם',
      disabled: true
    },
    {
      id: 'youtube',
      name: 'יוטיוב מתקדם',
      price: 14.9,
      currency: 'ח״ש',
      description: 'לניהול מתקדם של יוטיוב',
      features: [
        'כל התכונות החינמיות',
        'ניהול מתקדם של יוטיוב',
        'תזמון מותאם אישית',
        'שמירת העדפות',
        'סטטיסטיקות מפורטות',
        'תמיכה מועדפת'
      ],
      icon: Youtube,
      popular: false,
      buttonText: 'שדרג ליוטיוב',
      planType: 'youtube' as const
    },
    {
      id: 'premium',
      name: 'כל הפלטפורמות',
      price: 24.9,
      currency: 'ח״ש',
      description: 'פתרון מלא לכל הרשתות',
      features: [
        'כל התכונות של יוטיוב',
        'ניהול פייסבוק מלא',
        'ניהול אינסטגרם',
        'תזמון מרובה פלטפורמות',
        'ניתוח חוצה פלטפורמות',
        'תמיכה VIP 24/7',
        'גיבוי והחזרה',
        'API מתקדם'
      ],
      icon: Crown,
      popular: true,
      buttonText: 'שדרג לפרימיום',
      planType: 'premium' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            תמחור פשוט ושקוף
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            בחר את התוכנית המתאימה לך
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            מערכת ניהול רשתות חברתיות לשבת - החל מחינם עם יוטיוב, שדרג לפלטפורמות נוספות
          </p>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">סטטוס פלטפורמות</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <Youtube className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">יוטיוב - פעיל ועובד במלואו</span>
            </div>
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">פייסבוק - בהליכי אישור</span>
            </div>
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <Instagram className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-medium">אינסטגרם - בהליכי אישור</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    הכי פופולרי
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-fit">
                  <plan.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 mr-1">{plan.currency}</span>
                  <span className="text-sm text-gray-500">/חודש</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 space-x-reverse">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  disabled={plan.disabled || isLoading}
                  onClick={() => plan.planType && handleUpgrade(plan.planType)}
                >
                  {plan.disabled ? 'כבר פעיל' : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">שאלות נפוצות</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">האם יש תקופת ניסיון חינמית?</h4>
              <p className="text-sm text-gray-600">כן! כל משתמש חדש מקבל גישה חינמית ליוטיוב ללא הגבלת זמן.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">האם אוכל לבטל בכל עת?</h4>
              <p className="text-sm text-gray-600">בהחלט. אין התחייבות ארוכת טווח ותוכל לבטל או לשנות תוכנית בכל עת.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">מה קורה לתוכן שלי?</h4>
              <p className="text-sm text-gray-600">התוכן שלך נשאר שלך. אנחנו רק מנהלים את הנראות שלו בזמני שבת.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">איך פועל התזמון?</h4>
              <p className="text-sm text-gray-600">המערכת מתזמנת אוטומטית לפי זמני שבת באזור הזמן שלך.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button onClick={() => setLocation("/login")} size="lg">
            התחל עכשיו חינם
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            לא נדרש כרטיס אשראי להתחלה
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;