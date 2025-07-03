/**
 * Simple test of the automatic scheduler functionality
 */

import { automaticScheduler } from './server/automatic-scheduler.js';

async function testScheduler() {
    console.log('\n🧪 TESTING: Automatic Scheduler');
    console.log('================================\n');

    try {
        // Test 1: Check if scheduler is running
        console.log('1. Checking scheduler status...');
        const status = automaticScheduler.getStatus();
        console.log('Status:', status);
        
        // Test 2: Try manual hide operation (for testing user ID)
        console.log('\n2. Testing manual hide operation...');
        const testUserId = 'phtLx68scJszZOMrBEPHL'; // Known premium user ID
        await automaticScheduler.executeHideOperation(testUserId);
        console.log('✅ Hide operation test completed');
        
        // Test 3: Try manual restore operation
        console.log('\n3. Testing manual restore operation...');
        await automaticScheduler.executeRestoreOperation(testUserId);
        console.log('✅ Restore operation test completed');
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testScheduler().then(() => {
    console.log('\n🏁 Testing session ended');
}).catch(error => {
    console.error('💥 Testing session failed:', error);
});