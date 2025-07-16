import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Facebook, Lock, Unlock, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import useMultipleFacebookAuth from "@/hooks/useMultipleFacebookAuth";

export default function MultipleFacebookSection() {
  const [newConnectionName, setNewConnectionName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { 
    connections, 
    hasAnyConnection, 
    isAuthenticating, 
    login, 
    logout,
    isAddingConnection,
    isRemovingConnection 
  } = useMultipleFacebookAuth();

  const handleAddConnection = async () => {
    if (!newConnectionName.trim()) return;
    
    try {
      await login(newConnectionName.trim());
      setNewConnectionName('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  const handleRemoveConnection = async (connectionName: string) => {
    try {
      await logout(connectionName);
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Facebook className="mr-2 h-5 w-5 text-[#1877F2]" />
          חיבורי פייסבוק מרובים
        </CardTitle>
        <CardDescription>
          נהל מספר חשבונות או עמודי פייסבוק במקביל
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing connections */}
          {connections.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">חיבורים קיימים:</h4>
              {connections.map((connection) => (
                <div 
                  key={connection.connectionName}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Facebook className="h-4 w-4 text-[#1877F2]" />
                    <div>
                      <div className="font-medium">{connection.connectionName}</div>
                      {connection.facebookName && (
                        <div className="text-sm text-gray-500">{connection.facebookName}</div>
                      )}
                    </div>
                    {connection.isAuthenticated && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        מחובר
                      </Badge>
                    )}
                    {connection.pageAccess && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        גישה לעמודים
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRemoveConnection(connection.connectionName)}
                    variant="outline"
                    size="sm"
                    disabled={isRemovingConnection}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    הסר
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new connection */}
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full"
              disabled={isAuthenticating}
            >
              <Plus className="mr-2 h-4 w-4" />
              הוסף חיבור פייסבוק חדש
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <Label htmlFor="connection-name">שם החיבור החדש:</Label>
              <Input
                id="connection-name"
                value={newConnectionName}
                onChange={(e) => setNewConnectionName(e.target.value)}
                placeholder="למשל: חשבון עסקי, עמוד הקהילה, וכו'"
                dir="rtl"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddConnection}
                  disabled={!newConnectionName.trim() || isAuthenticating}
                  className="bg-[#1877F2] hover:bg-[#166FE5]"
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  {isAuthenticating ? "מתחבר..." : "התחבר"}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewConnectionName('');
                  }}
                  variant="outline"
                  disabled={isAuthenticating}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}

          {/* Info alert when no connections */}
          {connections.length === 0 && !showAddForm && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>אין חיבורים</AlertTitle>
              <AlertDescription>
                טרם הוספת חיבורי פייסבוק. לחץ על "הוסף חיבור פייסבוק חדש" כדי להתחיל.
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">הוראות שימוש:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>כל חיבור יכול להיות לחשבון פייסבוק שונה או לעמוד שונה</li>
              <li>תן שם משמעותי לכל חיבור כדי להבחין ביניהם</li>
              <li>ניתן לנהל פוסטים בנפרד עבור כל חיבור</li>
              <li>כל חיבור דורש אישור נפרד בפייסבוק</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}