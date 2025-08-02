import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Configuração dos produtos
export const STRIPE_PRODUCTS = {
  MONTHLY: {
    name: 'Dazio Admin - Plano Mensal',
    description: 'Acesso completo ao sistema de gestão de locações',
    price: 9790, // R$ 97,90 em centavos
    interval: 'month'
  },
  ANNUAL: {
    name: 'Dazio Admin - Plano Anual',
    description: 'Acesso completo ao sistema de gestão de locações (2 meses grátis)',
    price: 97900, // R$ 979,00 em centavos
    interval: 'year'
  }
} as const;

// IDs dos produtos criados no Stripe
export const STRIPE_PRODUCT_IDS = {
  MONTHLY: 'prod_Sn2n2D1UuSgF4u',
  ANNUAL: 'prod_Sn2ndrRgXRp0rC'
} as const;

// Função para criar preços recorrentes
export async function createRecurringPrice(productId: string, amount: number, interval: 'month' | 'year') {
  return await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'brl',
    recurring: {
      interval,
    },
  });
}

// Função para criar checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });
}

// Função para criar customer portal session
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
} 