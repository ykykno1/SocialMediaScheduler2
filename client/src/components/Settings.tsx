import { useState } from "react";
import { useForm } from "react-hook-form";
import useSettings from "@/hooks/useSettings";
import { Settings } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
// Remove TimeField import as we're using Input with type="time"

const SettingsPage = () => {
  const { settings, updateSettings, isUpdating } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Settings>({
    defaultValues: settings,
  });

  const onSubmit = async (data: Settings) => {
    setIsSubmitting(true);
    try {
      await updateSettings(data);
      toast({
        title: "הגדרות נשמרו",
        description: "ההגדרות עודכנו בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: error instanceof Error ? error.message : "אירעה שגיאה לא ידועה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>הגדרות</CardTitle>
        <CardDescription>
          התאם את הגדרות האפליקציה לפי צרכיך
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="autoSchedule"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel>הסתרה אוטומטית</FormLabel>
                    <FormDescription>
                      האם להסתיר ולשחזר פוסטים אוטומטית בזמנים הקבועים
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hideTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>זמן הסתרה</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      הזמן בו יוסתרו הפוסטים באופן אוטומטי
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restoreTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>זמן שחזור</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      הזמן בו ישוחזרו הפוסטים באופן אוטומטי
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אזור זמן</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    אזור הזמן לפיו יקבעו זמני ההסתרה והשחזור
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || isUpdating} className="mr-auto">
              {(isSubmitting || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              שמור הגדרות
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;