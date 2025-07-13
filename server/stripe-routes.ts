/**
 * Stripe Demo Routes - Safe API endpoints for testing subscription flow
 * These routes are separate from existing routes and won't affect current functionality
 */

import type { Express, Request, Response } from "express";
import { stripeDemo, checkTrialStatus, DemoSubscription } from "./stripe-demo";
import { nanoid } from "nanoid";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Import the actual auth middleware from routes
import jwt from 'jsonwebtoken';
import { enhancedStorage as storage } from './enhanced-storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-shabbat-robot-2024';

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

// Authentication middleware that actually works
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    console.log(`Stripe Auth middleware for ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or wrong format');
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log('Token verification failed');
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log('Getting user for Stripe API, ID:', decoded.userId);
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ error: "User not found" });
    }

    console.log('User authenticated successfully for Stripe:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Stripe auth middleware error:', error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

export function registerStripeRoutes(app: Express) {
  console.log("Registering Stripe Demo routes...");

  // ==========================================
  // TRIAL SUBSCRIPTION MANAGEMENT
  // ==========================================

  /**
   * Start trial subscription (first step for new users)
   * POST /api/subscription/start-trial
   */
  app.post("/api/subscription/start-trial", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const email = req.user.email;
      const { planType = 'monthly' } = req.body;

      // Check if user already has a trial
      const existing = stripeDemo.getSubscription(userId);
      if (existing) {
        return res.json({ 
          success: false, 
          error: "User already has a subscription",
          subscription: existing 
        });
      }

      // Create trial subscription with plan type
      const subscription = await stripeDemo.createTrialSubscription(userId, email, planType);
      
      console.log(`Started ${planType} trial for user ${userId}`);
      res.json({ 
        success: true, 
        subscription,
        message: planType === 'annual' 
          ? "Trial started with annual plan! You get a free month and save $10.80 yearly."
          : "Trial started! You have access to all features until your first Shabbat ends."
      });

    } catch (error: any) {
      console.error("Trial creation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Setup payment method (card collection without charge)
   * POST /api/subscription/setup-payment
   */
  app.post("/api/subscription/setup-payment", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      
      const subscription = stripeDemo.getSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ error: "No subscription found. Please start trial first." });
      }

      if (subscription.status !== 'trial') {
        return res.status(400).json({ error: "Payment setup only available during trial" });
      }

      // Create setup intent for card collection
      const setupResult = await stripeDemo.setupPaymentMethod(userId);
      
      res.json({
        success: true,
        clientSecret: setupResult.clientSecret,
        setupIntentId: setupResult.setupIntentId,
        message: "Payment method setup initiated. Complete card details to secure your spot."
      });

    } catch (error: any) {
      console.error("Payment setup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get subscription status
   * GET /api/subscription/status
   */
  app.get("/api/subscription/status", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const subscription = stripeDemo.getSubscription(userId);
      
      if (!subscription) {
        return res.json({ 
          hasSubscription: false,
          canStartTrial: true,
          message: "No subscription found. You can start your free trial."
        });
      }

      const trialStatus = checkTrialStatus(subscription);
      
      res.json({
        hasSubscription: true,
        subscription,
        trialStatus,
        canStartTrial: false,
        paymentRequired: trialStatus.paymentDue && subscription.status === 'pending_payment'
      });

    } catch (error: any) {
      console.error("Status check error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Cancel subscription (before payment)
   * POST /api/subscription/cancel
   */
  app.post("/api/subscription/cancel", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      const subscription = stripeDemo.getSubscription(userId);
      if (!subscription) {
        return res.status(404).json({ error: "No subscription found" });
      }

      if (subscription.status === 'active') {
        return res.status(400).json({ error: "Cannot cancel active subscription through this endpoint" });
      }

      const cancelled = await stripeDemo.cancelSubscription(userId);
      
      if (cancelled) {
        console.log(`User ${userId} cancelled subscription. Reason: ${reason || 'Not specified'}`);
        res.json({ 
          success: true, 
          message: "Subscription cancelled successfully. You won't be charged." 
        });
      } else {
        res.status(500).json({ error: "Failed to cancel subscription" });
      }

    } catch (error: any) {
      console.error("Cancellation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // PAYMENT PROCESSING (ADMIN/SYSTEM)
  // ==========================================

  /**
   * Process Tuesday payments (system/admin endpoint)
   * POST /api/subscription/process-payments
   */
  app.post("/api/subscription/process-payments", async (req: Request, res: Response) => {
    try {
      // In production, this would be called by a cron job or webhook
      const allSubscriptions = stripeDemo.getAllSubscriptions();
      const pendingPayments = allSubscriptions.filter(sub => 
        sub.status === 'pending_payment' && 
        sub.paymentDueDate && 
        new Date() >= sub.paymentDueDate
      );

      const results = [];
      for (const subscription of pendingPayments) {
        const result = await stripeDemo.chargeCustomer(subscription.userId);
        results.push({
          userId: subscription.userId,
          ...result
        });
      }

      console.log(`Processed ${results.length} pending payments`);
      res.json({ 
        success: true, 
        processed: results.length,
        results 
      });

    } catch (error: any) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Stripe webhook handler (demo)
   * POST /api/subscription/webhook
   */
  app.post("/api/subscription/webhook", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      
      // In production, verify webhook signature here
      const result = await stripeDemo.handleWebhook(payload);
      
      res.json(result);

    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================

  /**
   * Get all subscriptions (admin only)
   * GET /api/admin/subscriptions
   */
  app.get("/api/admin/subscriptions", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin authentication
      const allSubscriptions = stripeDemo.getAllSubscriptions();
      
      const stats = {
        total: allSubscriptions.length,
        trial: allSubscriptions.filter(s => s.status === 'trial').length,
        pending: allSubscriptions.filter(s => s.status === 'pending_payment').length,
        active: allSubscriptions.filter(s => s.status === 'active').length,
        cancelled: allSubscriptions.filter(s => s.status === 'cancelled').length,
      };

      res.json({
        subscriptions: allSubscriptions,
        stats
      });

    } catch (error: any) {
      console.error("Admin subscriptions error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Manual subscription management (admin)
   * POST /api/admin/subscription/:userId/action
   */
  app.post("/api/admin/subscription/:userId/:action", async (req: Request, res: Response) => {
    try {
      const { userId, action } = req.params;
      const subscription = stripeDemo.getSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      let result;
      switch (action) {
        case 'cancel':
          result = await stripeDemo.cancelSubscription(userId);
          break;
        case 'charge':
          result = await stripeDemo.chargeCustomer(userId);
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      res.json({ success: true, result });

    } catch (error: any) {
      console.error("Admin action error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log("✅ Stripe Demo routes registered successfully");
}