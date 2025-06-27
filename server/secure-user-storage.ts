import { db } from './db.js';
import type { User } from '../shared/schema.js';

/**
 * Secure user storage functions - testing new database structure
 */
export class SecureUserStorage {

  // SECURE FUNCTION: Get user by ID from new encrypted table
  async getUserById_v2(id: string): Promise<User | null> {
    try {
      console.log(`🔍 SecureStorage: Getting user ${id} from secure_users table`);
      
      const result = await db.execute(`
        SELECT id, email, username, password_hash as password, 
               account_tier as account_type, created_at, updated_at,
               null as shabbat_city, null as shabbat_city_id
        FROM secure_users 
        WHERE id = $1 AND is_active = true
      `, [id]);

      if (result.rows.length === 0) {
        console.log(`❌ SecureStorage: User ${id} not found`);
        return null;
      }

      const row = result.rows[0];
      const user = {
        id: row.id as string,
        email: row.email as string,
        username: row.username as string,
        password: row.password as string,
        accountType: row.account_type as 'free' | 'youtube_pro' | 'premium',
        shabbatCity: row.shabbat_city as string | null,
        shabbatCityId: row.shabbat_city_id as string | null,
        createdAt: row.created_at as Date,
        updatedAt: row.updated_at as Date
      };
      
      console.log(`✅ SecureStorage: Retrieved user ${user.email} (${user.accountType})`);
      return user;
    } catch (error) {
      console.error('❌ SecureUserStorage.getUserById_v2 error:', error);
      return null;
    }
  }

  // Comparison function: Test old vs new
  async compareUserData(id: string): Promise<{
    old: User | null,
    new: User | null,
    match: boolean,
    differences: string[]
  }> {
    // Get from old table
    const oldResult = await db.execute(`
      SELECT * FROM users WHERE id = $1
    `, [id]);
    
    const oldUser = oldResult.rows.length > 0 ? {
      id: oldResult.rows[0].id as string,
      email: oldResult.rows[0].email as string,
      username: oldResult.rows[0].username as string,
      password: oldResult.rows[0].password as string,
      accountType: oldResult.rows[0].account_type as 'free' | 'youtube_pro' | 'premium',
      shabbatCity: oldResult.rows[0].shabbat_city as string | null,
      shabbatCityId: oldResult.rows[0].shabbat_city_id as string | null,
      createdAt: oldResult.rows[0].created_at as Date,
      updatedAt: oldResult.rows[0].updated_at as Date
    } : null;

    // Get from new table
    const newUser = await this.getUserById_v2(id);

    // Compare
    const differences: string[] = [];
    let match = true;

    if (!oldUser && !newUser) {
      return { old: null, new: null, match: true, differences: [] };
    }

    if (!oldUser || !newUser) {
      differences.push('One user exists, other doesn\'t');
      match = false;
    } else {
      // Compare key fields
      if (oldUser.id !== newUser.id) {
        differences.push(`ID: ${oldUser.id} vs ${newUser.id}`);
        match = false;
      }
      if (oldUser.email !== newUser.email) {
        differences.push(`Email: ${oldUser.email} vs ${newUser.email}`);
        match = false;
      }
      if (oldUser.username !== newUser.username) {
        differences.push(`Username: ${oldUser.username} vs ${newUser.username}`);
        match = false;
      }
      if (oldUser.accountType !== newUser.accountType) {
        differences.push(`Account: ${oldUser.accountType} vs ${newUser.accountType}`);
        match = false;
      }
    }

    return { old: oldUser, new: newUser, match, differences };
  }
}

export const secureUserStorage = new SecureUserStorage();