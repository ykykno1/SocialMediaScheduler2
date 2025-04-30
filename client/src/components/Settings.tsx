import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SocialPlatformIcon from './SocialPlatformIcon';
import useSettings from '../hooks/useSettings';
import useAuth from '../hooks/useAuth';

interface SettingsProps {
  onBackToDashboard: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBackToDashboard }) => {
  const { settings, saveSettings, updateSetting, loading } = useSettings();
  const { isAuthenticated, connectPlatform, disconnectPlatform, authenticating } = useAuth();
  const [formErrors, setFormErrors] = useState<Record<string, any>>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveSettings(settings);
    if (result === null) {
      // Success, go back to dashboard
      onBackToDashboard();
    } else {
      // Error, show validation errors
      setFormErrors(result);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSetting(name, value);
  };
  
  const handleToggleChange = (name: string, checked: boolean) => {
    updateSetting(name, checked);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    updateSetting(name, value);
  };
  
  return (
    <Card className="mb-6">
      <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-[#3466ad]">הגדרות</h2>
        <Button 
          variant="ghost" 
          className="text-[#3466ad] hover:text-[#3466ad]/80 p-0 h-auto"
          onClick={onBackToDashboard}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          {/* General Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">הגדרות כלליות</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">תזמון אוטומטי</span>
                <Switch
                  checked={settings.autoSchedule}
                  onCheckedChange={(checked) => handleToggleChange('autoSchedule', checked)}
                  id="toggle-auto-schedule"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hide-time">שעת הסתרת תוכן</Label>
                  <Input
                    type="time"
                    id="hide-time"
                    name="hideTime"
                    value={settings.hideTime}
                    onChange={handleInputChange}
                    className={formErrors.hideTime ? 'border-red-500' : ''}
                  />
                  {formErrors.hideTime && (
                    <p className="text-red-500 text-xs">{formErrors.hideTime}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restore-time">שעת שחזור תוכן</Label>
                  <Input
                    type="time"
                    id="restore-time"
                    name="restoreTime"
                    value={settings.restoreTime}
                    onChange={handleInputChange}
                    className={formErrors.restoreTime ? 'border-red-500' : ''}
                  />
                  {formErrors.restoreTime && (
                    <p className="text-red-500 text-xs">{formErrors.restoreTime}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">אזור זמן</Label>
                <Select 
                  value={settings.timeZone}
                  onValueChange={(value) => handleSelectChange('timeZone', value)}
                >
                  <SelectTrigger className={formErrors.timeZone ? 'border-red-500' : ''}>
                    <SelectValue placeholder="בחר אזור זמן" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Jerusalem">ישראל (Asia/Jerusalem)</SelectItem>
                    <SelectItem value="Europe/London">לונדון (Europe/London)</SelectItem>
                    <SelectItem value="America/New_York">ניו יורק (America/New_York)</SelectItem>
                    <SelectItem value="Europe/Paris">פריז (Europe/Paris)</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.timeZone && (
                  <p className="text-red-500 text-xs">{formErrors.timeZone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Platforms Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">הגדרות פלטפורמות</h3>
            
            <div className="space-y-5">
              {/* Facebook Settings */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <SocialPlatformIcon platform="facebook" size={20} className="w-8 h-8" />
                    <span className="mr-3 font-medium">פייסבוק</span>
                  </div>
                  <Switch
                    checked={settings.platforms.facebook.enabled}
                    onCheckedChange={(checked) => handleToggleChange('platforms.facebook.enabled', checked)}
                    id="toggle-facebook"
                  />
                </div>

                <div className="space-y-3">
                  <div className="mb-2 p-2 bg-blue-50 rounded-md text-sm text-blue-800">
                    יש להזין את פרטי האפליקציה שלך מפייסבוק. לאחר מכן, לחץ על "התחברות" כדי להתחבר לחשבון הפייסבוק שלך.
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook-api-key">מפתח API (App ID)</Label>
                    <Input
                      type="text"
                      id="facebook-api-key"
                      name="platforms.facebook.apiKey"
                      value={settings.platforms.facebook.apiKey}
                      onChange={handleInputChange}
                      placeholder="1696013260998525"
                      className={formErrors.platforms?.facebook?.apiKey ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.facebook?.apiKey && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.facebook.apiKey}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook-api-secret">סיסמת API (App Secret)</Label>
                    <Input
                      type="password"
                      id="facebook-api-secret"
                      name="platforms.facebook.apiSecret"
                      value={settings.platforms.facebook.apiSecret}
                      onChange={handleInputChange}
                      placeholder="69b9d2e78c46433758f991a8c32d926b"
                      className={formErrors.platforms?.facebook?.apiSecret ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.facebook?.apiSecret && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.facebook.apiSecret}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isAuthenticated('facebook') ? (
                      <>
                        <span className="text-green-600 text-sm font-medium px-2 py-1 bg-green-600/10 rounded-full">מחובר לחשבון פייסבוק</span>
                        <Button 
                          variant="link" 
                          className="text-sm text-red-600 p-0 h-auto"
                          onClick={() => disconnectPlatform('facebook')}
                        >
                          ניתוק
                        </Button>
                      </>
                    ) : (
                      <div className="flex justify-end w-full">
                        <Button 
                          onClick={() => connectPlatform('facebook')}
                          disabled={authenticating['facebook']}
                          className="text-sm"
                        >
                          התחברות לחשבון פייסבוק
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instagram Settings */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <SocialPlatformIcon platform="instagram" size={20} className="w-8 h-8" />
                    <span className="mr-3 font-medium">אינסטגרם</span>
                  </div>
                  <Switch
                    checked={settings.platforms.instagram.enabled}
                    onCheckedChange={(checked) => handleToggleChange('platforms.instagram.enabled', checked)}
                    id="toggle-instagram"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="instagram-api-key">מפתח API (Client ID)</Label>
                    <Input
                      type="text"
                      id="instagram-api-key"
                      name="platforms.instagram.apiKey"
                      value={settings.platforms.instagram.apiKey}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.instagram?.apiKey ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.instagram?.apiKey && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.instagram.apiKey}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram-api-secret">סיסמת API (Client Secret)</Label>
                    <Input
                      type="password"
                      id="instagram-api-secret"
                      name="platforms.instagram.apiSecret"
                      value={settings.platforms.instagram.apiSecret}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.instagram?.apiSecret ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.instagram?.apiSecret && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.instagram.apiSecret}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isAuthenticated('instagram') ? (
                      <>
                        <span className="text-green-600 text-sm font-medium px-2 py-1 bg-green-600/10 rounded-full">מחובר</span>
                        <Button 
                          variant="link" 
                          className="text-sm text-red-600 p-0 h-auto"
                          onClick={() => disconnectPlatform('instagram')}
                        >
                          ניתוק
                        </Button>
                      </>
                    ) : (
                      <div className="flex justify-end w-full">
                        <Button 
                          onClick={() => connectPlatform('instagram')}
                          disabled={authenticating['instagram']}
                          className="text-sm"
                        >
                          התחברות
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* YouTube Settings */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <SocialPlatformIcon platform="youtube" size={20} className="w-8 h-8" />
                    <span className="mr-3 font-medium">יוטיוב</span>
                  </div>
                  <Switch
                    checked={settings.platforms.youtube.enabled}
                    onCheckedChange={(checked) => handleToggleChange('platforms.youtube.enabled', checked)}
                    id="toggle-youtube"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-api-key">מפתח API</Label>
                    <Input
                      type="text"
                      id="youtube-api-key"
                      name="platforms.youtube.apiKey"
                      value={settings.platforms.youtube.apiKey}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.youtube?.apiKey ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.youtube?.apiKey && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.youtube.apiKey}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube-api-secret">סיסמת API</Label>
                    <Input
                      type="password"
                      id="youtube-api-secret"
                      name="platforms.youtube.apiSecret"
                      value={settings.platforms.youtube.apiSecret}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.youtube?.apiSecret ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.youtube?.apiSecret && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.youtube.apiSecret}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isAuthenticated('youtube') ? (
                      <>
                        <span className="text-green-600 text-sm font-medium px-2 py-1 bg-green-600/10 rounded-full">מחובר</span>
                        <Button 
                          variant="link" 
                          className="text-sm text-red-600 p-0 h-auto"
                          onClick={() => disconnectPlatform('youtube')}
                        >
                          ניתוק
                        </Button>
                      </>
                    ) : (
                      <div className="flex justify-end w-full">
                        <Button 
                          onClick={() => connectPlatform('youtube')}
                          disabled={authenticating['youtube']}
                          className="text-sm"
                        >
                          התחברות
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TikTok Settings */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <SocialPlatformIcon platform="tiktok" size={20} className="w-8 h-8" />
                    <span className="mr-3 font-medium">טיקטוק</span>
                  </div>
                  <Switch
                    checked={settings.platforms.tiktok.enabled}
                    onCheckedChange={(checked) => handleToggleChange('platforms.tiktok.enabled', checked)}
                    id="toggle-tiktok"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="tiktok-api-key">מפתח API (Client Key)</Label>
                    <Input
                      type="text"
                      id="tiktok-api-key"
                      name="platforms.tiktok.apiKey"
                      value={settings.platforms.tiktok.apiKey}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.tiktok?.apiKey ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.tiktok?.apiKey && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.tiktok.apiKey}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok-api-secret">סיסמת API (Client Secret)</Label>
                    <Input
                      type="password"
                      id="tiktok-api-secret"
                      name="platforms.tiktok.apiSecret"
                      value={settings.platforms.tiktok.apiSecret}
                      onChange={handleInputChange}
                      className={formErrors.platforms?.tiktok?.apiSecret ? 'border-red-500' : ''}
                    />
                    {formErrors.platforms?.tiktok?.apiSecret && (
                      <p className="text-red-500 text-xs">{formErrors.platforms.tiktok.apiSecret}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isAuthenticated('tiktok') ? (
                      <>
                        <span className="text-green-600 text-sm font-medium px-2 py-1 bg-green-600/10 rounded-full">מחובר</span>
                        <Button 
                          variant="link" 
                          className="text-sm text-red-600 p-0 h-auto"
                          onClick={() => disconnectPlatform('tiktok')}
                        >
                          ניתוק
                        </Button>
                      </>
                    ) : (
                      <div className="flex justify-end w-full">
                        <Button 
                          onClick={() => connectPlatform('tiktok')}
                          disabled={authenticating['tiktok']}
                          className="text-sm"
                        >
                          התחברות
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3 space-x-reverse">
            <Button 
              type="submit"
              className="bg-[#3466ad] hover:bg-[#3466ad]/90"
              disabled={loading}
            >
              שמירת הגדרות
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={onBackToDashboard}
            >
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Settings;
