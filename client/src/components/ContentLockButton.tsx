import { Button } from "@/components/ui/button";
import { Lock, LockOpen } from "lucide-react";
import { usePrivacyStatus } from "@/hooks/usePrivacyStatus";
import type { SupportedPlatform } from "@shared/schema";

interface ContentLockButtonProps {
  platform: SupportedPlatform;
  contentId: string;
  size?: "sm" | "default" | "lg";
}

export default function ContentLockButton({ platform, contentId, size = "sm" }: ContentLockButtonProps) {
  const { isContentLocked, wasOriginallyHidden, toggleLock, isToggling } = usePrivacyStatus(platform);
  
  const isLocked = isContentLocked(contentId);
  const wasHidden = wasOriginallyHidden(contentId);

  const handleToggleLock = () => {
    toggleLock({ contentId });
  };

  return (
    <Button
      variant={isLocked ? "default" : "outline"}
      size={size}
      onClick={handleToggleLock}
      disabled={isToggling}
      className={`${isLocked ? "bg-red-600 hover:bg-red-700" : "bg-gray-100 hover:bg-gray-200"}`}
      title={
        isLocked 
          ? "תוכן נעול - לא ישוחזר אוטומטית"
          : wasHidden 
          ? "היה מוסתר מלכתחילה - לא ישוחזר בכל מקרה"
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