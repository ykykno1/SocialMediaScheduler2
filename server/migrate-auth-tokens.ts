/**
 * Migration script for auth tokens from legacy table to encrypted table
 */
import { db } from './db.js';
import { authTokens, encryptedAuthTokens } from '../shared/schema.js';
import { tokenEncryption } from './encryption.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function migrateAuthTokens(): Promise<{ migrated: number; skipped: number; errors: number }> {
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log('Starting auth token migration to encrypted table...');

  try {
    // Get all tokens from legacy table
    const legacyTokens = await db.select().from(authTokens);
    console.log(`Found ${legacyTokens.length} legacy tokens to migrate`);

    for (const token of legacyTokens) {
      try {
        // Check if already migrated
        const existing = await db.select().from(encryptedAuthTokens)
          .where(and(
            eq(encryptedAuthTokens.userId, token.userId),
            eq(encryptedAuthTokens.platform, token.platform)
          ));

        if (existing.length > 0) {
          console.log(`Token already migrated for user ${token.userId} platform ${token.platform}`);
          skipped++;
          continue;
        }

        // Encrypt the tokens
        const encryptedAccessToken = tokenEncryption.encryptForStorage(token.accessToken);
        let encryptedRefreshToken = null;
        
        if (token.refreshToken) {
          encryptedRefreshToken = tokenEncryption.encryptForStorage(token.refreshToken);
        }

        // Insert into encrypted table
        await db.insert(encryptedAuthTokens).values({
          id: nanoid(),
          userId: token.userId,
          platform: token.platform,
          encryptedAccessToken: encryptedAccessToken.encryptedToken,
          encryptedRefreshToken: encryptedRefreshToken?.encryptedToken || null,
          tokenHash: encryptedAccessToken.tokenHash,
          encryptionMetadata: encryptedAccessToken.metadata,
          expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
          scopes: token.additionalData ? JSON.stringify(JSON.parse(token.additionalData).scopes || []) : null,
          encryptionKeyVersion: 1,
          legacyAccessToken: token.accessToken, // Keep for fallback
          legacyRefreshToken: token.refreshToken,
          migrationStatus: 'migrated'
        });

        console.log(`✓ Migrated token for user ${token.userId} platform ${token.platform}`);
        migrated++;

      } catch (error) {
        console.error(`✗ Error migrating token for user ${token.userId}:`, error);
        errors++;
      }
    }

    console.log(`Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    return { migrated, skipped, errors };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAuthTokens()
    .then(result => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}