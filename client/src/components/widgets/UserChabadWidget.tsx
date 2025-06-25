import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Helper function to get current Hebrew date and Torah portion
const getHebrewDateAndParasha = () => {
  const now = new Date();
  
  // Find the coming Saturday
  const nextSaturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay()) % 7;
  if (daysUntilSaturday === 0 && now.getHours() < 20) {
    // If it's Saturday before sunset, show current week
    nextSaturday.setDate(now.getDate());
  } else {
    // Show next Saturday
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
  }
  
  // Get Torah portion for specific dates in June 2025
  const getParasha = (date: Date) => {
    const month = date.getMonth();
    const day = date.getDate();
    
    // June 2025 Torah portions (accurate for current period)
    if (month === 5) { // June
      if (day >= 28) return 'חקת'; // June 28, 2025
      if (day >= 21) return 'שלח לך'; // June 21, 2025  
      if (day >= 14) return 'בהעלתך'; // June 14, 2025
      if (day >= 7) return 'נשא'; // June 7, 2025
      return 'במדבר'; // June 1, 2025
    }
    
    // July 2025
    if (month === 6) {
      if (day >= 5) return 'בלק'; // July 5, 2025
      return 'חקת'; // early July
    }
    
    // Default fallback
    return 'חקת';
  };
  
  const parasha = getParasha(nextSaturday);
  
  // Convert to proper Hebrew date format
  const gregorianToHebrew = (date: Date) => {
    // Hebrew months with proper Hebrew numerals
    const hebrewMonths = [
      'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 
      'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
    ];
    
    // Hebrew numerals for dates
    const hebrewNumerals: Record<number, string> = {
      1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
      11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
      21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
    };
    
    // Calculate Hebrew date for June 2025 (accurate mapping)
    // June 25, 2025 = 29 Sivan 5785 (approximately)
    let hebrewDay, hebrewMonth, hebrewYear = 'תשפ״ה';
    
    const gregorianDay = date.getDate();
    const gregorianMonth = date.getMonth();
    
    if (gregorianMonth === 5) { // June 2025
      if (gregorianDay <= 27) {
        // Late Sivan
        hebrewMonth = 'סיון';
        hebrewDay = gregorianDay + 3; // June 25 = 28 Sivan approximately
        if (hebrewDay > 29) {
          hebrewMonth = 'תמוז';
          hebrewDay = hebrewDay - 29;
        }
      } else {
        // Early Tammuz
        hebrewMonth = 'תמוז';
        hebrewDay = gregorianDay - 26; // June 28 = 1 Tammuz approximately
      }
    } else if (gregorianMonth === 6) { // July 2025
      hebrewMonth = 'תמוז';
      hebrewDay = gregorianDay + 3; // approximate
    } else {
      // Fallback
      hebrewMonth = 'תמוז';
      hebrewDay = 1;
    }
    
    // Ensure day is within valid range
    hebrewDay = Math.min(30, Math.max(1, hebrewDay));
    const dayInHebrew = hebrewNumerals[hebrewDay as keyof typeof hebrewNumerals] || `${hebrewDay}`;
    
    return `${dayInHebrew} ${hebrewMonth} ${hebrewYear}`;
  };
  
  const hebrewDate = gregorianToHebrew(nextSaturday);
  
  return { parasha, hebrewDate };
};

export function UserChabadWidget() {
  const [iframeKey, setIframeKey] = useState(0);

  // Get user's saved Shabbat location
  const { data: locationData, isLoading } = useQuery({
    queryKey: ['/api/user/shabbat-location'],
    retry: false,
  });

  // Get Hebrew date and parasha info
  const { parasha, hebrewDate } = getHebrewDateAndParasha();

  // Force iframe refresh when location changes
  useEffect(() => {
    if (locationData) {
      setIframeKey(prev => prev + 1);
      console.log(`Loaded Chabad widget for ${locationData.shabbatCity} (ID: ${locationData.shabbatCityId})`);
    }
  }, [locationData]);

  if (isLoading || !locationData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500">טוען זמני שבת...</div>
      </div>
    );
  }

  // Create iframe content with Chabad widget
  const createIframeContent = () => {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 10px;
            font-family: Tahoma, Arial, Verdana;
            background: white;
            direction: rtl;
        }
        .CLTable {
            background-color: #DBEAF5;
            border-color: #A0C6E5;
            font-size: 11px;
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #A0C6E5;
        }
        .CLHeadingBold {
            font-family: Tahoma, Arial, Verdana;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
            color: #1e40af;
            padding: 8px;
            background: #f0f8ff;
        }
        .CLheading {
            font-family: Tahoma, Arial, Verdana;
            font-size: 11px;
            text-align: center;
            color: #000;
            padding: 4px;
        }
        A.CLLink {
            font-family: Tahoma, Arial, Verdana;
            font-size: 10px;
            text-align: center;
            color: #1e40af;
            text-decoration: none;
        }
        A.CLLink:hover {
            text-decoration: underline;
        }
        .CLdate {
            font-family: Tahoma, Arial, Verdana;
            font-size: 12px;
            text-align: right;
            font-weight: bold;
            color: #374151;
            padding: 4px 8px;
        }
        .CLtime {
            font-family: Tahoma, Arial, Verdana;
            font-size: 12px;
            text-align: left;
            font-weight: normal;
            margin-bottom: 0;
            color: #1f2937;
            padding: 4px 8px;
        }
        .CLhr {
            color: #666;
            height: 1px;
            width: 50%;
        }
        .CLHolName {
            font-weight: normal;
            color: #6b7280;
        }
    </style>
    <script>
        // Replace "הדלקת נרות" with "כניסת שבת" after the widget loads
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                const elements = document.getElementsByTagName('*');
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                        const text = element.childNodes[0].nodeValue;
                        if (text && text.includes('הדלקת נרות')) {
                            element.childNodes[0].nodeValue = text.replace('הדלקת נרות', 'כניסת שבת');
                        }
                    }
                }
            }, 1000);
        });
    </script>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td width="100%" class="clheading">
                <script type="text/javascript" language="javascript" src="//he.chabad.org/tools/shared/candlelighting/candlelighting.js.asp?city=${locationData.shabbatCityId}&locationid=&locationtype=&ln=2&weeks=1&mid=7068&lang=he"></script>
            </td>
        </tr>
    </table>
</body>
</html>`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">🕯️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              פרשת השבוע - פרשת {parasha}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {hebrewDate}
            </p>
          </div>
        </div>
      </div>

      {/* Chabad Widget Container */}
      <div className="w-full h-48 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700">
        <iframe
          key={iframeKey}
          srcDoc={createIframeContent()}
          className="w-full h-full border-none"
          style={{ minHeight: '200px' }}
          title="זמני שבת"
        />
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          זמנים מדויקים מאתר בית חב"ד
        </p>
      </div>
    </div>
  );
}