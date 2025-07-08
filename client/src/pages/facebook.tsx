import FacebookAdvancedSection from "@/components/FacebookAdvancedSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FacebookPage() {
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
            <Facebook className="h-6 w-6 text-[#1877F2]" />
            ניהול פייסבוק
          </h1>
          <p className="text-gray-600">נהל פוסטים אישיים, עמודים עסקיים וקמפיינים ממומנים לשבת</p>
        </div>
      </div>

      {/* Facebook Management */}
      <FacebookAdvancedSection />
    </div>
  );
}