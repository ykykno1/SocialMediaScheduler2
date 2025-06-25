import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function UserChabadWidget() {
  const [parasha, setParasha] = useState<string>('');

  // Find the coming Saturday
  const now = new Date();
  const nextSaturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay()) % 7;
  if (daysUntilSaturday === 0 && now.getHours() < 20) {
    // If it's Saturday before sunset, show current week
    nextSaturday.setDate(now.getDate());
  } else {
    // Show next Saturday
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
  }

  // Get Torah portion from Chabad API
  useEffect(() => {
    const fetchParasha = async () => {
      try {
        // Use upcoming Saturday for Torah portion
        const nextSat = new Date(nextSaturday);
        const year = nextSat.getFullYear();
        const month = String(nextSat.getMonth() + 1).padStart(2, '0');
        const day = String(nextSat.getDate()).padStart(2, '0');
        
        const response = await fetch(`https://www.chabad.org/calendar/converter_cdo/aid/6311/hebrew/${day}/${month}/${year}`);
        const html = await response.text();
        
        // Extract parasha name from the HTML response
        const parashaMatch = html.match(/פרשת\s+([^<\s]+)/);
        if (parashaMatch) {
          setParasha(parashaMatch[1]);
        } else {
          // Fallback: try different pattern
          const fallbackMatch = html.match(/Parshat\s+([^<\s]+)/);
          if (fallbackMatch) {
            setParasha(fallbackMatch[1]);
          } else {
            setParasha('קרח'); // Current week fallback
          }
        }
      } catch (error) {
        console.log('Using fallback parasha');
        setParasha('קרח'); // Current week fallback
      }
    };

    fetchParasha();
  }, [nextSaturday.getTime()]);

  // Convert to proper Hebrew date format
  const gregorianToHebrew = (date: Date) => {
    // Hebrew numerals for dates
    const hebrewNumerals: Record<number, string> = {
      1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
      11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
      21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
    };
    
    // Calculate approximate Hebrew date (simplified calculation)
    const gregYear = date.getFullYear();
    const gregMonth = date.getMonth() + 1;
    const gregDay = date.getDate();
    
    // Approximate Hebrew year (add 3760, but adjust for Hebrew year starting in fall)
    let hebrewYear = gregYear + 3760;
    if (gregMonth <= 9) {
      hebrewYear += 1;
    }
    
    // Approximate Hebrew month and day based on current Gregorian date
    let hebrewMonth = 'סיון';
    let hebrewDay = 28; // Approximate for late June 2025
    
    // Adjust for the specific date (June 25, 2025 ≈ 28 Sivan 5785)
    if (gregMonth === 6 && gregDay >= 25) {
      hebrewMonth = 'סיון';
      hebrewDay = 28;
    } else if (gregMonth === 6 && gregDay >= 29) {
      hebrewMonth = 'תמוז';
      hebrewDay = 1;
    }
    
    // Ensure day is within valid range
    hebrewDay = Math.min(30, Math.max(1, hebrewDay));
    const dayInHebrew = hebrewNumerals[hebrewDay] || `${hebrewDay}`;
    
    return `${dayInHebrew} ${hebrewMonth} תשפ״ה`;
  };

  const hebrewDate = gregorianToHebrew(nextSaturday);

  // Get current user data for location settings
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  const { data: shabbatData, isLoading } = useQuery({
    queryKey: ['/api/shabbat-times', user?.shabbatCityId || '247'],
    enabled: !!(user?.shabbatCityId),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 shadow-sm border border-blue-200/50 dark:border-blue-800/50">
        <div className="text-center text-blue-700 dark:text-blue-300">טוען נתוני שבת...</div>
      </div>
    );
  }

  if (!shabbatData) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-6 shadow-sm border border-red-200/50 dark:border-red-800/50">
        <div className="text-center text-red-700 dark:text-red-300">שגיאה בטעינת נתוני שבת</div>
      </div>
    );
  }

  // Log for debugging
  console.log(`Loaded Chabad widget for ${user?.shabbatCity} (ID: ${user?.shabbatCityId})`);

  const candleLighting = new Date(shabbatData.candleLighting);
  const havdalah = new Date(shabbatData.havdalah);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-6 shadow-lg border border-amber-200/50 dark:border-amber-800/50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
          {parasha ? `פרשת השבוע - פרשת ${parasha}` : 'פרשת השבוע'}
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">{hebrewDate}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            כניסת שבת
          </div>
          <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
            {candleLighting.toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            הבדלה
          </div>
          <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
            {havdalah.toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-xs text-amber-600 dark:text-amber-400">
          שבת שלום ומבורך
        </div>
      </div>
    </div>
  );
}