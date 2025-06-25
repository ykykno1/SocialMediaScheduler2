import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const MAJOR_CITIES = [
  // Israeli Cities - updated correct codes
  { name: 'ירושלים', chabadId: '247' },
  { name: 'תל אביב', chabadId: '531' },
  { name: 'חיפה', chabadId: '689' },
  { name: 'באר שבע', chabadId: '688' },
  { name: 'צפת', chabadId: '695' },
  { name: 'אילת', chabadId: '687' },
  { name: 'חולון', chabadId: '851' },
  { name: 'אשקלון', chabadId: '700' },
  { name: 'דימונה', chabadId: '843' },
  { name: 'חריש', chabadId: '1702' },
  { name: 'הרצליה', chabadId: '981' },
  { name: 'קריית שמונה', chabadId: '871' },
  { name: 'נס ציונה', chabadId: '1661' },
  { name: 'פרדס חנה כרכור', chabadId: '1663' },
  { name: 'רעננה', chabadId: '937' },
  { name: 'פתח תקווה', chabadId: '852' },
  { name: 'רחובות', chabadId: '703' },
  { name: 'ראש העין', chabadId: '1659' },
  { name: 'ראשון לציון', chabadId: '853' },
  { name: 'טבריה', chabadId: '697' },
  { name: 'נתניה', chabadId: '694' },
  { name: 'רמת גן', chabadId: '849' },
  { name: 'בת ים', chabadId: '850' },
  // International Cities - updated correct codes
  { name: 'ניו יורק', chabadId: '370' },
  { name: 'לוס אנג\'לס', chabadId: '1481' },
  { name: 'מיאמי', chabadId: '331' },
  { name: 'פריז', chabadId: '394' },
  { name: 'ברצלונה', chabadId: '44' },
  { name: 'ליסבון', chabadId: '297' },
  { name: 'רומא', chabadId: '449' },
  { name: 'מוסקבה', chabadId: '347' },
  { name: 'פראג', chabadId: '421' },
  { name: 'אומן', chabadId: '801' },
  { name: 'בנגקוק', chabadId: '42' }
];

export function DirectChabadWidget() {
  const [currentCity, setCurrentCity] = useState<string>('ירושלים');
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Load saved city from localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('shabbat_city');
    if (savedCity && MAJOR_CITIES.find(c => c.name === savedCity)) {
      setCurrentCity(savedCity);
    }
  }, []);

  // Save city to localStorage
  useEffect(() => {
    localStorage.setItem('shabbat_city', currentCity);
  }, [currentCity]);

  const handleCityChange = (city: string) => {
    setCurrentCity(city);
    setShowCitySelector(false);
  };

  const currentCityData = MAJOR_CITIES.find(c => c.name === currentCity);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <span className="text-white text-lg font-bold">🕯️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              זמני שבת
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              השבתות הקרובות
            </p>
          </div>
        </div>

        {/* City Selector */}
        <DropdownMenu open={showCitySelector} onOpenChange={setShowCitySelector}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <MapPin className="h-4 w-4" />
              {currentCity}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
            {MAJOR_CITIES.map((city) => (
              <DropdownMenuItem
                key={city.name}
                onClick={() => handleCityChange(city.name)}
                className={currentCity === city.name ? 'bg-blue-50 dark:bg-blue-900' : ''}
              >
                {city.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chabad CSS Styles - Exactly as provided by Chabad */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .CLTable{background-color:#DBEAF5;border-color:#A0C6E5;font-size:11px}
          .CLHeadingBold{font-family:Tahoma,Arial,Verdana;font-size:11px;text-align:center;font-weight:bold}
          .CLheading{font-family:Tahoma,Arial,Verdana;font-size:11px;text-align:center;color:#000}
          A.CLLink{font-family:Tahoma,Arial,Verdana;font-size:9px;text-align:center;color:#000;text-decoration:none}
          A.CLLink:Hover{font-family:Tahoma,Arial,Verdana;font-size:9px;text-align:center;color:#000;text-decoration:underline}
          .CLdate{font-family:Tahoma,Arial,Verdana;font-size:11px;text-align:right;font-weight:bold;text-decoration:none}
          .CLtime{font-family:Tahoma,Arial,Verdana;font-size:11px;text-align:left;font-weight:normal;margin-bottom:0}
          .CLhr{color:#666;height:1px;width:50%}
          .CLHolName{font-weight:normal}
        `
      }} />

      {/* Chabad Widget - Exact code as provided */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden p-2">
        {currentCityData && (
          <div>
            {/* אין לשנות את הקוד משורה זו ואילך */}
            {/* כל הזכויות שמורות לאתר בית חב"ד 1993-2025 */}
            <table width="190" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td width="100%" className="clheading">
                    <script 
                      key={`${currentCityData.chabadId}-${currentCity}`}
                      type="text/javascript" 
                      language="javascript" 
                      src={`//he.chabad.org/tools/shared/candlelighting/candlelighting.js.asp?city=${currentCityData.chabadId}&locationid=&locationtype=&ln=2&weeks=2&mid=7068&lang=he`}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
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