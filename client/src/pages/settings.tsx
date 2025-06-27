import { useState, useEffect } from 'react';
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

interface City {
  name: string;
  chabadId: string;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Get current user location
  const { data: locationData, isLoading } = useQuery<{ shabbatCity: string; shabbatCityId: string }>({
    queryKey: ['/api/user/shabbat-location'],
    retry: false,
  });

  // Get available cities from database
  const { data: availableCities = [], isLoading: citiesLoading } = useQuery<any[]>({
    queryKey: ['/api/shabbat-locations'],
    retry: false,
  });

  const [selectedCity, setSelectedCity] = useState<string>('ירושלים');

  // Convert database cities to City format
  const cities: City[] = availableCities.map((city: any) => ({
    name: city.name_hebrew,
    chabadId: city.chabad_id
  }));

  // Update selected city when location data loads
  useEffect(() => {
    if (locationData?.shabbatCity) {
      setSelectedCity(locationData.shabbatCity);
    }
  }, [locationData]);

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
    const cityData = cities.find(c => c.name === selectedCity);
    if (cityData) {
      updateLocationMutation.mutate({
        cityName: cityData.name,
        cityId: cityData.chabadId
      });
    }
  };

  if (isLoading || citiesLoading) {
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
                  {cities.map((city) => (
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

            {selectedCity !== (locationData?.shabbatCity || 'ירושלים') && (
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