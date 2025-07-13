/**
 * Stripe Demo Service - Safe testing environment
 * This file is for testing Stripe integration without affecting existing code
 */

// Demo mode - will work without real Stripe keys
export const STRIPE_DEMO_MODE = true;

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface DemoSubscription {
  id: string;
  userId: string;
  status: 'trial' | 'pending_payment' | 'active' | 'cancelled';
  planType: 'monthly' | 'annual';
  trialStartDate: Date;
  paymentDueDate?: Date;
  cardSetup: boolean;
  amount: number; // $9.90/month or $108/year in cents
}

export class StripeDemo {
  private demoSubscriptions: Map<string, DemoSubscription> = new Map();
  private usedTrials: Set<string> = new Set(); // Track users who used free trial
  private actuallyUsedShabbat: Set<string> = new Set(); // Track users who actually used Shabbat features
  
  constructor(private config?: StripeConfig) {
    console.log('Stripe Demo initialized', STRIPE_DEMO_MODE ? '(DEMO MODE)' : '(LIVE MODE)');
  }

  /**
   * Check if user already used their free trial
   */
  hasUsedTrial(userId: string): boolean {
    return this.usedTrials.has(userId);
  }

  /**
   * Check if user actually used Shabbat features during trial
   */
  hasActuallyUsedShabbat(userId: string): boolean {
    return this.actuallyUsedShabbat.has(userId);
  }

  /**
   * Mark user as having actually used Shabbat features
   */
  markShabbatUsed(userId: string): void {
    this.actuallyUsedShabbat.add(userId);
    console.log(`Demo: User ${userId} marked as actually used Shabbat features`);
  }

  /**
   * Reset trial status for legacy users (admin function)
   */
  resetTrialForLegacyUser(userId: string): void {
    this.usedTrials.delete(userId);
    this.actuallyUsedShabbat.delete(userId);
    console.log(`Demo: Reset trial status for legacy user ${userId}`);
  }

  /**
   * Demo: Create trial subscription with card setup
   */
  async createTrialSubscription(userId: string, email: string, planType: 'monthly' | 'annual' = 'monthly'): Promise<DemoSubscription> {
    // This function should only be called after checking hasUsedTrial in the route
    // If we reach here, user is eligible for trial

    const subscription: DemoSubscription = {
      id: `demo_sub_${Date.now()}`,
      userId,
      status: 'trial',
      planType,
      trialStartDate: new Date(),
      paymentDueDate: this.calculatePaymentDueDate(),
      cardSetup: false,
      amount: planType === 'annual' ? 10800 : 990 // $108/year or $9.90/month in cents
    };

    this.demoSubscriptions.set(userId, subscription);
    this.usedTrials.add(userId); // Mark user as having used trial
    
    console.log(`Demo: Created ${planType} trial subscription for user ${userId}`);
    return subscription;
  }

  /**
   * Demo: Setup payment method (Stripe Setup Intent)
   */
  async setupPaymentMethod(userId: string): Promise<{ clientSecret: string; setupIntentId: string }> {
    const subscription = this.demoSubscriptions.get(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    // In demo mode, return fake client secret
    const demoClientSecret = `seti_demo_${Date.now()}_secret`;
    const setupIntentId = `seti_demo_${Date.now()}`;

    subscription.cardSetup = true;
    this.demoSubscriptions.set(userId, subscription);

    console.log(`Demo: Setup payment method for user ${userId}`);
    return {
      clientSecret: demoClientSecret,
      setupIntentId
    };
  }

  /**
   * Demo: Charge customer on Tuesday after trial
   */
  async chargeCustomer(userId: string): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const subscription = this.demoSubscriptions.get(userId);
    if (!subscription) {
      return { success: false, error: 'No subscription found' };
    }

    if (!subscription.cardSetup) {
      return { success: false, error: 'No payment method setup' };
    }

    // Demo: 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      subscription.status = 'active';
      subscription.paymentDueDate = this.calculateNextBillingDate();
      this.demoSubscriptions.set(userId, subscription);
      
      console.log(`Demo: Successfully charged user ${userId} $9.90`);
      return { success: true, paymentId: `pi_demo_${Date.now()}` };
    } else {
      console.log(`Demo: Payment failed for user ${userId}`);
      return { success: false, error: 'Card declined' };
    }
  }

  /**
   * Demo: Cancel subscription before payment
   * Logic: Only keep "used trial" if user actually used Shabbat features
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    const subscription = this.demoSubscriptions.get(userId);
    if (!subscription) {
      return false;
    }

    // Remove the subscription
    this.demoSubscriptions.delete(userId);
    
    // Smart logic: Only permanently mark as "used trial" if user actually used Shabbat features
    if (!this.hasActuallyUsedShabbat(userId)) {
      // User didn't actually use Shabbat features, so they can try again
      this.usedTrials.delete(userId);
      console.log(`Demo: User ${userId} can try again - didn't use Shabbat features`);
    } else {
      // User actually used Shabbat features, so trial is consumed
      console.log(`Demo: User ${userId} cannot get another trial - already used Shabbat features`);
    }
    
    console.log(`Demo: Cancelled and removed subscription for user ${userId}`);
    return true;
  }

  /**
   * Get subscription status
   */
  getSubscription(userId: string): DemoSubscription | undefined {
    return this.demoSubscriptions.get(userId);
  }

  /**
   * Get all demo subscriptions (for admin)
   */
  getAllSubscriptions(): DemoSubscription[] {
    return Array.from(this.demoSubscriptions.values());
  }

  /**
   * Calculate payment due date (Tuesday after first Shabbat)
   */
  private calculatePaymentDueDate(): Date {
    const now = new Date();
    // Find next Tuesday
    const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7;
    const paymentDue = new Date(now);
    paymentDue.setDate(now.getDate() + daysUntilTuesday);
    paymentDue.setHours(9, 0, 0, 0); // 9 AM on Tuesday
    return paymentDue;
  }

  /**
   * Calculate next billing date (monthly)
   */
  private calculateNextBillingDate(): Date {
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    return nextBilling;
  }

  /**
   * Demo webhook handler
   */
  async handleWebhook(payload: any): Promise<{ received: boolean; processed: boolean }> {
    console.log('Demo: Received webhook', payload.type);
    
    // Demo webhook processing
    switch (payload.type) {
      case 'setup_intent.succeeded':
        console.log('Demo: Setup intent succeeded');
        break;
      case 'payment_intent.succeeded':
        console.log('Demo: Payment succeeded');
        break;
      case 'payment_intent.payment_failed':
        console.log('Demo: Payment failed');
        break;
      default:
        console.log('Demo: Unhandled webhook type');
    }

    return { received: true, processed: true };
  }
}

// Export demo instance
export const stripeDemo = new StripeDemo();

// Demo subscription status checker
export function checkTrialStatus(subscription: DemoSubscription): {
  isInTrial: boolean;
  daysRemaining: number;
  paymentDue: boolean;
} {
  const now = new Date();
  const trialEndDate = new Date(subscription.trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial

  const isInTrial = now < trialEndDate;
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const paymentDue = subscription.paymentDueDate ? now >= subscription.paymentDueDate : false;

  return {
    isInTrial,
    daysRemaining: Math.max(0, daysRemaining),
    paymentDue
  };
}