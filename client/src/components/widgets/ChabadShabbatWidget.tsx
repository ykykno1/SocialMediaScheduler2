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

export function ChabadShabbatWidget() {
  const [currentCity, setCurrentCity] = useState<string>('Jerusalem');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load saved city from localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem('shabbat_city');
    if (savedCity && MAJOR_CITIES.find(c => c.name === savedCity)) {
      setCurrentCity(savedCity);
    }
  }, []);

  // Load Chabad script when city changes
  useEffect(() => {
    const cityData = MAJOR_CITIES.find(c => c.name === currentCity);
    if (!cityData) return;

    // Clear existing content
    const container = document.getElementById('chabad-times-container');
    if (container) {
      container.innerHTML = '';
    }

    // Create the table structure first
    const tableHtml = `
      <table width="190" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="100%" class="clheading" id="chabad-script-target">
            Loading Shabbat times...
          </td>
        </tr>
      </table>
    `;

    if (container) {
      container.innerHTML = tableHtml;
    }

    // Create and load script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//he.chabad.org/tools/shared/candlelighting/candlelighting.js.asp?city=${cityData.chabadId}&locationid=&locationtype=&ln=2&weeks=2&mid=7068&lang=he`;
    
    script.onload = () => {
      setScriptLoaded(true);
      localStorage.setItem('shabbat_city', currentCity);
    };

    script.onerror = () => {
      console.error('Failed to load Chabad script');
      if (container) {
        container.innerHTML = '<div class="text-red-500 text-center p-4">Failed to load Shabbat times</div>';
      }
    };

    // Append script to head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [currentCity]);

  const handleCityChange = (city: string) => {
    setCurrentCity(city);
    setShowCitySelector(false);
    setScriptLoaded(false);
  };

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
            background-color: #DBEAF5;
            border-color: #A0C6E5;
            font-size: 11px;
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
          }
          .CLHeadingBold {
            font-family: Tahoma, Arial, Verdana;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
            color: #1e40af;
            padding: 8px;
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
          A.CLLink:Hover {
            font-family: Tahoma, Arial, Verdana;
            font-size: 10px;
            text-align: center;
            color: #1e40af;
            text-decoration: underline;
          }
          .CLdate {
            font-family: Tahoma, Arial, Verdana;
            font-size: 12px;
            text-align: right;
            font-weight: bold;
            text-decoration: none;
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
          #chabad-times-container table {
            width: 100% !important;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        `
      }} />

      {/* Chabad Times Container */}
      <div 
        id="chabad-times-container" 
        className="mt-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
      >
        {!scriptLoaded && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">טוען זמני שבת...</p>
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