import fetch from 'node-fetch';
import type { FacebookAuth, FacebookPage } from '@shared/schema';
import { storage } from './storage';
import type { Express } from "express";

const FACEBOOK_API_VERSION = 'v19.0';

/**
 * Get Facebook pages for a user
 * @param auth Facebook auth data
 * @returns Array of Facebook pages
 */
export const getUserPages = async (auth: FacebookAuth): Promise<FacebookPage[]> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/accounts?fields=name,access_token,category,tasks&access_token=${auth.accessToken}`
    );
    
    const data = await response.json() as { data?: FacebookPage[], error?: { message: string } };
    
    if (data.error) {
      console.error('Error fetching Facebook pages:', data.error);
      throw new Error(data.error.message);
    }
    
    return (data.data || []).map(page => ({
      ...page,
      isHidden: false // Default state is visible/published
    }));
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    throw error;
  }
};

/**
 * Update the publishing status of a Facebook page
 * @param auth Facebook auth data
 * @param pageId Page ID to update
 * @param pageToken Page access token
 * @param isPublished Whether the page should be published (true) or unpublished (false)
 * @returns Result of the operation
 */
export const updatePagePublishStatus = async (
  auth: FacebookAuth,
  pageId: string,
  pageToken: string,
  isPublished: boolean
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${pageId}?access_token=${pageToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_published: isPublished,
        }),
      }
    );
    
    const data = await response.json() as { success?: boolean; error?: { message: string } };
    
    if (data.error) {
      console.error(`Error ${isPublished ? 'publishing' : 'unpublishing'} page:`, data.error);
      return { success: false, message: data.error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error ${isPublished ? 'publishing' : 'unpublishing'} page:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Hide all Facebook pages (unpublish them)
 * @param auth Facebook auth data
 * @returns Result of the operation
 */
export const hideAllPages = async (auth: FacebookAuth): Promise<{ 
  success: boolean; 
  hiddenPages: number; 
  message?: string 
}> => {
  try {
    const pages = await getUserPages(auth);
    
    const results = await Promise.allSettled(
      pages.map(page => 
        updatePagePublishStatus(auth, page.id, page.access_token || '', false)
      )
    );
    
    const hiddenPages = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;
    
    // If we couldn't hide any pages, consider it a failure
    if (hiddenPages === 0 && pages.length > 0) {
      const errors = results
        .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        .map(result => {
          if (result.status === 'rejected') {
            return result.reason.message;
          } else {
            return (result.value as any).message;
          }
        })
        .join(', ');
      
      return { success: false, hiddenPages: 0, message: errors };
    }
    
    return { success: true, hiddenPages };
  } catch (error: any) {
    console.error('Error hiding Facebook pages:', error);
    return { success: false, hiddenPages: 0, message: error.message };
  }
};

/**
 * Restore all Facebook pages (publish them)
 * @param auth Facebook auth data
 * @returns Result of the operation
 */
export const restoreAllPages = async (auth: FacebookAuth): Promise<{ 
  success: boolean; 
  restoredPages: number; 
  message?: string 
}> => {
  try {
    const pages = await getUserPages(auth);
    
    const results = await Promise.allSettled(
      pages.map(page => 
        updatePagePublishStatus(auth, page.id, page.access_token || '', true)
      )
    );
    
    const restoredPages = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length;
    
    // If we couldn't restore any pages, consider it a failure
    if (restoredPages === 0 && pages.length > 0) {
      const errors = results
        .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        .map(result => {
          if (result.status === 'rejected') {
            return result.reason.message;
          } else {
            return (result.value as any).message;
          }
        })
        .join(', ');
      
      return { success: false, restoredPages: 0, message: errors };
    }
    
    return { success: true, restoredPages };
  } catch (error: any) {
    console.error('Error restoring Facebook pages:', error);
    return { success: false, restoredPages: 0, message: error.message };
  }
};

/**
 * Register Facebook pages API routes
 * @param app Express application
 */
export const registerFacebookPagesRoutes = (app: Express) => {
  // Get Facebook pages
  app.get('/api/facebook/pages', async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: 'Not authenticated with Facebook' });
      }
      
      // Check if page access is authorized
      if (!auth.pageAccess) {
        return res.status(403).json({ 
          error: 'Page access not authorized',
          message: 'You need to authorize page management permissions'
        });
      }
      
      const pages = await getUserPages(auth);
      res.json(pages);
    } catch (error: any) {
      console.error('Error fetching Facebook pages:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch Facebook pages' });
    }
  });
  
  // Hide Facebook pages
  app.post('/api/facebook/hide-pages', async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: 'Not authenticated with Facebook' });
      }
      
      // Check if page access is authorized
      if (!auth.pageAccess) {
        return res.status(403).json({ 
          error: 'Page access not authorized',
          message: 'You need to authorize page management permissions'
        });
      }
      
      const result = await hideAllPages(auth);
      
      // Add to history
      const settings = storage.getSettings();
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: 'hide',
        platform: 'facebook',
        success: result.success,
        affectedItems: result.hiddenPages,
        error: result.success ? undefined : (result.message || 'Failed to hide pages')
      });
      
      // Update settings
      storage.saveSettings({
        ...settings,
        lastHideOperation: new Date()
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Error hiding Facebook pages:', error);
      res.status(500).json({ error: error.message || 'Failed to hide Facebook pages' });
    }
  });
  
  // Restore Facebook pages
  app.post('/api/facebook/restore-pages', async (req, res) => {
    try {
      const auth = storage.getFacebookAuth();
      
      if (!auth) {
        return res.status(401).json({ error: 'Not authenticated with Facebook' });
      }
      
      // Check if page access is authorized
      if (!auth.pageAccess) {
        return res.status(403).json({ 
          error: 'Page access not authorized',
          message: 'You need to authorize page management permissions'
        });
      }
      
      const result = await restoreAllPages(auth);
      
      // Add to history
      const settings = storage.getSettings();
      storage.addHistoryEntry({
        timestamp: new Date(),
        action: 'restore',
        platform: 'facebook',
        success: result.success,
        affectedItems: result.restoredPages,
        error: result.success ? undefined : (result.message || 'Failed to restore pages')
      });
      
      // Update settings
      storage.saveSettings({
        ...settings,
        lastRestoreOperation: new Date()
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Error restoring Facebook pages:', error);
      res.status(500).json({ error: error.message || 'Failed to restore Facebook pages' });
    }
  });
};