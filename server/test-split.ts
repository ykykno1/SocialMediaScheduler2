/**
 * Test script to verify the split routes work correctly
 */
import { registerSplitRoutes, testSplitRoutes } from './routes-split.js';
import { generateToken, verifyToken } from './middleware.js';
import express from 'express';

async function testSplitStructure() {
  console.log("Testing split routes structure...");
  
  // Test 1: Verify split routes registration
  const testApp = express();
  try {
    registerSplitRoutes(testApp);
    console.log("✅ Split routes registration: PASSED");
  } catch (error) {
    console.log("❌ Split routes registration: FAILED", error);
    return false;
  }
  
  // Test 2: Verify token functions
  try {
    const testUserId = "test-user-123";
    const token = generateToken(testUserId);
    const decoded = verifyToken(token);
    
    if (decoded && decoded.userId === testUserId) {
      console.log("✅ Token generation/verification: PASSED");
    } else {
      console.log("❌ Token generation/verification: FAILED");
      return false;
    }
  } catch (error) {
    console.log("❌ Token functions: FAILED", error);
    return false;
  }
  
  // Test 3: Verify split routes function
  try {
    const result = testSplitRoutes();
    if (result) {
      console.log("✅ Split routes function: PASSED");
    } else {
      console.log("❌ Split routes function: FAILED");
      return false;
    }
  } catch (error) {
    console.log("❌ Split routes function: FAILED", error);
    return false;
  }
  
  console.log("🎉 All split structure tests PASSED");
  return true;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSplitStructure()
    .then(success => {
      if (success) {
        console.log("Split routes structure is ready for implementation");
        process.exit(0);
      } else {
        console.log("Split routes structure needs fixes");
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testSplitStructure };