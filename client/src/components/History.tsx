import React from 'react';
import { X, Sun, RotateCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SocialPlatformIcon from './SocialPlatformIcon';
import useHistory from '../hooks/useHistory';

interface HistoryProps {
  onBackToDashboard: () => void;
}

const History: React.FC<HistoryProps> = ({ onBackToDashboard }) => {
  const { formattedHistory, loading } = useHistory();
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'hide':
        return <Sun className="h-5 w-5 text-white" />;
      case 'restore':
        return <RotateCw className="h-5 w-5 text-white" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-white" />;
    }
  };
  
  const getActionText = (action: string) => {
    switch (action) {
      case 'hide':
        return 'הסתרת תוכן';
      case 'restore':
        return 'שחזור תוכן';
      default:
        return 'פעולה לא ידועה';
    }
  };
  
  const getPlatformDisplayName = (platform: string) => {
    const displayNames: Record<string, string> = {
      facebook: 'פייסבוק',
      instagram: 'אינסטגרם',
      youtube: 'יוטיוב',
      tiktok: 'טיקטוק'
    };
    
    return displayNames[platform] || platform;
  };
  
  return (
    <Card className="mb-6">
      <div className="bg-[#3466ad]/10 border-b border-[#3466ad]/30 px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-[#3466ad]">היסטוריית פעולות</h2>
        <Button 
          variant="ghost" 
          className="text-[#3466ad] hover:text-[#3466ad]/80 p-0 h-auto"
          onClick={onBackToDashboard}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <CardContent className="p-4">
        {loading ? (
          <div className="text-center py-8">טוען היסטוריה...</div>
        ) : formattedHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">אין רשומות היסטוריה להצגה</div>
        ) : (
          <div className="space-y-3">
            {formattedHistory.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-3 ${
                      entry.succeeded ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {getActionIcon(entry.action)}
                    </div>
                    <div>
                      <h4 className="font-medium">{getActionText(entry.action)}</h4>
                      <span className="text-sm text-gray-500">{entry.formattedTimestamp}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    entry.succeeded 
                      ? 'bg-green-600/10 text-green-600' 
                      : 'bg-red-600/10 text-red-600'
                  }`}>
                    {entry.succeeded ? 'הושלם' : 'שגיאה'}
                  </span>
                </div>
                <div className="mt-3 text-sm">
                  <p className="text-gray-600">
                    {entry.succeeded 
                      ? `${entry.action === 'hide' ? 'הוסתרו' : 'שוחזרו'} ${entry.totalItems} פריטי תוכן`
                      : `שגיאה ב${entry.action === 'hide' ? 'הסתרת' : 'שחזור'} תוכן: ${entry.error || 'שגיאה לא ידועה'}`
                    }
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(entry.platformCounts).map(([platform, count]) => (
                      <span 
                        key={platform} 
                        className={`px-2 py-1 rounded text-xs ${
                          platform === 'facebook' ? 'bg-[#1877F2]/10 text-[#1877F2]' : 
                          platform === 'instagram' ? 'bg-[#E4405F]/10 text-[#E4405F]' :
                          platform === 'youtube' ? 'bg-[#FF0000]/10 text-[#FF0000]' :
                          'bg-[#000000]/10 text-[#000000]'
                        }`}
                      >
                        {getPlatformDisplayName(platform)} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default History;
