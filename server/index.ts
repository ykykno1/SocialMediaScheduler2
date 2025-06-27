import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes-new";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - persistent sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-shabbat-robot-2024',
  resave: false,
  saveUninitialized: false,
  name: 'shabbat.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  },
  rolling: true
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
  const { unifiedStorage } = await import("./unified-storage");
  
  const INSTAGRAM_TOKEN = "EAAWtnDD3MFgBO88vrSIDAsRkYte02YZB7Vwav5QA3jyMPYrFTGXOa99tqbhperJhaq7ddUNwJXUWdZBfc7ZB87qKlZAKwWRV0DO7Vq2QFkJ4wQa5qR9nqgSCZAfkV9sd4qjaNIshTY9tROeRAhpNOMWG9S0w60WOsoD6Bzokq9aZCWuTJZAZAkVkfSZAiUBZCJ1nDcIyfOggWPxlJt4K1wwDkmQRxgNsOZAuW4v4ZBYRsGkJwgDfjpiGsWzebrjTZAVDf";

  // Security fix: Removed auto-token setting to prevent data mixing between users

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
