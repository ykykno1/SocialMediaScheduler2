import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShabbatTimes {
  date: string;
  shabbatEntry: string;
  shabbatExit: string;
  campaignClosure: string;
  candleLighting: string;
  havdalah: string;
  parasha: string;
  hebrewDate: string;
  city: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const MAJOR_CITIES = [
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem' },
  { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, timezone: 'Asia/Jerusalem' },
  { name: 'Haifa', lat: 32.7940, lng: 34.9896, timezone: 'Asia/Jerusalem' },
  { name: 'Beer Sheva', lat: 31.2518, lng: 34.7915, timezone: 'Asia/Jerusalem' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'London', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, timezone: 'Australia/Melbourne' }
];

export function ShabbatWidget() {
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTimes | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentCity, setCurrentCity] = useState<string>('Jerusalem');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Load saved city from localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('shabbat_city');
    if (savedCity) {
      setCurrentCity(savedCity);
    } else {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // For now, we'll use the major cities list
            // In a real app, you'd geocode the coordinates to get the nearest city
            setCurrentCity('Jerusalem'); // Default fallback
          },
          (error) => {
            console.log('Location access denied, using Jerusalem as default');
            setCurrentCity('Jerusalem');
          }
        );
      }
    }
  }, []);

  // Fetch Shabbat times from API
  const fetchShabbatTimes = async (city: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/shabbat/times?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Shabbat times');
      }
      
      const data = await response.json();
      setShabbatTimes(data);
    } catch (err) {
      setError('Unable to load Shabbat times. Please try again later.');
      console.error('Error fetching Shabbat times:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate countdown to campaign closure (30 minutes before Shabbat entry)
  const calculateCountdown = () => {
    if (!shabbatTimes) return;

    const now = new Date();
    const campaignClosureTime = new Date(shabbatTimes.campaignClosure);
    const timeUntil = campaignClosureTime.getTime() - now.getTime();

    if (timeUntil > 0) {
      const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    } else {
      // Check if we're in Shabbat (between campaign closure and Havdalah)
      const shabbatExitTime = new Date(shabbatTimes.shabbatExit);
      if (now < shabbatExitTime) {
        // We're in Shabbat, show time until Shabbat exit
        const timeUntilExit = shabbatExitTime.getTime() - now.getTime();
        const hours = Math.floor(timeUntilExit / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilExit % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilExit % (1000 * 60)) / 1000);
        
        setCountdown({ days: 0, hours, minutes, seconds });
      } else {
        // Shabbat has ended, fetch next week's times
        fetchShabbatTimes(currentCity);
      }
    }
  };

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [shabbatTimes]);

  // Fetch times when city changes
  useEffect(() => {
    fetchShabbatTimes(currentCity);
  }, [currentCity]);

  // Handle city change
  const handleCityChange = (newCity: string) => {
    setCurrentCity(newCity);
    localStorage.setItem('shabbat_city', newCity);
    setShowCitySelector(false);
  };

  const formatCountdown = () => {
    if (!shabbatTimes) return '';
    
    const now = new Date();
    const campaignClosureTime = new Date(shabbatTimes.campaignClosure);
    const shabbatExitTime = new Date(shabbatTimes.shabbatExit);
    
    if (now >= campaignClosureTime && now < shabbatExitTime) {
      // We're in Shabbat (after campaign closure)
      if (countdown.hours > 0 || countdown.minutes > 0) {
        return `שבת נגמר בעוד: ${countdown.hours}:${countdown.minutes.toString().padStart(2, '0')}`;
      }
      return 'שבת שלום';
    } else {
      // Before campaign closure
      if (countdown.days > 0) {
        return `הסתרת תוכן בעוד: ${countdown.days} ימים, ${countdown.hours}:${countdown.minutes.toString().padStart(2, '0')}`;
      } else if (countdown.hours > 0) {
        return `הסתרת תוכן בעוד: ${countdown.hours}:${countdown.minutes.toString().padStart(2, '0')}`;
      } else {
        return `הסתרת תוכן בעוד: ${countdown.minutes}:${countdown.seconds.toString().padStart(2, '0')}`;
      }
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(timeString);
      // Convert to Jerusalem timezone and format
      return time.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem',
        hour12: false
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => fetchShabbatTimes(currentCity)} 
            className="w-full mt-4"
            variant="outline"
          >
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">זמני שבת</h3>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{currentCity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCitySelector(!showCitySelector)}
            >
              שנה
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showCitySelector && (
          <div className="mb-4">
            <Select onValueChange={handleCityChange} value={currentCity}>
              <SelectTrigger>
                <SelectValue placeholder="בחר עיר" />
              </SelectTrigger>
              <SelectContent>
                {MAJOR_CITIES.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {shabbatTimes && (
          <>
            {/* Hebrew Date at Top */}
            <div className="space-y-2">
              <div className="text-center">
                {shabbatTimes.hebrewDate && (
                  <p className="text-sm font-medium text-primary mb-2">
                    {shabbatTimes.hebrewDate}
                  </p>
                )}
                <p className="text-lg font-medium">{formatDate(shabbatTimes.date)}</p>
              </div>
            </div>

            {/* Prominent Shabbat Entry/Exit Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">כניסת שבת</p>
                <p className="text-xl font-bold">{formatTime(shabbatTimes.shabbatEntry)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  הדלקת נרות: {formatTime(shabbatTimes.candleLighting)}
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">יציאת שבת</p>
                <p className="text-xl font-bold">{formatTime(shabbatTimes.shabbatExit)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  הבדלה: {formatTime(shabbatTimes.havdalah)}
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="text-center p-4 bg-primary/5 rounded-lg border">
              <p className="text-lg font-medium text-primary">
                {formatCountdown()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                * הסתרת תוכן 30 דקות לפני כניסת שבת
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}