import { secureUserStorage } from './secure-user-storage.js';

/**
 * Test script for migration validation
 */
async function testUserMigration() {
  console.log('🧪 Testing user migration...');
  
  // Test with an existing user ID
  const testUserId = 'phtLx68scJszZOMrBEPHL';
  
  try {
    const comparison = await secureUserStorage.compareUserData(testUserId);
    
    console.log('📊 Migration Test Results:');
    console.log('- Data Match:', comparison.match ? '✅ PASS' : '❌ FAIL');
    
    if (!comparison.match) {
      console.log('- Differences found:');
      comparison.differences.forEach(diff => console.log(`  - ${diff}`));
    }
    
    if (comparison.old) {
      console.log('- Old user data:', {
        id: comparison.old.id,
        email: comparison.old.email,
        username: comparison.old.username,
        accountType: comparison.old.accountType
      });
    }
    
    if (comparison.new) {
      console.log('- New user data:', {
        id: comparison.new.id,
        email: comparison.new.email,
        username: comparison.new.username,
        accountType: comparison.new.accountType
      });
    }
    
    return comparison.match;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for use in other files
export { testUserMigration };