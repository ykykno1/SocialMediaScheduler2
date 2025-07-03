
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock as ClockIcon } from 'lucide-react';
import { DateTimeUtils } from '@/utils/dateTimeUtils';

interface ClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  compact?: boolean;
}

export const Clock: React.FC<ClockProps> = ({ 
  showDate = true, 
  showSeconds = true, 
  compact = false 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    if (showSeconds) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date): string => {
    return DateTimeUtils.formatDate(date, false);
  };

  const getHebrewDayName = (date: Date): string => {
    return DateTimeUtils.getHebrewDayName(date);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <ClockIcon className="h-4 w-4" />
        <span className="font-mono">{formatTime(currentTime)}</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <ClockIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            שעון מקומי
          </span>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-mono font-bold mb-1">
            {formatTime(currentTime)}
          </div>
          
          {showDate && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{getHebrewDayName(currentTime)}</div>
              <div>{formatDate(currentTime)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Clock;
