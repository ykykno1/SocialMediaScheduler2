// Test script to trigger the scheduler manually for testing
const fetch = require('node-fetch');

async function testScheduler() {
  try {
    console.log('Testing scheduler with manual execution...');
    
    // Make a request to trigger hide operation manually
    const response = await fetch('http://localhost:5000/api/test-scheduler-hide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'phtLx68scJszZOMrBEPHL'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Scheduler test result:', result);
    } else {
      console.error('Test failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error testing scheduler:', error);
  }
}

// Run the test
testScheduler();