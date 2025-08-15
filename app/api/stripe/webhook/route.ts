import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  const body = await request.text();

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Webhook: STRIPE_WEBHOOK_SECRET não configurado');
      return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 400 });
    }

    const signature = headers['stripe-signature'];
    if (!signature) {
      console.error('❌ Webhook: Assinatura Stripe não encontrada');
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Processar evento baseado no tipo
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionChange(event.data.object);
        break;
        
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
        
      default:
        console.log('🔔 Webhook: Evento não tratado:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook: Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    const supabase = await createAdminClient();

    // Buscar dados da sessão no Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer']
    });

    if (!stripeSession.subscription || !stripeSession.customer) {
      console.error('❌ handleCheckoutCompleted: Dados da sessão incompletos');
      return;
    }

    const subscription = stripeSession.subscription;
    const customer = stripeSession.customer;

    // Extrair dados específicos da assinatura
    const subscriptionItem = (subscription as any).items?.data?.[0];

    // Preparar dados para inserção
    const subscriptionData = {
      stripe_subscription_id: (subscription as any).id,
      stripe_customer_id: (customer as any).id,
      plan_type: subscriptionItem?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: (subscription as any).status,
      current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
      current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
      trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      user_id: session.metadata?.user_id,
      company_id: session.metadata?.company_id,
    };

    // Verificar se já existe assinatura
    const { data: existingSubscription, error: selectError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      // Atualizar assinatura existente
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
      
      if (updateError) {
        console.error('❌ handleCheckoutCompleted: Erro ao atualizar assinatura:', updateError);
        return;
      }
    } else {
      // Criar nova assinatura
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ handleCheckoutCompleted: Erro ao criar assinatura:', insertError);
        return;
      }
    }

    // Atualizar status da empresa para 'active'
    if (session.metadata?.company_id) {
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.metadata.company_id);
      
      if (companyUpdateError) {
        console.error('❌ handleCheckoutCompleted: Erro ao atualizar empresa:', companyUpdateError);
        return;
      }
    }
    
  } catch (error) {
    console.error('❌ handleCheckoutCompleted: Erro ao processar checkout completado:', error);
  }
}

async function handleSubscriptionChange(subscription: any) {
  const supabase = await createAdminClient();
  
  try {
    // Se é uma nova assinatura (customer.subscription.created), buscar metadados da sessão
    let user_id: string | undefined;
    let company_id: string | undefined;
    
    if (subscription.status === 'active' && !subscription.metadata?.user_id) {
      try {
        // Buscar a sessão de checkout mais recente para este customer
        const sessions = await stripe.checkout.sessions.list({
          customer: subscription.customer,
          limit: 1,
          status: 'complete'
        });
        
        if (sessions.data.length > 0) {
          const latestSession = sessions.data[0];
          user_id = latestSession.metadata?.user_id;
          company_id = latestSession.metadata?.company_id;
        }
      } catch (sessionError) {
        console.error('❌ handleSubscriptionChange: Erro ao buscar sessão:', sessionError);
      }
    } else {
      user_id = subscription.metadata?.user_id;
      company_id = subscription.metadata?.company_id;
    }

    // Validar se temos os dados necessários
    if (!user_id || !company_id) {
      console.error('❌ handleSubscriptionChange: user_id ou company_id não encontrados');
      return;
    }

    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type: subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: subscription.status,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      user_id: user_id,
      company_id: company_id,
      updated_at: new Date().toISOString(),
    };

    // Buscar assinatura existente
    const { data: existingSubscription, error: selectError } = await supabase
      .from('subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existingSubscription) {
      // Atualizar assinatura existente
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('❌ handleSubscriptionChange: Erro ao atualizar assinatura:', updateError);
        return;
      }
    } else {
      // Criar nova assinatura
      try {
        const { data: newSubscription, error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ handleSubscriptionChange: Erro ao criar assinatura:', insertError);
          return;
        }
      } catch (insertException) {
        console.error('❌ handleSubscriptionChange: Exceção ao inserir assinatura:', insertException);
        return;
      }
    }

    // Atualizar status da empresa se a assinatura estiver ativa
    if (subscription.status === 'active' && company_id) {
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', company_id);

      if (companyUpdateError) {
        console.error('❌ handleSubscriptionChange: Erro ao atualizar empresa:', companyUpdateError);
        return;
      }
    }
    
  } catch (error) {
    console.error('❌ handleSubscriptionChange: Erro ao processar mudança na assinatura:', error);
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  console.log('❌ handleSubscriptionCancellation: Assinatura cancelada:', subscription.id);

  const supabase = await createClient();

  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log('✅ handleSubscriptionCancellation: Status da assinatura atualizado para canceled');

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

      console.log('✅ handleSubscriptionCancellation: Status da empresa atualizado para cancelled');
    }
  } catch (error) {
    console.error('❌ handleSubscriptionCancellation: Erro ao processar cancelamento da assinatura:', error);
  }
}

async function handlePaymentSuccess(invoice: any) {
  const supabase = await createClient();

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
      }
    }
  } catch (error) {
    console.error('❌ handlePaymentSuccess: Erro ao processar pagamento bem-sucedido:', error);
  }
}

async function handlePaymentFailure(invoice: any) {
  const supabase = await createClient();

  try {
    if (invoice.subscription) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription);
    }
  } catch (error) {
    console.error('❌ handlePaymentFailure: Erro ao processar falha no pagamento:', error);
  }
}

async function handleTrialEnding(subscription: any) {
  const supabase = await createClient();

  try {
    // Atualizar status da assinatura
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

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
    }
  } catch (error) {
    console.error('❌ handleTrialEnding: Erro ao processar fim do trial:', error);
  }
} 