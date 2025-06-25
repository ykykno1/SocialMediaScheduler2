import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MapPin, ChevronDown, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Get current user location
  const { data: locationData, isLoading } = useQuery({
    queryKey: ['/api/user/shabbat-location'],
    retry: false,
  });

  const [selectedCity, setSelectedCity] = useState<string>(locationData?.shabbatCity || 'ירושלים');

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ cityName, cityId }: { cityName: string; cityId: string }) => {
      const response = await apiRequest('POST', '/api/user/shabbat-location', {
        cityName,
        cityId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו",
        description: "מיקום השבת עודכן בהצלחה",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/shabbat-location'] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את המיקום",
        variant: "destructive",
      });
    },
  });

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setShowCitySelector(false);
  };

  const handleSave = () => {
    const cityData = MAJOR_CITIES.find(c => c.name === selectedCity);
    if (cityData) {
      updateLocationMutation.mutate({
        cityName: cityData.name,
        cityId: cityData.chabadId
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">טוען הגדרות...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          הגדרות
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          נהל את ההגדרות האישיות שלך
        </p>
      </div>

      <div className="space-y-6">
        {/* Shabbat Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              מיקום זמני שבת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  עיר בחירה
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  בחר את העיר שלך להצגת זמני שבת מדויקים
                </p>
              </div>
              
              <DropdownMenu open={showCitySelector} onOpenChange={setShowCitySelector}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 min-w-[200px] justify-between"
                  >
                    <span>{selectedCity}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                  {MAJOR_CITIES.map((city) => (
                    <DropdownMenuItem
                      key={city.name}
                      onClick={() => handleCityChange(city.name)}
                      className={selectedCity === city.name ? 'bg-blue-50 dark:bg-blue-900' : ''}
                    >
                      {city.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {selectedCity !== locationData?.shabbatCity && (
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSave}
                  disabled={updateLocationMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateLocationMutation.isPending ? 'שומר...' : 'שמור שינויים'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
}