import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  Smartphone, 
  Zap, 
  Heart,
  Star,
  CheckCircle,
  Youtube,
  Facebook,
  Instagram,
  Calendar,
  Users,
  Settings,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('premium');

  const features = [
    {
      icon: Clock,
      title: 'אוטומציה מלאה',
      description: 'הסתרה והצגה אוטומטית של תוכן בזמני שבת וחג ללא התערבות ידנית'
    },
    {
      icon: Shield,
      title: 'שמירה על פרטיות',
      description: 'הגנה מלאה על נתונים אישיים ותוכן רגיש במהלך זמני קדושה'
    },
    {
      icon: Smartphone,
      title: 'תמיכה מרובת פלטפורמות',
      description: 'ניהול יוטיוב, פייסבוק, אינסטגרם ועוד מממשק אחד'
    },
    {
      icon: Zap,
      title: 'הגדרה חד פעמית',
      description: 'הגדר פעם אחת ותהנה מפתרון אוטומטי לכל שבת וחג'
    },
    {
      icon: Globe,
      title: 'זמנים מדויקים',
      description: 'שימוש בנתוני חב"ד המדויקים ביותר עבור כל מקום בעולם'
    },
    {
      icon: Users,
      title: 'קהילה תומכת',
      description: 'הצטרף לקהילה של יהודים שומרי מסורת המשתמשים בטכנולוגיה בחכמה'
    }
  ];

  const testimonials = [
    {
      name: 'רחל כהן',
      role: 'יוצרת תוכן',
      content: 'סוף סוף יכולה להתרכז בשבת בלי לדאוג שמישהו יראה תוכן שלא מתאים',
      rating: 5
    },
    {
      name: 'יוסי לוי',
      role: 'בעל עסק',
      content: 'הפתרון המושלם לניהול העסק שלי ברשתות החברתיות תוך שמירה על ערכים',
      rating: 5
    },
    {
      name: 'מרים גולדברג',
      role: 'אמא ויוצרת',
      content: 'פשוט ומדויק. הילדים שלי יכולים לגלוש בבטחה כי הכל מוסתר בזמן',
      rating: 5
    }
  ];

  const plans = [
    {
      name: 'חינם',
      price: '₪0',
      period: '/חודש',
      description: 'מושלם להתחלה',
      features: [
        'ניהול יוטיוב בלבד',
        'הסתרה אוטומטית בשבת',
        'זמני שבת מדויקים',
        'תמיכה בסיסית'
      ],
      popular: false,
      ctaText: 'התחל חינם'
    },
    {
      name: 'פרימיום',
      price: '₪29',
      period: '/חודש',
      description: 'הפתרון המלא',
      features: [
        'כל פלטפורמות המדיה החברתית',
        'ניהול עמודים עסקיים',
        'פרסומות ממומנות',
        'הגדרות מתקדמות',
        'תמיכה מועדפת',
        'גיבוי אוטומטי'
      ],
      popular: true,
      ctaText: 'השדרג עכשיו'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">רובוט שבת</div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/auth">התחבר</Link>
            </Button>
            <Button asChild>
              <Link href="/auth">הירשם</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 px-4 py-2">
            הטכנולוגיה המתקדמת ביותר לשמירת שבת
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            שמור על הקדושה<br />
            גם בעולם הדיגיטלי
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            רובוט שבת מנהל עבורך את התוכן ברשתות החברתיות בזמני שבת וחג,
            כך שתוכל להתרכז במה שחשוב באמת - בזמן איכות עם המשפחה והקהילה
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link href="/auth">
                <Heart className="h-5 w-5 mr-2" />
                התחל בחינם היום
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              <Calendar className="h-5 w-5 mr-2" />
              צפה בדמו
            </Button>
          </div>

          {/* Platform Icons */}
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Youtube className="h-8 w-8 text-red-600" />
              <span className="text-sm">YouTube</span>
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="h-8 w-8 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-8 w-8 text-pink-600" />
              <span className="text-sm">Instagram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">למה לבחור ברובוט שבת?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              פתרון מתקדם ובטוח לניהול אוטומטי של תוכן דיגיטלי בהתאם למסורת היהודית
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow p-6">
                <CardContent className="text-center p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">איך זה עובד?</h2>
            <p className="text-xl text-gray-600">תהליך פשוט בשלושה שלבים</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">התחבר לפלטפורמות</h3>
              <p className="text-gray-600">חבר את חשבונות הרשתות החברתיות שלך בצורה בטוחה</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">הגדר העדפות</h3>
              <p className="text-gray-600">בחר את הזמנים והתוכן שרצונך להסתיר או להציג</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">תהנה משלווה</h3>
              <p className="text-gray-600">המערכת תפעל אוטומטית - אתה יכול להתרכז בשבת</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">מה אומרים המשתמשים</h2>
            <p className="text-xl text-gray-600">אלפי משפחות כבר נהנות משלווה בשבת</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg p-6">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">תוכניות מחיר</h2>
            <p className="text-xl text-gray-600">בחר את התוכנית המתאימה לך</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-2 ${plan.popular ? 'border-blue-500 shadow-2xl' : 'border-gray-200'} p-8`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1">
                    הכי פופולרי
                  </Badge>
                )}
                
                <CardContent className="p-0 text-center">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  
                  <Button 
                    className={`w-full mb-6 ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/auth">{plan.ctaText}</Link>
                  </Button>
                  
                  <ul className="text-right space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">מוכן להתחיל?</h2>
          <p className="text-xl mb-8 opacity-90">
            הצטרף לאלפי משפחות שכבר נהנות משלווה בשבת
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild>
              <Link href="/auth">
                התחל חינם עכשיו
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
              יצירת קשר
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">רובוט שבת</h3>
              <p className="text-gray-400">
                הפתרון המתקדם לשמירת קדושת השבת בעולם הדיגיטלי
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">קישורים</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">אודות</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">מחירים</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">מדיניות פרטיות</Link></li>
                <li><Link href="/data-deletion" className="hover:text-white transition-colors">מחיקת נתונים</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@shabbat-robot.com" className="hover:text-white transition-colors">תמיכה טכנית</a></li>
                <li><a href="tel:+972-50-1234567" className="hover:text-white transition-colors">050-123-4567</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">פלטפורמות נתמכות</h4>
              <div className="flex gap-4">
                <Youtube className="h-6 w-6 text-red-500" />
                <Facebook className="h-6 w-6 text-blue-500" />
                <Instagram className="h-6 w-6 text-pink-500" />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} רובוט שבת. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}