import { useState, useEffect, useCallback } from 'react';
import StorageService from '../services/storageService';

export function useHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    setLoading(true);
    const historyData = StorageService.getHistory();
    setHistory(historyData);
    setLoading(false);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    StorageService.save(StorageService.STORAGE_KEYS.HISTORY, []);
    setHistory([]);
  }, []);

  // Get platform-specific counts from history entry
  const getPlatformCounts = useCallback((historyEntry: any) => {
    if (!historyEntry || !historyEntry.platforms) return {};
    
    return historyEntry.platforms.reduce((acc: Record<string, number>, platform: any) => {
      acc[platform.platform] = platform.successful || 0;
      return acc;
    }, {});
  }, []);

  // Format history entry for display
  const formatHistoryEntry = useCallback((entry: any) => {
    if (!entry) return null;
    
    const platformCounts = getPlatformCounts(entry);
    const totalItems = Object.values(platformCounts).reduce((sum: number, count: number) => sum + count, 0);
    
    return {
      ...entry,
      formattedTimestamp: new Date(entry.timestamp).toLocaleString('he-IL'),
      platformCounts,
      totalItems,
      succeeded: entry.status === 'success'
    };
  }, [getPlatformCounts]);

  return {
    history,
    formattedHistory: history.map(formatHistoryEntry),
    clearHistory,
    loading
  };
}

export default useHistory;
