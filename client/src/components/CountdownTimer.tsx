import { useCountdownTimer } from '../hooks/usePlatformStatus';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  className?: string;
}

export function CountdownTimer({ className = "" }: CountdownTimerProps) {
  const { data: nextOperation, isLoading } = useCountdownTimer();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Clock className="h-4 w-4 animate-pulse" />
        <span>טוען...</span>
      </div>
    );
  }

  if (!nextOperation || !nextOperation.hasNextOperation) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Clock className="h-4 w-4" />
        <span>אין פעולות מתוזמנות</span>
      </div>
    );
  }

  const { timeUntil, displayText } = nextOperation;
  const isUrgent = timeUntil.totalMilliseconds < 3600000; // Less than 1 hour

  const formatTime = () => {
    const { hours, minutes, seconds } = timeUntil;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'} ${className}`}>
      <Clock className={`h-4 w-4 ${isUrgent ? 'text-orange-500' : 'text-blue-500'}`} />
      <span className="font-mono font-semibold">
        {formatTime()}
      </span>
      <span className="text-gray-600 dark:text-gray-300">
        עד {displayText}
      </span>
    </div>
  );
}