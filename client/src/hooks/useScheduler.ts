import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import SchedulerService, { SchedulerResult } from '../services/schedulerService';
import DateTimeUtils from '../utils/dateTimeUtils';
import useSettings from './useSettings';

export function useScheduler() {
  const [isRunning, setIsRunning] = useState(false);
  const [nextHideTime, setNextHideTime] = useState<Date | null>(null);
  const [nextRestoreTime, setNextRestoreTime] = useState<Date | null>(null);
  const [timeToHide, setTimeToHide] = useState('');
  const [timeToRestore, setTimeToRestore] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const scheduler = SchedulerService.getInstance();

  // Calculate next hide/restore times
  useEffect(() => {
    if (!settings) return;
    
    const calculateTimes = () => {
      const hideTime = DateTimeUtils.getNextShabbatEnter(settings.hideTime, settings.timeZone);
      const restoreTime = DateTimeUtils.getNextShabbatExit(settings.restoreTime, settings.timeZone);
      
      setNextHideTime(hideTime);
      setNextRestoreTime(restoreTime);
      
      if (hideTime) {
        const remaining = DateTimeUtils.getTimeRemaining(hideTime);
        setTimeToHide(DateTimeUtils.formatTimeRemaining(remaining));
      }
      
      if (restoreTime) {
        const remaining = DateTimeUtils.getTimeRemaining(restoreTime);
        setTimeToRestore(DateTimeUtils.formatTimeRemaining(remaining));
      }
    };
    
    calculateTimes();
    
    // Update times every minute
    const intervalId = setInterval(calculateTimes, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [settings]);

  // Start/stop scheduler based on settings
  useEffect(() => {
    if (!settings) return;
    
    if (settings.autoSchedule && !isRunning) {
      scheduler.start();
      setIsRunning(true);
    } else if (!settings.autoSchedule && isRunning) {
      scheduler.stop();
      setIsRunning(false);
    }
  }, [settings, isRunning, scheduler]);

  // Toggle scheduler
  const toggleScheduler = useCallback(() => {
    if (isRunning) {
      scheduler.stop();
      setIsRunning(false);
      toast({
        title: 'תזמון הושבת',
        description: 'המערכת לא תבצע הסתרה ושחזור תוכן באופן אוטומטי.',
      });
    } else {
      scheduler.start();
      setIsRunning(true);
      toast({
        title: 'תזמון הופעל',
        description: 'המערכת תבצע הסתרה ושחזור תוכן באופן אוטומטי.',
      });
    }
  }, [isRunning, scheduler, toast]);

  // Manual hide action
  const manualHide = useCallback(async (): Promise<SchedulerResult> => {
    setLoading(true);
    
    try {
      const result = await scheduler.hideAllContent();
      
      toast({
        title: 'הסתרת תוכן',
        description: 'הסתרת התוכן הושלמה בהצלחה.',
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'שגיאה בהסתרת תוכן',
        description: (error as Error).message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [scheduler, toast]);

  // Manual restore action
  const manualRestore = useCallback(async (): Promise<SchedulerResult> => {
    setLoading(true);
    
    try {
      const result = await scheduler.restoreAllContent();
      
      toast({
        title: 'שחזור תוכן',
        description: 'שחזור התוכן הושלם בהצלחה.',
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'שגיאה בשחזור תוכן',
        description: (error as Error).message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [scheduler, toast]);

  return {
    isRunning,
    toggleScheduler,
    nextHideTime,
    nextRestoreTime,
    timeToHide,
    timeToRestore,
    manualHide,
    manualRestore,
    loading
  };
}

export default useScheduler;
