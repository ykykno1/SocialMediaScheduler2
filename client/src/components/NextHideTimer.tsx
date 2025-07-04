import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NextHideTimerProps {
  shabbatTimes?: {
    candleLighting: string; // "19:29"
    havdalah: string; // "20:33"
  };
  hideTimingPreference?: string; // "15min", "30min", "1hour"
  restoreTimingPreference?: string; // "immediate", "30min", "1hour"
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function NextHideTimer({ shabbatTimes, hideTimingPreference, restoreTimingPreference }: NextHideTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [nextAction, setNextAction] = useState<'hide' | 'restore' | null>(null);

  const calculateTimeRemaining = (): { remaining: TimeRemaining | null; action: 'hide' | 'restore' | null } => {
    if (!shabbatTimes || !hideTimingPreference) {
      return { remaining: null, action: null };
    }

    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parse Shabbat times for today
    const [candleHour, candleMinute] = shabbatTimes.candleLighting.split(':').map(Number);
    const [havdalahHour, havdalahMinute] = shabbatTimes.havdalah.split(':').map(Number);

    // Calculate hide time based on preference
    const getHideOffset = (preference: string): number => {
      switch (preference) {
        case '15min': return 15;
        case '30min': return 30;
        case '1hour': return 60;
        default: return 30;
      }
    };

    const getRestoreOffset = (preference: string): number => {
      switch (preference) {
        case 'immediate': return 0;
        case '30min': return 30;
        case '1hour': return 60;
        default: return 0;
      }
    };

    const hideOffset = getHideOffset(hideTimingPreference);
    const restoreOffset = getRestoreOffset(restoreTimingPreference || 'immediate');

    // Create today's times
    const todayCandleLighting = new Date(today);
    todayCandleLighting.setHours(candleHour, candleMinute, 0, 0);
    
    const todayHavdalah = new Date(today);
    todayHavdalah.setHours(havdalahHour, havdalahMinute, 0, 0);
    
    const todayHideTime = new Date(todayCandleLighting.getTime() - hideOffset * 60 * 1000);
    const todayRestoreTime = new Date(todayHavdalah.getTime() + restoreOffset * 60 * 1000);

    // Create tomorrow's times (for next week)
    const tomorrowCandleLighting = new Date(tomorrow);
    tomorrowCandleLighting.setHours(candleHour, candleMinute, 0, 0);
    tomorrowCandleLighting.setDate(tomorrowCandleLighting.getDate() + 6); // Next Friday
    
    const nextWeekHideTime = new Date(tomorrowCandleLighting.getTime() - hideOffset * 60 * 1000);

    // Determine next action
    let targetTime: Date;
    let action: 'hide' | 'restore';

    if (now < todayHideTime) {
      // Before today's hide time
      targetTime = todayHideTime;
      action = 'hide';
    } else if (now < todayRestoreTime) {
      // Between hide and restore time
      targetTime = todayRestoreTime;
      action = 'restore';
    } else {
      // After today's restore time - next hide is next week
      targetTime = nextWeekHideTime;
      action = 'hide';
    }

    const diffMs = targetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { remaining: null, action: null };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return {
      remaining: { days, hours, minutes, seconds, totalSeconds },
      action
    };
  };

  useEffect(() => {
    const updateTimer = () => {
      const { remaining, action } = calculateTimeRemaining();
      setTimeRemaining(remaining);
      setNextAction(action);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [shabbatTimes, hideTimingPreference, restoreTimingPreference]);

  if (!timeRemaining || !nextAction) {
    return null;
  }

  const formatTime = (time: TimeRemaining): string => {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`;
    } else if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
    } else {
      return `${time.minutes}m ${time.seconds}s`;
    }
  };

  const getActionText = (action: 'hide' | 'restore'): string => {
    return action === 'hide' ? 'הסתרת תוכן' : 'שחזור תוכן';
  };

  const getActionIcon = (action: 'hide' | 'restore'): string => {
    return action === 'hide' ? '🔒' : '🔓';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">
              {getActionIcon(nextAction)} {getActionText(nextAction)} בעוד:
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-blue-800 bg-white px-3 py-1 rounded-md border">
            {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="mt-2 text-sm text-blue-600">
          {nextAction === 'hide' && `הסתרה ${hideTimingPreference === '15min' ? '15 דקות' : hideTimingPreference === '30min' ? '30 דקות' : 'שעה'} לפני כניסת שבת`}
          {nextAction === 'restore' && `שחזור ${restoreTimingPreference === 'immediate' ? 'מיד' : restoreTimingPreference === '30min' ? '30 דקות' : 'שעה'} אחרי יציאת שבת`}
        </div>
      </CardContent>
    </Card>
  );
}