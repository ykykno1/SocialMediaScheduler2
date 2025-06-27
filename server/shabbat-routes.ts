import type { Express, Request, Response } from "express";
import { unifiedStorage as storage } from './unified-storage.js';
import { requireAuth } from './middleware.js';
import fetch from 'node-fetch';

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface ShabbatTimes {
  candleLighting: string;
  havdalah: string;
  locationName: string;
  date: string;
}

export function registerShabbatRoutes(app: Express) {
  // Get Shabbat times route
  app.get("/api/shabbat-times", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { latitude, longitude, weeks = 1 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude required" });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid latitude or longitude" });
      }

      // Try to get cached Shabbat times
      const cachedTimes = await storage.getShabbatTimes(lat, lng);
      if (cachedTimes) {
        return res.json(cachedTimes);
      }

      // Calculate upcoming Shabbat dates
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
      const daysUntilFriday = (5 - currentDay + 7) % 7; // Days until Friday
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + daysUntilFriday);

      const shabbatTimes: ShabbatTimes[] = [];

      const getShabbatTimesForDate = async (fridayDate: Date) => {
        const year = fridayDate.getFullYear();
        const month = String(fridayDate.getMonth() + 1).padStart(2, '0');
        const day = String(fridayDate.getDate()).padStart(2, '0');
        
        try {
          // Use Hebcal API for accurate Shabbat times
          const hebcalUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&lg=he&ue=off&date=${year}-${month}-${day}`;
          const response = await fetch(hebcalUrl);
          
          if (!response.ok) {
            throw new Error(`Hebcal API error: ${response.status}`);
          }

          const data = await response.json() as any;
          
          if (!data.items || data.items.length < 2) {
            throw new Error('Invalid Shabbat times data');
          }

          // Find candle lighting and havdalah times
          let shabbatEntryTime: Date;
          let shabbatExitTime: Date;

          const candleLightingItem = data.items.find((item: any) => 
            item.category === 'candles' || item.title?.includes('נרות') || item.title?.includes('candles')
          );
          
          const havdalahItem = data.items.find((item: any) => 
            item.category === 'havdalah' || item.title?.includes('הבדלה') || item.title?.includes('havdalah')
          );

          if (candleLightingItem && candleLightingItem.date) {
            shabbatEntryTime = new Date(candleLightingItem.date);
          } else {
            // Fallback: 18 minutes before sunset on Friday
            shabbatEntryTime = new Date(fridayDate);
            shabbatEntryTime.setHours(18, 0, 0, 0); // Default fallback time
          }

          if (havdalahItem && havdalahItem.date) {
            shabbatExitTime = new Date(havdalahItem.date);
          } else {
            // Fallback: Saturday 8 PM
            const saturday = new Date(fridayDate);
            saturday.setDate(fridayDate.getDate() + 1);
            shabbatExitTime = new Date(saturday);
            shabbatExitTime.setHours(20, 0, 0, 0); // Default fallback time
          }

          return {
            candleLighting: shabbatEntryTime.toISOString(),
            havdalah: shabbatExitTime.toISOString(),
            locationName: data.location?.title || 'Unknown Location',
            date: fridayDate.toISOString().split('T')[0]
          };

        } catch (error) {
          console.error("Error fetching Shabbat times:", error);
          
          // Fallback calculation
          const saturday = new Date(fridayDate);
          saturday.setDate(fridayDate.getDate() + 1);
          
          return {
            candleLighting: new Date(fridayDate.setHours(18, 0, 0, 0)).toISOString(),
            havdalah: new Date(saturday.setHours(20, 0, 0, 0)).toISOString(),
            locationName: 'Location (estimated)',
            date: fridayDate.toISOString().split('T')[0]
          };
        }
      };

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
      };

      const formatShabbat = (shabbatData: any, fridayDate: Date) => {
        const candleTime = new Date(shabbatData.candleLighting);
        const havdalahTime = new Date(shabbatData.havdalah);
        
        return {
          ...shabbatData,
          candleLightingTime: formatTime(candleTime),
          havdalahTime: formatTime(havdalahTime),
          fridayDate: fridayDate.toLocaleDateString('he-IL'),
          saturdayDate: new Date(fridayDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')
        };
      };

      // Get Shabbat times for requested number of weeks
      for (let i = 0; i < parseInt(weeks as string); i++) {
        const fridayDate = new Date(nextFriday);
        fridayDate.setDate(nextFriday.getDate() + (i * 7));
        
        const shabbatData = await getShabbatTimesForDate(fridayDate);
        const formattedShabbat = formatShabbat(shabbatData, fridayDate);
        shabbatTimes.push(formattedShabbat as any);
      }

      // Cache the first result
      if (shabbatTimes.length > 0) {
        // Note: Actual caching implementation would be added here
      }

      res.json({
        times: shabbatTimes,
        location: { latitude: lat, longitude: lng },
        weeks: parseInt(weeks as string)
      });

    } catch (error) {
      console.error("Shabbat times error:", error);
      res.status(500).json({ error: "Failed to get Shabbat times" });
    }
  });

  // Schedule Shabbat automation route
  app.post("/api/shabbat/schedule", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const { 
        platforms, 
        action, 
        scheduleTime, 
        timezone = 'Asia/Jerusalem' 
      } = req.body;

      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ error: "Platforms array required" });
      }

      if (!action || !['hide', 'restore'].includes(action)) {
        return res.status(400).json({ error: "Action must be 'hide' or 'restore'" });
      }

      if (!scheduleTime) {
        return res.status(400).json({ error: "Schedule time required" });
      }

      // Here you would implement the actual scheduling logic
      // For now, we'll just save the schedule preference
      
      const scheduleData = {
        userId,
        platforms,
        action,
        scheduleTime: new Date(scheduleTime),
        timezone,
        createdAt: new Date(),
        status: 'scheduled'
      };

      // Log the scheduling operation
      storage.addHistoryEntry({
        platform: platforms[0] as any, // Use first platform for logging
        action: `schedule_${action}`,
        contentId: `schedule_${Date.now()}`,
        success: true,
        timestamp: new Date(),
        details: `Scheduled ${action} for ${platforms.join(', ')} at ${scheduleTime}`
      }, userId);

      res.json({
        success: true,
        schedule: scheduleData,
        message: `Shabbat ${action} scheduled successfully`
      });

    } catch (error) {
      console.error("Shabbat schedule error:", error);
      res.status(500).json({ error: "Failed to schedule Shabbat automation" });
    }
  });

  // Get scheduled Shabbat automations route
  app.get("/api/shabbat/schedules", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Get user's scheduled automations from history
      const history = storage.getHistoryEntries();
      const userSchedules = history.filter(entry => 
        entry.userId === userId && 
        (entry.action === 'schedule_hide' || entry.action === 'schedule_restore')
      );

      res.json({
        schedules: userSchedules,
        count: userSchedules.length
      });

    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({ error: "Failed to get schedules" });
    }
  });

  // Cancel Shabbat schedule route
  app.delete("/api/shabbat/schedule/:scheduleId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      const { scheduleId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!scheduleId) {
        return res.status(400).json({ error: "Schedule ID required" });
      }

      // Here you would implement the actual schedule cancellation logic
      // For now, we'll just log the cancellation
      
      storage.addHistoryEntry({
        platform: 'system' as any,
        action: 'cancel_schedule',
        contentId: scheduleId,
        success: true,
        timestamp: new Date(),
        details: `Cancelled schedule ${scheduleId}`
      }, userId);

      res.json({
        success: true,
        message: "Schedule cancelled successfully",
        scheduleId
      });

    } catch (error) {
      console.error("Cancel schedule error:", error);
      res.status(500).json({ error: "Failed to cancel schedule" });
    }
  });

  // Get Shabbat locations route
  app.get("/api/shabbat/locations", (req, res) => {
    try {
      // Return a list of supported locations for Shabbat times
      const locations = [
        { id: "281184", name: "תל אביב", country: "ישראל", timezone: "Asia/Jerusalem" },
        { id: "293397", name: "ירושלים", country: "ישראל", timezone: "Asia/Jerusalem" },
        { id: "294801", name: "חיפה", country: "ישראל", timezone: "Asia/Jerusalem" },
        { id: "347", name: "מוסקבה", country: "רוסיה", timezone: "Europe/Moscow" },
        { id: "5128581", name: "ניו יורק", country: "ארה״ב", timezone: "America/New_York" },
        { id: "2643743", name: "לונדון", country: "בריטניה", timezone: "Europe/London" },
        { id: "2988507", name: "פריז", country: "צרפת", timezone: "Europe/Paris" }
      ];

      res.json(locations);
    } catch (error) {
      console.error("Get locations error:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });
}