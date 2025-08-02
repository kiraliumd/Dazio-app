import { NextRequest, NextResponse } from 'next/server';
import { stripe, createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType } = body;

    console.log('🔄 Stripe Test API: Recebida requisição', { planType });

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }

    // Obter o ID do preço baseado no tipo de plano
    const priceId = planType === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_ANNUAL_PRICE_ID;

    console.log('🔍 Stripe Test API: Verificando priceId...', { priceId, planType });

    if (!priceId) {
      throw new Error('ID do preço não configurado');
    }

    // Criar um customer temporário para teste
    console.log('🔄 Stripe Test API: Criando customer temporário...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      metadata: {
        test: 'true',
        planType,
      },
    });

    console.log('✅ Stripe Test API: Customer criado', { customerId: customer.id });

    // Criar checkout session
    console.log('🔄 Stripe Test API: Criando checkout session...');
    const session = await createCheckoutSession({
      priceId,
      customerId: customer.id,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/cancel`,
    });

    console.log('✅ Stripe Test API: Checkout session criada', { sessionId: session.id, url: session.url });

    const response = {
      success: true,
      message: 'Checkout session criada com sucesso',
      planType,
      customerId: customer.id,
      sessionId: session.id,
      checkoutUrl: session.url,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Stripe Test API: Enviando resposta', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Stripe Test API: Erro', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 