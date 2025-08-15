import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  console.log('🔔 Webhook: Requisição recebida');
  console.log('🔔 Webhook: URL:', req.url);
  console.log('🔔 Webhook: Método:', req.method);
  
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;
  
  console.log('🔔 Webhook: Headers recebidos:', {
    'stripe-signature': signature ? 'Presente' : 'Ausente',
    'content-type': headersList.get('content-type'),
    'user-agent': headersList.get('user-agent'),
    'host': headersList.get('host'),
    'origin': headersList.get('origin')
  });
  
  console.log('🔔 Webhook: Body recebido (primeiros 500 chars):', body.substring(0, 500));
  
  let event;
  
  try {
    console.log('🔔 Webhook: Verificando assinatura...');
    console.log('🔔 Webhook: STRIPE_WEBHOOK_SECRET configurado:', !!process.env.STRIPE_WEBHOOK_SECRET);
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('🔔 Webhook: Assinatura verificada com sucesso');
  } catch (err) {
    console.error('❌ Webhook: Falha na verificação da assinatura:', err);
    console.error('❌ Webhook: Erro completo:', JSON.stringify(err, null, 2));
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, { status: 400 });
  }

  const supabase = await createClient();

  try {
    console.log('🔔 Webhook: Processando evento:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      object: event.object,
      data: event.data ? 'Presente' : 'Ausente'
    });
    
    // Log detalhado do evento
    console.log('🔔 Webhook: Dados do evento:', JSON.stringify(event.data, null, 2));
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔔 Webhook: Evento checkout.session.completed detectado');
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        console.log('🔔 Webhook: Evento customer.subscription.created detectado');
        await handleSubscriptionChange(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        console.log('🔔 Webhook: Evento customer.subscription.updated detectado');
        await handleSubscriptionChange(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        console.log('🔔 Webhook: Evento customer.subscription.deleted detectado');
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('🔔 Webhook: Evento invoice.payment_succeeded detectado');
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        console.log('🔔 Webhook: Evento invoice.payment_failed detectado');
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'customer.subscription.trial_will_end':
        console.log('🔔 Webhook: Evento customer.subscription.trial_will_end detectado');
        await handleTrialEnding(event.data.object);
        break;
        
      default:
        console.log('🔔 Webhook: Evento não tratado:', event.type);
        console.log('🔔 Webhook: Eventos disponíveis:', [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
          'customer.subscription.trial_will_end'
        ]);
    }

    console.log('🔔 Webhook: Evento processado com sucesso');
    return new Response(JSON.stringify({ 
      received: true, 
      event_type: event.type,
      event_id: event.id 
    }), { status: 200 });
  } catch (error) {
    console.error('❌ Webhook: Erro ao processar evento:', error);
    console.error('❌ Webhook: Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('✅ handleCheckoutCompleted: Iniciando processamento');
  console.log('✅ handleCheckoutCompleted: Session ID:', session.id);
  console.log('✅ handleCheckoutCompleted: Session metadata:', session.metadata);
  console.log('✅ handleCheckoutCompleted: Session completa:', JSON.stringify(session, null, 2));
  
  const supabase = await createClient();
  
  try {
    console.log('✅ handleCheckoutCompleted: Buscando dados da sessão no Stripe...');
    
    // Buscar dados da sessão com expansão
    const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer']
    });
    
    console.log('✅ handleCheckoutCompleted: Dados da sessão recuperados:', {
      id: checkoutSession?.id,
      hasSubscription: !!checkoutSession?.subscription,
      hasCustomer: !!checkoutSession?.customer,
      mode: checkoutSession?.mode,
      paymentStatus: checkoutSession?.payment_status,
      subscriptionId: checkoutSession?.subscription ? (checkoutSession.subscription as any).id : 'N/A',
      customerId: checkoutSession?.customer ? (checkoutSession.customer as any).id : 'N/A'
    });
    
    if (!checkoutSession) {
      console.error('❌ handleCheckoutCompleted: Sessão de checkout não encontrada');
      return;
    }
    
    // Extrair subscription e customer
    let subscription: any;
    let customer: any;
    
    if (checkoutSession.subscription && typeof checkoutSession.subscription === 'object') {
      subscription = checkoutSession.subscription;
    } else if (checkoutSession.subscription && typeof checkoutSession.subscription === 'string') {
      // Se subscription é string, buscar os dados completos
      console.log('✅ handleCheckoutCompleted: Buscando dados da assinatura...');
      subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription);
    }
    
    if (checkoutSession.customer && typeof checkoutSession.customer === 'object') {
      customer = checkoutSession.customer;
    } else if (checkoutSession.customer && typeof checkoutSession.customer === 'string') {
      // Se customer é string, buscar os dados completos
      console.log('✅ handleCheckoutCompleted: Buscando dados do customer...');
      customer = await stripe.customers.retrieve(checkoutSession.customer);
    }
    
    console.log('✅ handleCheckoutCompleted: Dados extraídos:', {
      subscriptionId: subscription?.id,
      customerId: customer?.id,
      subscriptionStatus: subscription?.status,
      planType: session.metadata?.plan_type,
      subscriptionObject: subscription ? 'Presente' : 'Ausente',
      customerObject: customer ? 'Presente' : 'Ausente'
    });
    
    if (!subscription || !customer) {
      console.error('❌ handleCheckoutCompleted: Dados da assinatura ou customer não encontrados');
      console.error('❌ handleCheckoutCompleted: Subscription:', subscription);
      console.error('❌ handleCheckoutCompleted: Customer:', customer);
      return;
    }
    
    console.log('🔍 handleCheckoutCompleted: Dados da assinatura:', {
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      planType: session.metadata?.plan_type,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      trialEnd: subscription.trial_end
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
    
    console.log('✅ handleCheckoutCompleted: Dados da assinatura preparados:', subscriptionData);
    
    // Verificar se já existe assinatura
    console.log('✅ handleCheckoutCompleted: Verificando se já existe assinatura no banco...');
    const { data: existingSubscription, error: selectError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    console.log('✅ handleCheckoutCompleted: Resultado da busca:', {
      existingSubscription,
      selectError
    });
    
    if (existingSubscription) {
      // Atualizar assinatura existente
      console.log('✅ handleCheckoutCompleted: Atualizando assinatura existente...');
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
      
      if (updateError) {
        console.error('❌ handleCheckoutCompleted: Erro ao atualizar assinatura:', updateError);
        return;
      }
      
      console.log('✅ handleCheckoutCompleted: Assinatura atualizada:', existingSubscription.id);
    } else {
      // Criar nova assinatura
      console.log('✅ handleCheckoutCompleted: Criando nova assinatura...');
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ handleCheckoutCompleted: Erro ao criar assinatura:', insertError);
        console.error('❌ handleCheckoutCompleted: Dados tentados:', subscriptionData);
        return;
      }
      
      console.log('✅ handleCheckoutCompleted: Nova assinatura criada:', newSubscription.id);
    }
    
    // Atualizar status da empresa para 'active'
    if (session.metadata?.company_id) {
      console.log('✅ handleCheckoutCompleted: Atualizando status da empresa...');
      console.log('✅ handleCheckoutCompleted: Company ID:', session.metadata.company_id);
      
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
      
      console.log('✅ handleCheckoutCompleted: Status da empresa atualizado para active');
    } else {
      console.log('⚠️ handleCheckoutCompleted: company_id não encontrado no metadata');
      console.log('⚠️ handleCheckoutCompleted: Metadata completo:', session.metadata);
    }
    
    console.log('✅ handleCheckoutCompleted: Processamento concluído com sucesso');
    
  } catch (error) {
    console.error('❌ handleCheckoutCompleted: Erro ao processar checkout completado:', error);
    console.error('❌ handleCheckoutCompleted: Stack trace:', error instanceof Error ? error.stack : 'N/A');
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log('🔄 handleSubscriptionChange: Mudança na assinatura:', subscription.id);
  console.log('🔄 handleSubscriptionChange: Subscription completa:', JSON.stringify(subscription, null, 2));
  
  const supabase = await createClient();
  
  try {
    // Se é uma nova assinatura (customer.subscription.created), buscar metadados da sessão
    let user_id: string | undefined;
    let company_id: string | undefined;
    
    if (subscription.status === 'active' && !subscription.metadata?.user_id) {
      console.log('🔄 handleSubscriptionChange: Nova assinatura detectada, buscando metadados da sessão...');
      
      try {
        // Buscar a sessão de checkout mais recente para este customer
        const sessions = await stripe.checkout.sessions.list({
          customer: subscription.customer,
          limit: 1,
          status: 'complete'
        });
        
        if (sessions.data.length > 0) {
          const latestSession = sessions.data[0];
          console.log('🔄 handleSubscriptionChange: Sessão encontrada:', {
            sessionId: latestSession.id,
            metadata: latestSession.metadata
          });
          
          user_id = latestSession.metadata?.user_id;
          company_id = latestSession.metadata?.company_id;
          
          console.log('🔄 handleSubscriptionChange: Metadados extraídos:', { user_id, company_id });
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
      console.error('❌ handleSubscriptionChange: user_id ou company_id não encontrados:', { user_id, company_id });
      return;
    }

    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type: subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      user_id: user_id,
      company_id: company_id,
      updated_at: new Date().toISOString(),
    };

    console.log('🔄 handleSubscriptionChange: Dados da assinatura preparados:', subscriptionData);

    // Buscar assinatura existente
    const { data: existingSubscription, error: selectError } = await supabase
      .from('subscriptions')
      .select('id, company_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    console.log('🔄 handleSubscriptionChange: Resultado da busca:', {
      existingSubscription,
      selectError
    });

    if (existingSubscription) {
      // Atualizar assinatura existente
      console.log('🔄 handleSubscriptionChange: Atualizando assinatura existente...');
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('❌ handleSubscriptionChange: Erro ao atualizar assinatura:', updateError);
        console.error('❌ handleSubscriptionChange: Dados tentados:', subscriptionData);
        return;
      }

      console.log('✅ handleSubscriptionChange: Assinatura atualizada:', existingSubscription.id);
    } else {
      // Criar nova assinatura
      console.log('🔄 handleSubscriptionChange: Criando nova assinatura...');
      
      try {
        const { data: newSubscription, error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ handleSubscriptionChange: Erro ao criar assinatura:', insertError);
          console.error('❌ handleSubscriptionChange: Dados tentados:', subscriptionData);
          return;
        }

        console.log('✅ handleSubscriptionChange: Nova assinatura criada:', newSubscription.id);
      } catch (insertException) {
        console.error('❌ handleSubscriptionChange: Exceção ao inserir assinatura:', insertException);
        console.error('❌ handleSubscriptionChange: Dados tentados:', subscriptionData);
        return;
      }
    }

    // Atualizar status da empresa se a assinatura estiver ativa
    if (subscription.status === 'active' && company_id) {
      console.log('🔄 handleSubscriptionChange: Atualizando status da empresa...');
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

      console.log('✅ handleSubscriptionChange: Status da empresa atualizado para active');
    } else {
      console.log('⚠️ handleSubscriptionChange: Não foi possível atualizar empresa:', {
        status: subscription.status,
        company_id: company_id
      });
    }
    
    console.log('✅ handleSubscriptionChange: Processamento concluído com sucesso');
    
  } catch (error) {
    console.error('❌ handleSubscriptionChange: Erro ao processar mudança na assinatura:', error);
    console.error('❌ handleSubscriptionChange: Stack trace:', error instanceof Error ? error.stack : 'N/A');
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
  console.log('💰 handlePaymentSuccess: Pagamento realizado com sucesso:', invoice.id);

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

        console.log('✅ handlePaymentSuccess: Pagamento registrado com sucesso');
      }
    }
  } catch (error) {
    console.error('❌ handlePaymentSuccess: Erro ao processar pagamento bem-sucedido:', error);
  }
}

async function handlePaymentFailure(invoice: any) {
  console.log('❌ handlePaymentFailure: Falha no pagamento:', invoice.id);

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

      console.log('✅ handlePaymentFailure: Status da assinatura atualizado para past_due');
    }
  } catch (error) {
    console.error('❌ handlePaymentFailure: Erro ao processar falha no pagamento:', error);
  }
}

async function handleTrialEnding(subscription: any) {
  console.log('⏰ handleTrialEnding: Trial terminando para assinatura:', subscription.id);

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

    console.log('✅ handleTrialEnding: Status da assinatura atualizado para active após trial');

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

      console.log('✅ handleTrialEnding: Status da empresa atualizado para active após trial');
    }
  } catch (error) {
    console.error('❌ handleTrialEnding: Erro ao processar fim do trial:', error);
  }
} 