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
    console.log('🔔 Webhook recebido:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
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
    console.error('❌ Erro no webhook:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('✅ Checkout completado:', session.id);
  
  const supabase = createClient();
  
  try {
    // Buscar dados da sessão
    const { data: checkoutSession } = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer']
    });
    
    if (!checkoutSession) {
      console.error('❌ Sessão de checkout não encontrada');
      return;
    }
    
    const subscription = checkoutSession.subscription as any;
    const customer = checkoutSession.customer as any;
    
    if (!subscription || !customer) {
      console.error('❌ Dados da assinatura ou customer não encontrados');
      return;
    }
    
    console.log('🔍 Dados da assinatura:', {
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      planType: session.metadata?.plan_type
    });
    
    // Criar ou atualizar assinatura no banco
    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      plan_type: session.metadata?.plan_type || 'monthly',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      user_id: session.metadata?.user_id,
      company_id: session.metadata?.company_id,
    };
    
    // Verificar se já existe assinatura
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (existingSubscription) {
      // Atualizar assinatura existente
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
      console.log('✅ Assinatura atualizada:', existingSubscription.id);
    } else {
      // Criar nova assinatura
      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Erro ao criar assinatura:', error);
        return;
      }
      
      console.log('✅ Nova assinatura criada:', newSubscription.id);
    }
    
    // Atualizar status da empresa para 'active'
    if (session.metadata?.company_id) {
      await supabase
        .from('company_profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.metadata.company_id);
      
      console.log('✅ Status da empresa atualizado para active');
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar checkout completado:', error);
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log('🔄 Mudança na assinatura:', subscription.id);
  
  const supabase = createClient();
  
  try {
    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type: subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };

    // Buscar assinatura existente
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      // Atualizar assinatura existente
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
      
      console.log('✅ Assinatura atualizada:', existingSubscription.id);
      
      // Atualizar status da empresa se a assinatura estiver ativa
      if (subscription.status === 'active' && existingSubscription.company_id) {
        await supabase
          .from('company_profiles')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.company_id);
        
        console.log('✅ Status da empresa atualizado para active');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar mudança na assinatura:', error);
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  console.log('❌ Assinatura cancelada:', subscription.id);
  
  const supabase = createClient();
  
  try {
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    console.log('✅ Status da assinatura atualizado para canceled');
    
    // Buscar company_id da assinatura cancelada
    const { data: canceledSubscription } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (canceledSubscription?.company_id) {
      // Atualizar status da empresa para 'cancelled'
      await supabase
        .from('company_profiles')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', canceledSubscription.company_id);
      
      console.log('✅ Status da empresa atualizado para cancelled');
    }
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento da assinatura:', error);
  }
}

async function handlePaymentSuccess(invoice: any) {
  console.log('💰 Pagamento realizado com sucesso:', invoice.id);
  
  const supabase = createClient();
  
  try {
    if (invoice.subscription) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, company_id')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (subscription) {
        // Registrar pagamento
        await supabase
          .from('subscription_payments')
          .insert({
            subscription_id: subscription.id,
            company_id: subscription.company_id,
            stripe_payment_intent_id: invoice.payment_intent,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            payment_method: invoice.payment_method_types?.[0],
          });
        
        console.log('✅ Pagamento registrado com sucesso');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar pagamento bem-sucedido:', error);
  }
}

async function handlePaymentFailure(invoice: any) {
  console.log('❌ Falha no pagamento:', invoice.id);
  
  const supabase = createClient();
  
  try {
    if (invoice.subscription) {
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription);
      
      console.log('✅ Status da assinatura atualizado para past_due');
    }
  } catch (error) {
    console.error('❌ Erro ao processar falha no pagamento:', error);
  }
}

async function handleTrialEnding(subscription: any) {
  console.log('⏰ Trial terminando para assinatura:', subscription.id);
  
  const supabase = createClient();
  
  try {
    // Atualizar status da assinatura
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    console.log('✅ Status da assinatura atualizado para active após trial');
    
    // Buscar company_id da assinatura
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (subscriptionData?.company_id) {
      // Atualizar status da empresa para 'active'
      await supabase
        .from('company_profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionData.company_id);
      
      console.log('✅ Status da empresa atualizado para active após trial');
    }
  } catch (error) {
    console.error('❌ Erro ao processar fim do trial:', error);
  }
} 