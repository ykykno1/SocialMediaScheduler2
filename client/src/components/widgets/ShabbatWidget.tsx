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
  shabbats?: Array<{
    date: string;
    shabbatEntry: string;
    shabbatExit: string;
    parasha: string;
    hebrewDate: string;
    entryTime: string;
    exitTime: string;
  }>;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const MAJOR_CITIES = [
  // Israeli Cities (with Mako times)
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem' },
  { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, timezone: 'Asia/Jerusalem' },
  { name: 'Haifa', lat: 32.7940, lng: 34.9896, timezone: 'Asia/Jerusalem' },
  { name: 'Beer Sheva', lat: 31.2518, lng: 34.7915, timezone: 'Asia/Jerusalem' },
  { name: 'Netanya', lat: 32.3215, lng: 34.8532, timezone: 'Asia/Jerusalem' },
  { name: 'Ashdod', lat: 31.8044, lng: 34.6553, timezone: 'Asia/Jerusalem' },
  { name: 'Petah Tikva', lat: 32.0870, lng: 34.8882, timezone: 'Asia/Jerusalem' },
  { name: 'Rishon LeZion', lat: 31.9730, lng: 34.8066, timezone: 'Asia/Jerusalem' },
  { name: 'Ashkelon', lat: 31.6688, lng: 34.5742, timezone: 'Asia/Jerusalem' },
  { name: 'Rehovot', lat: 31.8947, lng: 34.8081, timezone: 'Asia/Jerusalem' },
  { name: 'Bat Yam', lat: 32.0167, lng: 34.7500, timezone: 'Asia/Jerusalem' },
  { name: 'Herzliya', lat: 32.1624, lng: 34.8442, timezone: 'Asia/Jerusalem' },
  { name: 'Kfar Saba', lat: 32.1743, lng: 34.9077, timezone: 'Asia/Jerusalem' },
  { name: 'Ra\'anana', lat: 32.1847, lng: 34.8707, timezone: 'Asia/Jerusalem' },
  { name: 'Modi\'in', lat: 31.8969, lng: 35.0095, timezone: 'Asia/Jerusalem' },
  { name: 'Eilat', lat: 29.5581, lng: 34.9482, timezone: 'Asia/Jerusalem' },
  { name: 'Tiberias', lat: 32.7940, lng: 35.5308, timezone: 'Asia/Jerusalem' },
  { name: 'Nazareth', lat: 32.7028, lng: 35.2973, timezone: 'Asia/Jerusalem' },
  { name: 'Acre', lat: 32.9253, lng: 35.0818, timezone: 'Asia/Jerusalem' },
  { name: 'Safed', lat: 32.9650, lng: 35.4951, timezone: 'Asia/Jerusalem' },
  // International Cities
  { name: 'New York', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'London', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' }
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
      // Extract just the hours and minutes from UTC time to show correct local times
      const hours = String(time.getUTCHours()).padStart(2, '0');
      const minutes = String(time.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
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

        {shabbatTimes && shabbatTimes.shabbats && shabbatTimes.shabbats.length > 0 ? (
          <>
            {/* Display both Shabbats */}
            <div className="space-y-4 mb-4">
              {shabbatTimes.shabbats.map((shabbat, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="text-center mb-3">
                    <p className="text-sm font-medium text-primary">
                      {shabbat.hebrewDate}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-primary/10 rounded-lg border">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium text-primary mb-1">כניסת שבת</p>
                      <p className="text-lg font-bold">
                        {shabbat.entryTime || formatTime(shabbat.shabbatEntry)}
                      </p>
                    </div>
                    
                    <div className="text-center p-3 bg-primary/10 rounded-lg border">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium text-primary mb-1">יציאת שבת</p>
                      <p className="text-lg font-bold">
                        {shabbat.exitTime || formatTime(shabbat.shabbatExit)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Countdown to first Shabbat */}
            <div className="text-center p-3 bg-primary/5 rounded-lg border">
              <p className="text-base font-medium text-primary">
                {formatCountdown()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                * הסתרת תוכן 30 דקות לפני כניסת שבת
              </p>
            </div>
          </>
        ) : shabbatTimes ? (
          // Fallback for single Shabbat display
          <>
            <div className="text-center mb-4">
              {shabbatTimes.hebrewDate && (
                <p className="text-sm font-medium text-primary">
                  {shabbatTimes.hebrewDate}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg border">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium text-primary mb-1">כניסת שבת</p>
                <p className="text-lg font-bold">{formatTime(shabbatTimes.shabbatEntry)}</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg border">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs font-medium text-primary mb-1">יציאת שבת</p>
                <p className="text-lg font-bold">{formatTime(shabbatTimes.shabbatExit)}</p>
              </div>
            </div>

            <div className="text-center p-3 bg-primary/5 rounded-lg border">
              <p className="text-base font-medium text-primary">
                {formatCountdown()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                * הסתרת תוכן 30 דקות לפני כניסת שבת
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}