import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auto-setup Instagram token
  const { storage } = await import("./storage");
  
  const INSTAGRAM_TOKEN = "EAAWtnDD3MFgBO88vrSIDAsRkYte02YZB7Vwav5QA3jyMPYrFTGXOa99tqbhperJhaq7ddUNwJXUWdZBfc7ZB87qKlZAKwWRV0DO7Vq2QFkJ4wQa5qR9nqgSCZAfkV9sd4qjaNIshTY9tROeRAhpNOMWG9S0w60WOsoD6Bzokq9aZCWuTJZAZAkVkfSZAiUBZCJ1nDcIyfOggWPxlJt4K1wwDkmQRxgNsOZAuW4v4ZBYRsGkJwgDfjpiGsWzebrjTZAVDf";

  try {
    if (!storage.getAuthToken('instagram')) {
      console.log('Auto-setting Instagram token...');
      
      const authData = {
        platform: 'instagram' as const,
        accessToken: INSTAGRAM_TOKEN,
        expiresIn: 86400 * 30, // 30 days
        timestamp: Date.now(),
        isManualToken: true,
        additionalData: {
          user: { id: '122100808994860326', name: 'יאיר קרני' }
        }
      };
      
      storage.saveAuthToken(authData);
      console.log('Instagram token set automatically');
    }
  } catch (error) {
    console.log('Could not auto-set Instagram token:', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
