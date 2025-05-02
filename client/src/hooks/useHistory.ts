import { useQuery } from '@tanstack/react-query';
import { HistoryEntry } from '@shared/schema';

export default function useHistory() {
  // Fetch history entries
  const { 
    data: historyEntries, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<HistoryEntry[]>({
    queryKey: ['/api/history'],
    refetchOnWindowFocus: false,
  });

  return {
    historyEntries: historyEntries || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}