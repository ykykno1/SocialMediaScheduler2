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
  // Israeli Cities (with Chabad IDs)
  { name: 'Jerusalem', chabadId: '531' },
  { name: 'Tel Aviv', chabadId: '569' },
  { name: 'Haifa', chabadId: '541' },
  { name: 'Beer Sheva', chabadId: '516' },
  { name: 'Netanya', chabadId: '556' },
  { name: 'Ashdod', chabadId: '513' },
  { name: 'Petah Tikva', chabadId: '560' },
  { name: 'Rishon LeZion', chabadId: '563' },
  { name: 'Ashkelon', chabadId: '514' },
  { name: 'Rehovot', chabadId: '562' },
  { name: 'Bat Yam', chabadId: '515' },
  { name: 'Herzliya', chabadId: '542' },
  { name: 'Kfar Saba', chabadId: '545' },
  { name: 'Ra\'anana', chabadId: '561' },
  { name: 'Modi\'in', chabadId: '554' },
  { name: 'Eilat', chabadId: '532' },
  { name: 'Tiberias', chabadId: '568' },
  { name: 'Nazareth', chabadId: '557' },
  { name: 'Acre', chabadId: '512' },
  { name: 'Safed', chabadId: '564' },
  // International Cities
  { name: 'New York', chabadId: '280' },
  { name: 'Los Angeles', chabadId: '197' },
  { name: 'London', chabadId: '2671' },
  { name: 'Paris', chabadId: '2401' }
];

export function SimpleChabadWidget() {
  const [currentCity, setCurrentCity] = useState<string>('Jerusalem');
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
  const chabadUrl = currentCityData 
    ? `//he.chabad.org/tools/shared/candlelighting/candlelighting.js.asp?city=${currentCityData.chabadId}&locationid=&locationtype=&ln=2&weeks=2&mid=7068&lang=he`
    : '';

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

      {/* Chabad CSS Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .CLTable {
            background-color: #DBEAF5 !important;
            border-color: #A0C6E5 !important;
            font-size: 11px !important;
            width: 100% !important;
            border-radius: 8px !important;
            overflow: hidden !important;
          }
          .CLHeadingBold {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 12px !important;
            text-align: center !important;
            font-weight: bold !important;
            color: #1e40af !important;
            padding: 8px !important;
          }
          .CLheading {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 11px !important;
            text-align: center !important;
            color: #000 !important;
            padding: 4px !important;
          }
          A.CLLink {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 10px !important;
            text-align: center !important;
            color: #1e40af !important;
            text-decoration: none !important;
          }
          A.CLLink:Hover {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 10px !important;
            text-align: center !important;
            color: #1e40af !important;
            text-decoration: underline !important;
          }
          .CLdate {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 12px !important;
            text-align: right !important;
            font-weight: bold !important;
            text-decoration: none !important;
            color: #374151 !important;
            padding: 4px 8px !important;
          }
          .CLtime {
            font-family: Tahoma, Arial, Verdana !important;
            font-size: 12px !important;
            text-align: left !important;
            font-weight: normal !important;
            margin-bottom: 0 !important;
            color: #1f2937 !important;
            padding: 4px 8px !important;
          }
          .CLhr {
            color: #666 !important;
            height: 1px !important;
            width: 50% !important;
          }
          .CLHolName {
            font-weight: normal !important;
            color: #6b7280 !important;
          }
        `
      }} />

      {/* Chabad Times Container */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <table width="190" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td width="100%" className="clheading">
                {chabadUrl && (
                  <script 
                    type="text/javascript" 
                    src={chabadUrl}
                    key={currentCityData?.chabadId}
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>
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