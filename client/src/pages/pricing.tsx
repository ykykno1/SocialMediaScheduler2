import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Youtube, Facebook, Instagram } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = (plan: 'youtube' | 'premium') => {
    if (user) {
      const upgradedUser = { ...user, accountType: plan as any };
      setUser(upgradedUser);
      localStorage.setItem('shabbat-robot-user', JSON.stringify(upgradedUser));
      
      toast({
        title: "שדרוג הושלם בהצלחה!",
        description: plan === 'youtube' 
          ? "כעת יש לך גישה לאוטומציה של יוטיוב"
          : "כעת יש לך גישה לכל הרשתות החברתיות",
      });
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'חינם',
      price: '₪0',
      description: 'מסלול בסיסי להתנסות',
      features: [
        { text: 'הסתרה ידנית ביוטיוב', included: true },
        { text: 'מוגבל ל-4 הסתרות לחודש', included: true, highlight: true },
        { text: 'ללא אוטומציה', included: false },
        { text: 'פייסבוק ואינסטגרם', included: false },
        { text: 'תזמון אוטומטי לשבת', included: false },
      ],
      current: user?.accountType === 'free',
      buttonText: 'מסלול נוכחי',
      buttonDisabled: true,
    },
    {
      id: 'youtube',
      name: 'יוטיוב פרו',
      price: '₪14.90',
      period: '/חודש',
      description: 'אוטומציה מלאה ליוטיוב',
      features: [
        { text: 'הסתרות בלתי מוגבלות', included: true },
        { text: 'אוטומציה מלאה ליוטיוב', included: true },
        { text: 'תזמון אוטומטי לשבת', included: true },
        { text: 'זיהוי תוכן קיים', included: true },
        { text: 'פייסבוק ואינסטגרם', included: false },
      ],
      popular: true,
      current: user?.accountType === 'youtube',
      buttonText: user?.accountType === 'youtube' ? 'מסלול נוכחי' : 'שדרג ליוטיוב פרו',
      buttonDisabled: user?.accountType === 'youtube',
    },
    {
      id: 'premium',
      name: 'פרימיום',
      price: '₪24.90',
      period: '/חודש',
      description: 'גישה לכל הרשתות החברתיות',
      features: [
        { text: 'כל התכונות של יוטיוב פרו', included: true },
        { text: 'פייסבוק - הסתרת פוסטים', included: true },
        { text: 'אינסטגרם - ארכוב פוסטים', included: true },
        { text: 'תמיכה מועדפת', included: true },
        { text: 'תכונות עתידיות', included: true },
      ],
      current: user?.accountType === 'premium',
      buttonText: user?.accountType === 'premium' ? 'מסלול נוכחי' : 'שדרג לפרימיום',
      buttonDisabled: user?.accountType === 'premium',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">מחירים ומסלולים</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          בחר את המסלול המתאים לך. כל המסלולים כוללים תמיכה מלאה ועדכונים חינמיים.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${plan.current ? 'border-green-500' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                הכי פופולרי
              </Badge>
            )}
            {plan.current && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                מסלול נוכחי
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.id === 'free' && <Youtube className="h-5 w-5 text-gray-400" />}
                {plan.id === 'youtube' && <Youtube className="h-5 w-5 text-red-600" />}
                {plan.id === 'premium' && <Crown className="h-5 w-5 text-yellow-500" />}
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="py-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-500">{plan.period}</span>}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'} ${feature.highlight ? 'font-semibold text-orange-600' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.current ? "secondary" : "default"}
                disabled={plan.buttonDisabled}
                onClick={() => plan.id !== 'free' && handleUpgrade(plan.id as 'youtube' | 'premium')}
              >
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8 text-sm text-gray-500">
        <p>כל המחירים כוללים מע"מ • ניתן לבטל בכל עת • תמיכה בעברית</p>
      </div>
    </div>
  );
}