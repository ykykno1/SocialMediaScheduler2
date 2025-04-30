import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import StorageService from '../services/storageService';
import ValidationUtils from '../utils/validationUtils';
import CONFIG from '../config';
import { useQueryClient } from '@tanstack/react-query';

export function useSettings() {
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load settings from localStorage
  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback(async (newSettings: any) => {
    setLoading(true);
    
    // Validate settings
    const validation = ValidationUtils.validateSettings(newSettings);
    
    if (!validation.isValid) {
      setLoading(false);
      toast({
        title: 'שגיאת תיקוף',
        description: 'הגדרות לא תקינות. אנא בדוק את השדות המסומנים.',
        variant: 'destructive'
      });
      return validation.errors;
    }
    
    // Save settings
    const success = StorageService.saveSettings(newSettings);
    
    if (success) {
      setSettings(newSettings);
      toast({
        title: 'הגדרות נשמרו',
        description: 'ההגדרות שלך נשמרו בהצלחה.',
      });
      queryClient.invalidateQueries();
    } else {
      toast({
        title: 'שגיאה בשמירה',
        description: 'לא ניתן היה לשמור את ההגדרות.',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
    return success ? null : { error: 'Failed to save settings' };
  }, [toast, queryClient]);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    const defaultSettings = {...CONFIG.DEFAULT_SETTINGS};
    StorageService.saveSettings(defaultSettings);
    setSettings(defaultSettings);
    toast({
      title: 'איפוס הגדרות',
      description: 'ההגדרות אופסו לברירת המחדל.',
    });
  }, [toast]);

  // Update a specific setting
  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => {
      const updated = {...prev};
      
      // Handle nested keys (e.g., "platforms.facebook.enabled")
      if (key.includes('.')) {
        const parts = key.split('.');
        let target = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      } else {
        updated[key] = value;
      }
      
      return updated;
    });
  }, []);

  return { 
    settings, 
    saveSettings, 
    resetSettings, 
    updateSetting,
    loading
  };
}

export default useSettings;
