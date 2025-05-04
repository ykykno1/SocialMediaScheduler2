import { storage } from "./storage";
import { Express } from "express";
import fetch from 'node-fetch';
import { FacebookPage } from "@shared/schema";

export function registerFacebookPagesRoutes(app: Express) {
  // Get Facebook pages
  app.get("/api/facebook/pages", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      // Try to use cached pages first if available
      const cachedPages = storage.getCachedPages ? storage.getCachedPages() : [];
      if (cachedPages && cachedPages.length > 0) {
        return res.json(cachedPages);
      }
      
      // Request pages from Facebook Graph API
      console.log("Fetching pages from Facebook API...");
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${auth.accessToken}`;
      
      const pagesResponse = await fetch(pagesUrl);
      
      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json() as { error?: { code: number; message: string } };
        console.error("Facebook pages fetch error:", errorData);
        
        if (errorData.error && (errorData.error.code === 190 || errorData.error.code === 104)) {
          storage.removeFacebookAuth();
          return res.status(401).json({ error: "Facebook authentication expired", details: errorData.error });
        }
        
        return res.status(400).json({ error: "Failed to fetch Facebook pages", details: errorData });
      }
      
      const pagesData = await pagesResponse.json() as { data: FacebookPage[] };
      console.log("Got pages from Facebook API:", pagesData);
      
      if (!pagesData.data || !Array.isArray(pagesData.data)) {
        return res.status(400).json({ error: "Invalid response format from Facebook" });
      }
      
      // Add isHidden property to all pages
      const pagesWithIsHidden = pagesData.data.map(page => ({
        ...page,
        isHidden: false // Initially not hidden
      }));
      
      // Save pages to cache - if the function exists
      if (storage.saveCachedPages) {
        storage.saveCachedPages(pagesWithIsHidden);
      }
      
      res.json(pagesWithIsHidden);
    } catch (error) {
      console.error("Facebook pages fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Hide Facebook pages
  app.post("/api/facebook/hide-pages", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      const pages = storage.getCachedPages ? storage.getCachedPages() : [];
      
      if (!pages || pages.length === 0) {
        return res.json({
          success: true,
          totalPages: 0,
          hiddenPages: 0,
          failedPages: 0,
          manualInstructions: true,
          message: "לא נמצאו דפים להסתרה."
        });
      }
      
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each page - for pages we can actually update them
      for (const page of pages) {
        try {
          // We'll use the page access token to unpublish the page
          if (page.access_token) {
            const updateUrl = `https://graph.facebook.com/v19.0/${page.id}?published=false&access_token=${page.access_token}`;
            const updateResponse = await fetch(updateUrl, { method: 'POST' });
            
            if (updateResponse.ok) {
              successCount++;
            } else {
              const errorData = await updateResponse.json() as { error?: { message: string } };
              console.error(`Failed to hide page ${page.id}:`, errorData);
              failureCount++;
              lastError = errorData.error?.message || "Unknown error";
            }
          } else {
            failureCount++;
            lastError = "Missing page access token";
          }
        } catch (error) {
          console.error(`Error hiding page ${page.id}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Update cache to mark pages as hidden
      if (successCount > 0 && storage.saveCachedPages) {
        const updatedPages = pages.map(page => ({
          ...page,
          isHidden: true
        }));
        storage.saveCachedPages(updatedPages);
      }
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "hide",
        platform: "facebook",
        success: failureCount === 0 && successCount > 0,
        affectedItems: successCount,
        error: lastError || undefined
      });
      
      // Response to client
      res.json({
        success: failureCount === 0 && successCount > 0,
        totalPages: pages.length,
        hiddenPages: successCount,
        failedPages: failureCount,
        error: lastError,
        manualInstructions: failureCount > 0,
        message: failureCount > 0 
          ? "לא ניתן להסתיר חלק מהדפים באופן אוטומטי. בדוק את ההרשאות או בצע הסתרה ידנית באתר פייסבוק."
          : undefined
      });
    } catch (error) {
      console.error("Hide pages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Restore Facebook pages
  app.post("/api/facebook/restore-pages", async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: "Not authenticated with Facebook" });
      }
      
      const pages = storage.getCachedPages ? storage.getCachedPages() : [];
      
      if (!pages || pages.length === 0) {
        return res.json({
          success: true,
          totalPages: 0,
          restoredPages: 0,
          failedPages: 0,
          manualInstructions: true,
          message: "לא נמצאו דפים לשחזור."
        });
      }
      
      // Filter for hidden pages only
      const pagesToRestore = pages.filter(page => page.isHidden);
      
      if (pagesToRestore.length === 0) {
        return res.json({
          success: true,
          totalPages: 0,
          restoredPages: 0,
          failedPages: 0,
          manualInstructions: true,
          message: "לא נמצאו דפים מוסתרים לשחזור."
        });
      }
      
      let successCount = 0;
      let failureCount = 0;
      let lastError = null;
      
      // Process each page
      for (const page of pagesToRestore) {
        try {
          // We'll use the page access token to publish the page
          if (page.access_token) {
            const updateUrl = `https://graph.facebook.com/v19.0/${page.id}?published=true&access_token=${page.access_token}`;
            const updateResponse = await fetch(updateUrl, { method: 'POST' });
            
            if (updateResponse.ok) {
              successCount++;
            } else {
              const errorData = await updateResponse.json() as { error?: { message: string } };
              console.error(`Failed to restore page ${page.id}:`, errorData);
              failureCount++;
              lastError = errorData.error?.message || "Unknown error";
            }
          } else {
            failureCount++;
            lastError = "Missing page access token";
          }
        } catch (error) {
          console.error(`Error restoring page ${page.id}:`, error);
          failureCount++;
          lastError = error instanceof Error ? error.message : "Unknown error";
        }
      }
      
      // Update cache to mark pages as visible
      if (successCount > 0 && storage.saveCachedPages) {
        const updatedPages = pages.map(page => {
          if (pagesToRestore.some(p => p.id === page.id)) {
            return {
              ...page,
              isHidden: false
            };
          }
          return page;
        });
        storage.saveCachedPages(updatedPages);
      }
      
      // Record the operation in history
      const historyEntry = storage.addHistoryEntry({
        timestamp: new Date(),
        action: "restore",
        platform: "facebook",
        success: failureCount === 0 && successCount > 0,
        affectedItems: successCount,
        error: lastError || undefined
      });
      
      // Response to client
      res.json({
        success: failureCount === 0 && successCount > 0,
        totalPages: pagesToRestore.length,
        restoredPages: successCount,
        failedPages: failureCount,
        error: lastError,
        manualInstructions: failureCount > 0,
        message: failureCount > 0 
          ? "לא ניתן לשחזר חלק מהדפים באופן אוטומטי. בדוק את ההרשאות או בצע שחזור ידני באתר פייסבוק."
          : undefined
      });
    } catch (error) {
      console.error("Restore pages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}