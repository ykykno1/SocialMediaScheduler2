import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, LockOpen, EyeOff } from "lucide-react";
import { usePrivacyStatus } from "@/hooks/usePrivacyStatus";
import type { SupportedPlatform } from "@shared/schema";

interface ContentLockButtonProps {
  platform: SupportedPlatform;
  contentId: string;
  currentPrivacyStatus?: string;
  size?: "sm" | "default" | "lg";
}

export default function ContentLockButton({ 
  platform, 
  contentId, 
  currentPrivacyStatus,
  size = "sm" 
}: ContentLockButtonProps) {
  const { isContentLocked, wasOriginallyHidden, toggleLock, isToggling, getContentStatus } = usePrivacyStatus(platform);
  
  const isLocked = isContentLocked(contentId);
  const wasHidden = wasOriginallyHidden(contentId);
  const contentStatus = getContentStatus(contentId);
  
  // If the content is currently private and we don't have any record of it,
  // it was probably private originally
  const probablyOriginallyPrivate = currentPrivacyStatus === 'private' && !contentStatus;

  const handleToggleLock = () => {
    if (!wasHidden && !probablyOriginallyPrivate) {
      toggleLock({ contentId });
    }
  };

  // If it was hidden originally or is probably originally private, show a special indicator
  if (wasHidden || probablyOriginallyPrivate) {
    return (
      <div className="flex items-center space-x-1">
        <Badge variant="secondary" className="bg-gray-500 text-white">
          <EyeOff className="h-3 w-3 mr-1" />
          מוסתר מלכתחילה
        </Badge>
      </div>
    );
  }

  return (
    <Button
      variant={isLocked ? "default" : "outline"}
      size={size}
      onClick={handleToggleLock}
      disabled={isToggling}
      className={`${
        isLocked 
          ? "bg-red-600 hover:bg-red-700 text-white" 
          : "bg-gray-100 hover:bg-gray-200"
      }`}
      title={
        isLocked 
          ? "תוכן נעול - לא ישוחזר אוטומטית. לחץ לפתוח"
          : "לחץ לנעול ולמנוע שחזור אוטומטי"
      }
    >
      {isLocked ? (
        <Lock className="h-4 w-4" />
      ) : (
        <LockOpen className="h-4 w-4" />
      )}
      {size !== "sm" && (
        <span className="mr-2">
          {isLocked ? "נעול" : "פתוח"}
        </span>
      )}
    </Button>
  );
}