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
    
    // Parse Shabbat times
    const [candleHour, candleMinute] = shabbatTimes.candleLighting.split(':').map(Number);
    const [havdalahHour, havdalahMinute] = shabbatTimes.havdalah.split(':').map(Number);

    // Calculate hide time based on preference
    const getHideOffset = (preference: string): number => {
      switch (preference) {
        case '15min': return 15;
        case '30min': return 30;
        case '1hour': return 60;
        default: return 15;
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

    // Find next Friday (day 5 = Friday)
    const nextFriday = new Date(now);
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    let daysUntilFriday;
    if (currentDay < 5) {
      // Before Friday this week
      daysUntilFriday = 5 - currentDay;
    } else if (currentDay === 5) {
      // It's Friday - check if before hide time
      const todayHideTime = new Date(now);
      todayHideTime.setHours(candleHour, candleMinute, 0, 0);
      const todayActualHideTime = new Date(todayHideTime.getTime() - hideOffset * 60 * 1000);
      
      if (now < todayActualHideTime) {
        daysUntilFriday = 0; // Use today
      } else {
        daysUntilFriday = 7; // Next Friday
      }
    } else {
      // Saturday or Sunday
      daysUntilFriday = 7 - currentDay + 5;
    }
    
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(candleHour, candleMinute, 0, 0);
    
    // Find corresponding Saturday (day after Friday)
    const correspondingSaturday = new Date(nextFriday);
    correspondingSaturday.setDate(nextFriday.getDate() + 1);
    correspondingSaturday.setHours(havdalahHour, havdalahMinute, 0, 0);
    
    // Calculate actual operation times
    const nextHideTime = new Date(nextFriday.getTime() - hideOffset * 60 * 1000);
    const nextRestoreTime = new Date(correspondingSaturday.getTime() + restoreOffset * 60 * 1000);

    // Determine next action
    let targetTime: Date;
    let action: 'hide' | 'restore';

    if (now < nextHideTime) {
      // Before next hide time
      targetTime = nextHideTime;
      action = 'hide';
    } else if (now < nextRestoreTime) {
      // Between hide and restore time
      targetTime = nextRestoreTime;
      action = 'restore';
    } else {
      // After restore time - calculate next Friday
      const nextNextFriday = new Date(nextFriday);
      nextNextFriday.setDate(nextFriday.getDate() + 7);
      targetTime = new Date(nextNextFriday.getTime() - hideOffset * 60 * 1000);
      action = 'hide';
    }

    const diffMs = targetTime.getTime() - now.getTime();
    
    // Debug log
    console.log('=== TIMER DEBUG ===');
    console.log('Now:', now.toLocaleString('he-IL'));
    console.log('Target time:', targetTime.toLocaleString('he-IL'));
    console.log('Next action:', action);
    console.log('Days until Friday:', daysUntilFriday);
    console.log('Next hide time:', nextHideTime.toLocaleString('he-IL'));
    console.log('Next restore time:', nextRestoreTime.toLocaleString('he-IL'));
    console.log('Diff MS:', diffMs);
    console.log('===================');
    
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