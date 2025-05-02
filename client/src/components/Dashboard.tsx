import React, { useEffect } from 'react';
import { Sun, RotateCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DateTimeUtils from '../utils/dateTimeUtils';
import SocialPlatformIcon from './SocialPlatformIcon';
import useScheduler from '../hooks/useScheduler';
import useAuth from '../hooks/useAuth';
import useSettings from '../hooks/useSettings';
import CONFIG from '../config';

interface DashboardProps {
  onShowSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onShowSettings }) => {
  const { settings, updateSetting, saveSettings } = useSettings();
  const { 
    isRunning,
    toggleScheduler,
    nextHideTime,
    nextRestoreTime,
    timeToHide,
    timeToRestore,
    manualHide,
    manualRestore,
    loading: schedulerLoading
  } = useScheduler();
  const { isAuthenticated } = useAuth();
  
  // Handle toggle change
  const handleToggleScheduler = async () => {
    const updatedSettings = { ...settings, autoSchedule: !settings.autoSchedule };
    updateSetting('autoSchedule', !settings.autoSchedule);
    await saveSettings(updatedSettings);
    toggleScheduler();
  };
  
  // Format next hide/restore times
  const formatNextHideTime = () => {
    if (!nextHideTime) return '';
    return `${DateTimeUtils.getHebrewDayName(nextHideTime)}, ${nextHideTime.getHours()}:${String(nextHideTime.getMinutes()).padStart(2, '0')}`;
  };
  
  const formatNextRestoreTime = () => {
    if (!nextRestoreTime) return '';
    return nextRestoreTime.getDay() === 6 ? `מוצ"ש, ${nextRestoreTime.getHours()}:${String(nextRestoreTime.getMinutes()).padStart(2, '0')}` : 
      `${DateTimeUtils.getHebrewDayName(nextRestoreTime)}, ${nextRestoreTime.getHours()}:${String(nextRestoreTime.getMinutes()).padStart(2, '0')}`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Development Mode Alert */}
      {CONFIG.DEV_MODE && (
        <div className="md:col-span-3">
          <Alert variant="destructive" className="bg-amber-50 border-amber-300 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="mr-2">
              <strong>מצב פיתוח פעיל:</strong> האפליקציה פועלת במצב דמו ללא חיבור אמיתי לפייסבוק. פעולות הסתרה ושחזור הן לצורכי הדגמה בלבד.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Status Card */}
      <Card className="md:col-span-2">
        <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3">
          <h2 className="font-bold text-[#3466ad]">סטטוס מערכת</h2>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-[#3466ad]/10 rounded-full flex items-center justify-center">
              <RotateCw className="h-6 w-6 text-[#3466ad]" />
            </div>
            <div className="mr-4 flex-grow">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-700">תזמון אוטומטי</h3>
                <Switch
                  id="toggle-scheduler"
                  checked={settings.autoSchedule}
                  onCheckedChange={handleToggleScheduler}
                />
              </div>
              <p className={`text-sm font-medium ${settings.autoSchedule ? 'text-green-600' : 'text-gray-500'}`}>
                {settings.autoSchedule 
                  ? 'המערכת פעילה ותסתיר תוכן באופן אוטומטי בכניסת השבת' 
                  : 'המערכת לא תבצע פעולות אוטומטיות'}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="mr-2 font-medium">הסתרת תוכן</span>
                </div>
                <span className="font-medium text-[#3466ad]">{formatNextHideTime()}</span>
              </div>
              <div className="mt-1 text-gray-500 text-sm">{timeToHide}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <RotateCw className="h-5 w-5 text-green-600" />
                  <span className="mr-2 font-medium">שחזור תוכן</span>
                </div>
                <span className="font-medium text-[#3466ad]">{formatNextRestoreTime()}</span>
              </div>
              <div className="mt-1 text-gray-500 text-sm">{timeToRestore}</div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3 space-x-reverse">
            <Button 
              className="flex-1 bg-[#3466ad] hover:bg-[#3466ad]/90"
              onClick={manualHide}
              disabled={schedulerLoading}
            >
              הסתרת תוכן
            </Button>
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={manualRestore}
              disabled={schedulerLoading}
            >
              שחזור תוכן
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Platforms Card */}
      <Card className="h-fit">
        <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3">
          <h2 className="font-bold text-[#3466ad]">פלטפורמות מחוברות</h2>
        </div>
        <CardContent className="p-4">
          <ul className="space-y-3">
            {/* Facebook */}
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <SocialPlatformIcon platform="facebook" size={20} className="w-8 h-8" />
                <span className="mr-3 font-medium">פייסבוק</span>
              </div>
              <span className={`text-sm font-medium px-2 py-1 ${
                isAuthenticated('facebook') ? 'bg-green-600/10 text-green-600' : 'bg-red-600/10 text-red-600'
              } rounded-full`}>
                {isAuthenticated('facebook') ? 'מחובר' : 'לא מחובר'}
              </span>
            </li>

            {/* Instagram */}
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <SocialPlatformIcon platform="instagram" size={20} className="w-8 h-8" />
                <span className="mr-3 font-medium">אינסטגרם</span>
              </div>
              <span className={`text-sm font-medium px-2 py-1 ${
                isAuthenticated('instagram') ? 'bg-green-600/10 text-green-600' : 'bg-red-600/10 text-red-600'
              } rounded-full`}>
                {isAuthenticated('instagram') ? 'מחובר' : 'לא מחובר'}
              </span>
            </li>

            {/* YouTube */}
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <SocialPlatformIcon platform="youtube" size={20} className="w-8 h-8" />
                <span className="mr-3 font-medium">יוטיוב</span>
              </div>
              <span className={`text-sm font-medium px-2 py-1 ${
                isAuthenticated('youtube') ? 'bg-green-600/10 text-green-600' : 'bg-red-600/10 text-red-600'
              } rounded-full`}>
                {isAuthenticated('youtube') ? 'מחובר' : 'לא מחובר'}
              </span>
            </li>

            {/* TikTok */}
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <SocialPlatformIcon platform="tiktok" size={20} className="w-8 h-8" />
                <span className="mr-3 font-medium">טיקטוק</span>
              </div>
              <span className={`text-sm font-medium px-2 py-1 ${
                isAuthenticated('tiktok') ? 'bg-green-600/10 text-green-600' : 'bg-red-600/10 text-red-600'
              } rounded-full`}>
                {isAuthenticated('tiktok') ? 'מחובר' : 'לא מחובר'}
              </span>
            </li>
          </ul>

          <div className="mt-4">
            <Button 
              className="w-full border border-[#3466ad] text-[#3466ad] hover:bg-[#3466ad]/10 bg-transparent"
              onClick={onShowSettings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              הגדרת פלטפורמות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
