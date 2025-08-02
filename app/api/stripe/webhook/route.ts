import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event.data.object);
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleSubscriptionChange(subscription: any) {
  const supabase = createClient();
  
  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    plan_type: subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly',
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  // Buscar user_id pelo customer_id
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (existingSubscription) {
    await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', existingSubscription.user_id);
  } else {
    // Se não existe, criar nova assinatura
    await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        user_id: subscription.metadata.user_id,
      });
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  const supabase = createClient();
  
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      cancel_at_period_end: true 
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSuccess(invoice: any) {
  const supabase = createClient();
  
  if (invoice.subscription) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription) {
      await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          stripe_payment_intent_id: invoice.payment_intent,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          payment_method: invoice.payment_method_types?.[0],
        });
    }
  }
}

async function handlePaymentFailure(invoice: any) {
  const supabase = createClient();
  
  if (invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription);
  }
}

async function handleTrialEnding(subscription: any) {
  // Enviar notificação ao usuário sobre o fim do período de teste
  console.log('Trial ending for subscription:', subscription.id);
} 