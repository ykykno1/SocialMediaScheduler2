// Project Structure
/shabbat-robot/
  ├── index.html                  // Main HTML file
  ├── css/
  │   └── styles.css              // Styling for the app
  ├── js/
  │   ├── app.js                  // Main application entry point
  │   ├── config.js               // Configuration and constants
  │   ├── services/
  │   │   ├── apiService.js       // Handle API requests
  │   │   ├── authService.js      // Authentication functions
  │   │   ├── schedulerService.js // Schedule content hiding/restoration
  │   │   └── storageService.js   // Local storage management
  │   ├── platforms/
  │   │   ├── facebook.js         // Facebook specific implementation
  │   │   ├── instagram.js        // Instagram specific implementation
  │   │   ├── youtube.js          // YouTube specific implementation
  │   │   └── tiktok.js           // TikTok specific implementation
  │   ├── ui/
  │   │   ├── dashboard.js        // Dashboard UI functionality
  │   │   ├── settings.js         // Settings UI functionality
  │   │   └── scheduler.js        // Scheduler UI functionality
  │   └── utils/
  │       ├── dateTime.js         // Date and time utilities
  │       ├── validation.js       // Form validation
  │       └── logger.js           // Logging functionality
  └── assets/
      └── images/                 // App images and icons