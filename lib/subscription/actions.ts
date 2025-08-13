'use server';

import { stripe, createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from './types';

export async function createSubscription(planType: 'monthly' | 'annual'): Promise<CreateSubscriptionResponse> {
  console.log('🔄 createSubscription: Iniciando...', { planType });
  
  try {
    const supabase = await createClient();
    console.log('✅ createSubscription: Cliente Supabase criado');
    
    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 createSubscription: Verificando usuário...', { user: user?.email, authError });
    
    if (authError || !user) {
      console.error('❌ createSubscription: Usuário não autenticado', { authError });
      throw new Error('Usuário não autenticado');
    }

    // Buscar company_id do usuário
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!companyProfile) {
      console.error('❌ createSubscription: Perfil da empresa não encontrado');
      throw new Error('Perfil da empresa não encontrado');
    }

    // Verificar se já existe assinatura ativa
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyProfile.id)
      .in('status', ['active', 'trialing'])
      .single();

    console.log('🔍 createSubscription: Verificando assinatura existente...', { 
      existingSubscription, 
      subscriptionError,
      companyId: companyProfile.id 
    });

    // Se já existe assinatura ativa, permitir upgrade/downgrade
    if (existingSubscription && !subscriptionError) {
      console.log('⚠️ createSubscription: Assinatura existente encontrada, permitindo upgrade/downgrade');
      // Não bloquear, permitir continuar para upgrade/downgrade
    }

    // Buscar ou criar customer no Stripe
    let customerId = existingSubscription?.stripe_customer_id;
    
    if (!customerId) {
      console.log('🔄 createSubscription: Criando customer no Stripe...');
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          company_id: companyProfile.id,
        },
      });
      customerId = customer.id;
      console.log('✅ createSubscription: Customer criado', { customerId });
    }

    // Criar checkout session usando os IDs corretos dos produtos existentes
    let priceId = planType === 'monthly'
      ? 'price_1RrSTcGhdKZwP7W0Yn1n3FRB'  // Preço mensal existente
      : null; // Preço anual será criado automaticamente

    console.log('🔍 createSubscription: Verificando priceId...', { priceId, planType });

    // Se for plano anual, criar produto e preço automaticamente
    if (planType === 'annual') {
      console.log('🔄 createSubscription: Criando produto e preço anual automaticamente...');
      
      try {
        // Criar produto anual
        const annualProduct = await stripe.products.create({
          name: 'Dazio Admin - Plano Anual (Recorrente)',
          description: 'Acesso completo ao sistema de gestão de locações Dazio Admin - Assinatura Anual (2 meses grátis)',
        });
        
        console.log('✅ createSubscription: Produto anual criado:', annualProduct.id);
        
        // Criar preço anual recorrente
        const annualPrice = await stripe.prices.create({
          product: annualProduct.id,
          unit_amount: 97900, // R$ 979,00 em centavos
          currency: 'brl',
          recurring: {
            interval: 'year',
          },
        });
        
        console.log('✅ createSubscription: Preço anual criado:', annualPrice.id);
        priceId = annualPrice.id;
        
      } catch (createError) {
        console.error('❌ createSubscription: Erro ao criar produto/preço anual:', createError);
        return {
          success: false,
          error: `Erro ao criar produto anual: ${createError instanceof Error ? createError.message : 'Erro desconhecido'}`,
        };
      }
    }

    if (!priceId) {
      console.error('❌ createSubscription: ID do preço não configurado');
      return { success: false, error: 'ID do preço não configurado' };
    }

    // Verificar se o preço mensal existe e é válido (apenas para debug)
    if (planType === 'monthly') {
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log('✅ createSubscription: Preço mensal verificado:', {
          id: price.id,
          type: price.type,
          recurring: price.recurring,
          unit_amount: price.unit_amount,
          currency: price.currency,
          product: price.product
        });
      } catch (priceError) {
        console.error('❌ createSubscription: Erro ao verificar preço mensal:', priceError);
        return {
          success: false,
          error: `Erro com preço mensal: ${priceError instanceof Error ? priceError.message : 'Erro desconhecido'}`,
        };
      }
    }

    console.log('🔄 createSubscription: Criando checkout session...');
    const session = await createCheckoutSession({
      priceId,
      customerId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/cancel`,
      metadata: {
        user_id: user.id,
        company_id: companyProfile.id,
        plan_type: planType,
      },
    });

    console.log('✅ createSubscription: Checkout session criada', { sessionId: session.id, url: session.url });

    return {
      success: true,
      checkoutUrl: session.url!,
    };
  } catch (error) {
    console.error('❌ createSubscription: Erro ao criar assinatura:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function getSubscription() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // Buscar company_id do usuário
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!companyProfile) {
      return null;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyProfile.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();

    return subscription;
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return null;
  }
}

export async function cancelSubscription() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription?.stripe_subscription_id) {
      throw new Error('Assinatura não encontrada');
    }

    // Cancelar no Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Atualizar no banco
    await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    revalidatePath('/assinatura/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function getCustomerPortalUrl() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error('Customer não encontrado');
    }

    const session = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/dashboard`
    );

    return { success: true, url: session.url };
  } catch (error) {
    console.error('Erro ao gerar URL do portal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
} 