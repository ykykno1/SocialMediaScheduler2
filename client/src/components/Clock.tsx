import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

interface ClockProps {
  className?: string;
  showDate?: boolean;
  showTimezone?: boolean;
}

export default function Clock({ className = "", showDate = true, showTimezone = true }: ClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    // זיהוי אזור הזמן של המשתמש
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);

    // עדכון השעה כל שנייה
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimezoneDisplay = (timezone: string) => {
    // המרת שמות אזורי זמן נפוצים לעברית
    const timezoneNames: { [key: string]: string } = {
      'Asia/Jerusalem': 'ירושלים',
      'Europe/London': 'לונדון',
      'America/New_York': 'ניו יורק',
      'Europe/Paris': 'פריז',
      'Asia/Tokyo': 'טוקיו',
      'America/Los_Angeles': 'לוס אנג\'לס',
      'Australia/Sydney': 'סידני'
    };

    return timezoneNames[timezone] || timezone.split('/').pop() || 'לא ידוע';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ClockIcon className="h-4 w-4 text-blue-600" />
      <div className="text-right">
        <div className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatTime(currentTime)}
        </div>
        {showDate && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatDate(currentTime)}
          </div>
        )}
        {showTimezone && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {getTimezoneDisplay(timezone)}
          </div>
        )}
      </div>
    </div>
  );
}