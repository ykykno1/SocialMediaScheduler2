import { storage } from './database-storage';

/**
 * This module provides actual content operations for the ShabbatScheduler
 * It performs hide/restore operations on YouTube and Facebook
 */

export async function hideAll(userId: string): Promise<void> {
  console.log(`🕯️ HIDE: Starting to hide content for user ${userId}`);
  let total = 0;

  try {
    const ytToken = await storage.getAuthToken('youtube', userId);
    if (ytToken?.accessToken) {
      const restored = await fetch(`http://localhost:5000/api/youtube/hide-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ytToken.accessToken}`
        },
        body: JSON.stringify({ userId })
      });
      const json = await restored.json();
      console.log('✅ YouTube hide result:', json);
      total += json.hiddenCount || 0;
    }
  } catch (e) {
    console.error(`❌ YouTube hide failed for ${userId}`, e);
  }

  try {
    const fbToken = await storage.getAuthToken('facebook', userId);
    if (fbToken?.accessToken) {
      const hidden = await fetch(`http://localhost:5000/api/facebook/hide-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fbToken.accessToken}`
        },
        body: JSON.stringify({ userId })
      });
      const json = await hidden.json();
      console.log('✅ Facebook hide result:', json);
      total += json.hiddenCount || 0;
    }
  } catch (e) {
    console.error(`❌ Facebook hide failed for ${userId}`, e);
  }

  console.log(`✅ Finished hiding content for ${userId}. Total items hidden: ${total}`);
}

export async function restoreAll(userId: string): Promise<void> {
  console.log(`✨ RESTORE: Starting to restore content for user ${userId}`);
  let total = 0;

  try {
    const ytToken = await storage.getAuthToken('youtube', userId);
    if (ytToken?.accessToken) {
      const restored = await fetch(`http://localhost:5000/api/youtube/show-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ytToken.accessToken}`
        },
        body: JSON.stringify({ userId })
      });
      const json = await restored.json();
      console.log('✅ YouTube restore result:', json);
      total += json.restoredCount || 0;
    }
  } catch (e) {
    console.error(`❌ YouTube restore failed for ${userId}`, e);
  }

  try {
    const fbToken = await storage.getAuthToken('facebook', userId);
    if (fbToken?.accessToken) {
      const restored = await fetch(`http://localhost:5000/api/facebook/show-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fbToken.accessToken}`
        },
        body: JSON.stringify({ userId })
      });
      const json = await restored.json();
      console.log('✅ Facebook restore result:', json);
      total += json.restoredCount || 0;
    }
  } catch (e) {
    console.error(`❌ Facebook restore failed for ${userId}`, e);
  }

  console.log(`✅ Finished restoring content for ${userId}. Total items restored: ${total}`);
}
