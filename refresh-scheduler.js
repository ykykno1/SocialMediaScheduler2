// Simple script to refresh the scheduler
const { automaticScheduler } = require('./server/automatic-scheduler.ts');

async function refreshScheduler() {
  try {
    console.log('Stopping scheduler...');
    automaticScheduler.stop();
    
    console.log('Starting scheduler...');
    await automaticScheduler.start();
    
    console.log('Scheduler refreshed successfully!');
    
    // Check status
    const status = automaticScheduler.getStatus();
    console.log('Scheduler status:', status);
    
  } catch (error) {
    console.error('Error refreshing scheduler:', error);
  }
}

refreshScheduler();