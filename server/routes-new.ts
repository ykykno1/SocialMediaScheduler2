import type { Express } from "express";
import { createServer } from "http";
import { registerAuthRoutes } from './auth-routes.js';
import { registerFacebookRoutes } from './facebook-routes.js';
import { registerYouTubeRoutes } from './youtube-routes.js';
import { registerAdminRoutes } from './admin-routes.js';
import { registerUserRoutes } from './user-routes.js';
import { registerShabbatRoutes } from './shabbat-routes.js';
import { registerOAuthRoutes } from './oauth-routes.js';

export function registerRoutes(app: Express) {
  console.log("Registering all route modules...");

  // Register all route modules
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerFacebookRoutes(app);
  registerYouTubeRoutes(app);
  registerShabbatRoutes(app);
  registerOAuthRoutes(app);
  registerAdminRoutes(app);

  console.log("All route modules registered successfully");

  // Create HTTP server
  const server = createServer(app);
  return server;
}