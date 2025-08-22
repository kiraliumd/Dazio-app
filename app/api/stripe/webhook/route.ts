import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Tipos específicos para objetos do Stripe
interface StripeSession {
  id: string;
  metadata?: {
    company_id?: string;
  } | null;
}

interface StripeSubscription {
  id: string;
  status: string;
  customer?: string | { id: string } | null;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
        recurring?: {
          interval?: string;
        };
      };
    }>;
  };
  current_period_start?: number;
  current_period_end?: number;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: {
    company_id?: string;
    user_id?: string;
  };
}

interface StripeCustomer {
  id: string;
}

interface StripeInvoice {
  subscription?: string;
  metadata?: {
    company_id?: string;
  };
}

export async function POST(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  const body = await request.text();

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Webhook: STRIPE_WEBHOOK_SECRET não configurado');
      return NextResponse.json(
        { error: 'Webhook secret não configurado' },
        { status: 400 }
      );
    }

    const signature = headers['stripe-signature'];
    if (!signature) {
      console.error('❌ Webhook: Assinatura Stripe não encontrada');
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Processar evento baseado no tipo
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as StripeSession);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionChange(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(
          event.data.object as StripeSubscription
        );
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as StripeInvoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object as StripeInvoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event.data.object as StripeSubscription);
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

async function handleCheckoutCompleted(session: StripeSession) {
  try {
    const supabase = await createAdminClient();

    // Buscar dados da sessão no Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer'],
    });

    if (!stripeSession.subscription || !stripeSession.customer) {
      console.error('❌ handleCheckoutCompleted: Dados da sessão incompletos');
      return;
    }

    const subscription = stripeSession.subscription as StripeSubscription;
    const customer = stripeSession.customer as StripeCustomer;

    // Extrair dados específicos da assinatura
    const subscriptionItem = subscription.items?.data?.[0];

    // Preparar dados para inserção
    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      price_id: subscriptionItem?.price?.id || null,
      status: subscription.status,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
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
        console.error(
          '❌ handleCheckoutCompleted: Erro ao atualizar assinatura:',
          updateError
        );
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
        console.error(
          '❌ handleCheckoutCompleted: Erro ao criar assinatura:',
          insertError
        );
        return;
      }
    }

    // Atualizar status da empresa para 'active'
    if (session.metadata?.company_id) {
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.metadata.company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handleCheckoutCompleted: Erro ao atualizar empresa:',
          companyUpdateError
        );
        return;
      }
    }
  } catch (error) {
    console.error(
      '❌ handleCheckoutCompleted: Erro ao processar checkout completado:',
      error
    );
  }
}

async function handleSubscriptionChange(subscription: StripeSubscription) {
  try {
    const supabase = await createAdminClient();

    // Buscar a sessão mais recente para obter company_id
    let company_id: string | undefined;

    // Tentar obter company_id da sessão mais recente
    const { data: latestSessions } = await supabase
      .from('stripe_sessions')
      .select('metadata')
      .eq('stripe_subscription_id', subscription.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (latestSessions && latestSessions.length > 0) {
      company_id = latestSessions[0].metadata?.company_id;
    }

    // Se não encontrou na sessão, tentar na assinatura
    if (!company_id) {
      company_id = subscription.metadata?.company_id;
    }

    // Verificar se temos os dados necessários
    if (!company_id) {
      console.error('❌ handleSubscriptionChange: company_id não encontrado');
      return;
    }

    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type:
        subscription.items?.data?.[0]?.price?.recurring?.interval === 'year'
          ? 'annual'
          : 'monthly',
      status: subscription.status,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      user_id: subscription.metadata?.user_id, // Assuming user_id is in metadata
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
        console.error(
          '❌ handleSubscriptionChange: Erro ao atualizar assinatura:',
          updateError
        );
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
          console.error(
            '❌ handleSubscriptionChange: Erro ao criar assinatura:',
            insertError
          );
          return;
        }
      } catch (insertException) {
        console.error(
          '❌ handleSubscriptionChange: Exceção ao inserir assinatura:',
          insertException
        );
        return;
      }
    }

    // Atualizar status da empresa se a assinatura estiver ativa
    if (subscription.status === 'active' && company_id) {
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handleSubscriptionChange: Erro ao atualizar empresa:',
          companyUpdateError
        );
        return;
      }
    }
  } catch (error) {
    console.error(
      '❌ handleSubscriptionChange: Erro ao processar mudança na assinatura:',
      error
    );
  }
}

async function handleSubscriptionCancellation(
  subscription: StripeSubscription
) {
  try {
    const supabase = await createAdminClient();

    // Buscar company_id da assinatura cancelada
    const { data: canceledSubscription } = await supabase
      .from('stripe_subscriptions')
      .select('company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (canceledSubscription?.company_id) {
      // Atualizar status da empresa para 'cancelled'
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({ status: 'cancelled' })
        .eq('id', canceledSubscription.company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handleSubscriptionCancellation: Erro ao atualizar empresa:',
          companyUpdateError
        );
      }
    }
  } catch (error) {
    console.error('❌ handleSubscriptionCancellation: Erro:', error);
  }
}

async function handlePaymentSuccess(invoice: StripeInvoice) {
  try {
    const supabase = await createAdminClient();

    if (!invoice.subscription) {
      console.error('❌ handlePaymentSuccess: Invoice sem subscription');
      return;
    }

    // Buscar dados da assinatura
    const { data: subscription } = await supabase
      .from('stripe_subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription?.company_id) {
      // Atualizar status da empresa para 'active'
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({ status: 'active' })
        .eq('id', subscription.company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handlePaymentSuccess: Erro ao atualizar empresa:',
          companyUpdateError
        );
      }
    }
  } catch (error) {
    console.error('❌ handlePaymentSuccess: Erro:', error);
  }
}

async function handlePaymentFailure(invoice: StripeInvoice) {
  try {
    const supabase = await createAdminClient();

    if (!invoice.subscription) {
      console.error('❌ handlePaymentFailure: Invoice sem subscription');
      return;
    }

    // Buscar dados da assinatura
    const { data: subscription } = await supabase
      .from('stripe_subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (subscription?.company_id) {
      // Atualizar status da empresa para 'past_due'
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({ status: 'past_due' })
        .eq('id', subscription.company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handlePaymentFailure: Erro ao atualizar empresa:',
          companyUpdateError
        );
      }
    }
  } catch (error) {
    console.error('❌ handlePaymentFailure: Erro:', error);
  }
}

async function handleTrialEnding(subscription: StripeSubscription) {
  try {
    const supabase = await createAdminClient();

    // Buscar company_id da assinatura
    const { data: subscriptionData } = await supabase
      .from('stripe_subscriptions')
      .select('company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionData?.company_id) {
      // Atualizar status da empresa para 'trial_ending'
      const { error: companyUpdateError } = await supabase
        .from('company_profiles')
        .update({ status: 'trial_ending' })
        .eq('id', subscriptionData.company_id);

      if (companyUpdateError) {
        console.error(
          '❌ handleTrialEnding: Erro ao atualizar empresa:',
          companyUpdateError
        );
      }
    }
  } catch (error) {
    console.error('❌ handleTrialEnding: Erro:', error);
  }
}
