/**
 * Migration script for auth tokens from legacy table to encrypted table
 */
import { db } from "./db";
import { authTokens, encryptedAuthTokens } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from 'nanoid';

export async function migrateAuthTokens(): Promise<{ migrated: number; skipped: number; errors: number }> {
  console.log('🔄 Starting auth token migration...');
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all tokens from legacy table
    const legacyTokens = await db.select().from(authTokens);
    console.log(`Found ${legacyTokens.length} tokens in legacy table`);

    for (const token of legacyTokens) {
      try {
        // Check if already migrated
        const [existing] = await db.select().from(encryptedAuthTokens)
          .where(and(
            eq(encryptedAuthTokens.platform, token.platform),
            eq(encryptedAuthTokens.userId, token.userId)
          ));

        if (existing) {
          console.log(`⏭️  Token already migrated: ${token.platform} for user ${token.userId}`);
          skipped++;
          continue;
        }

        // Migrate token to encrypted table
        await db.insert(encryptedAuthTokens).values({
          id: nanoid(),
          userId: token.userId,
          platform: token.platform,
          encryptedAccessToken: null, // Will be encrypted later
          encryptedRefreshToken: null, // Will be encrypted later
          tokenHash: null, // Will be computed later
          expiresAt: token.expiresAt,
          scopes: null,
          encryptionKeyVersion: 1,
          createdAt: new Date(),
          lastUsed: token.timestamp || new Date(),
          legacyAccessToken: token.accessToken, // Store temporarily for migration
          legacyRefreshToken: token.refreshToken,
          migrationStatus: 'migrated'
        });

        console.log(`✅ Migrated token: ${token.platform} for user ${token.userId}`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrating token ${token.platform} for user ${token.userId}:`, error);
        errors++;
      }
    }

    console.log(`📊 Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    return { migrated, skipped, errors };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Auto-run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
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