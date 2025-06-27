import type { Express } from "express";
import { registerAuthRoutes } from './auth.js';

export function registerAllRoutes(app: Express) {
  // Register auth routes first
  registerAuthRoutes(app);
  
  // Other routes will be added here as we split them
}

// Export helper functions from auth for backward compatibility
export { generateToken, verifyToken } from './auth.js';