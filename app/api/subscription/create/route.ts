import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 API: Iniciando criação de assinatura');
    
    const { planType } = await req.json();
    console.log('🔍 API: Tipo de plano recebido:', planType);
    
    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de plano inválido' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    console.log('✅ API: Cliente Supabase criado');
    
    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 API: Verificando usuário...', { user: user?.email, authError });
    
    if (authError || !user) {
      console.error('❌ API: Usuário não autenticado', { authError });
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      }, { status: 401 });
    }

    // Buscar company_id do usuário
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!companyProfile) {
      console.error('❌ API: Perfil da empresa não encontrado');
      return NextResponse.json({ 
        success: false, 
        error: 'Perfil da empresa não encontrado' 
      }, { status: 404 });
    }

    // Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyProfile.id)
      .in('status', ['active', 'trialing'])
      .single();

    console.log('🔍 API: Verificando assinatura existente...', { existingSubscription });

    if (existingSubscription) {
      console.error('❌ API: Usuário já possui assinatura ativa');
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário já possui uma assinatura ativa' 
      }, { status: 400 });
    }

    // Buscar ou criar customer no Stripe
    let customerId = existingSubscription?.stripe_customer_id;
    
    if (!customerId) {
      console.log('🔄 API: Criando customer no Stripe...');
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          company_id: companyProfile.id,
        },
      });
      customerId = customer.id;
      console.log('✅ API: Customer criado', { customerId });
    }

    // Criar checkout session usando os IDs corretos
    const priceId = planType === 'monthly' 
      ? 'price_1RrShwGhdKZwP7W0UWeDLuGz'  // Preço mensal existente
      : 'price_1RrSiHGhdKZwP7W0DOlZu37g'; // Preço anual existente

    console.log('🔍 API: Verificando priceId...', { priceId, planType });

    if (!priceId) {
      console.error('❌ API: ID do preço não configurado');
      return NextResponse.json({ 
        success: false, 
        error: 'ID do preço não configurado' 
      }, { status: 500 });
    }

    // Verificar se o preço existe no Stripe
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log('✅ API: Preço verificado no Stripe:', {
        id: price.id,
        type: price.type,
        recurring: price.recurring,
        unit_amount: price.unit_amount,
        currency: price.currency
      });
    } catch (priceError) {
      console.error('❌ API: Erro ao verificar preço no Stripe:', priceError);
      return NextResponse.json({ 
        success: false, 
        error: `Preço não encontrado no Stripe: ${priceError.message}` 
      }, { status: 500 });
    }

    console.log('🔄 API: Criando checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/cancel`,
      metadata: {
        user_id: user.id,
        company_id: companyProfile.id,
        plan_type: planType,
      },
    });

    console.log('✅ API: Checkout session criada', { sessionId: session.id, url: session.url });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
    
  } catch (error) {
    console.error('❌ API: Erro ao criar assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
