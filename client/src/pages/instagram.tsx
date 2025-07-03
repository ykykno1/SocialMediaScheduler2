import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function InstagramPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            חזור לבית
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Instagram className="h-6 w-6 text-[#E4405F]" />
            ניהול אינסטגרם
          </h1>
          <p className="text-gray-600">נהל את הפוסטים שלך באינסטגרם לשבת</p>
        </div>
      </div>

      {/* Instagram Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Instagram className="mr-2 h-5 w-5 text-[#E4405F]" />
            אינסטגרם
          </CardTitle>
          <CardDescription>
            נהל פוסטים באינסטגרם - ארכב והצג תוכן בזמן שבת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>בפיתוח</AlertTitle>
            <AlertDescription>
              ניהול אינסטגרם זמין למשתמשי פרימיום ונמצא כרגע בפיתוח.
              אינטגרציה מלאה תהיה זמינה בקרוב.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}