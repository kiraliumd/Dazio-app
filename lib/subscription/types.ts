export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  stripe_price_id?: string;
}

export interface CreateSubscriptionRequest {
  planType: 'monthly' | 'annual';
}

export interface CreateSubscriptionResponse {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  error?: string;
}

export interface CustomerPortalResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface SubscriptionDashboardProps {
  subscription: Subscription;
}

export interface SubscriptionCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  planType: 'monthly' | 'annual';
  popular?: boolean;
  savings?: string;
}
