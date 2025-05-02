import SettingsPanel from "@/components/SettingsPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import useFacebookAuth from "@/hooks/useFacebookAuth";

const Settings = () => {
  const { isAuthenticated, isLoading } = useFacebookAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>התחברות נדרשת</AlertTitle>
        <AlertDescription>
          יש להתחבר לפייסבוק תחילה כדי לגשת להגדרות
        </AlertDescription>
      </Alert>
    );
  }
  
  return <SettingsPanel />;
};

export default Settings;