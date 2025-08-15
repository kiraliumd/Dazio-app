import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 GET /api/subscription/portal: Debug endpoint');
    
    const supabase = await createClient();
    
    // Verificar estrutura da tabela subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(10);
    
    if (subError) {
      console.error('❌ Erro ao buscar assinaturas:', subError);
      return NextResponse.json({ error: 'Erro ao buscar assinaturas', details: subError }, { status: 500 });
    }
    
    // Verificar estrutura da tabela users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, company_id')
      .limit(5);
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        subscriptions: subscriptions || [],
        users: users || [],
        subscriptionCount: subscriptions?.length || 0,
        userCount: users?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no debug endpoint:', error);
    return NextResponse.json({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🚀 POST /api/subscription/portal: Iniciando...');
    
    const supabase = await createClient();
    console.log('✅ Supabase client criado');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Auth check:', { user: user?.id, authError });
    
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar assinatura do usuário - tentar múltiplas abordagens
    console.log('🔍 Buscando assinatura para usuário:', user.id);
    
    // Primeiro, tentar buscar por user_id
    let { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('🔍 Resultado da busca por user_id:', { subscription, subError });

    // Se não encontrar por user_id, tentar buscar por company_id
    if (subError || !subscription?.stripe_customer_id) {
      console.log('⚠️ Não encontrou por user_id, tentando por company_id...');
      
      // Buscar company_id do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      console.log('🔍 Perfil do usuário:', { userProfile, profileError });

      if (userProfile?.company_id) {
        // Buscar assinatura por company_id
        const { data: companySubscription, error: companySubError } = await supabase
          .from('subscriptions')
          .select('stripe_customer_id, stripe_subscription_id, status')
          .eq('company_id', userProfile.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('🔍 Resultado da busca por company_id:', { companySubscription, companySubError });

        if (companySubscription?.stripe_customer_id) {
          subscription = companySubscription;
          subError = null;
        }
      }
    }

    if (subError || !subscription?.stripe_customer_id) {
      console.error('❌ Assinatura não encontrada:', { subError, subscription });
      
      // Log adicional para debug
      const { data: allSubscriptions, error: allSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(5);
      
      console.log('🔍 Todas as assinaturas (debug):', { allSubscriptions, allSubError });
      
      return NextResponse.json({ 
        error: 'Assinatura não encontrada',
        debug: {
          userId: user.id,
          subscriptionCount: allSubscriptions?.length || 0
        }
      }, { status: 404 });
    }

    console.log('✅ Stripe Customer ID encontrado:', subscription.stripe_customer_id);

    // Criar sessão do portal do cliente
    console.log('🔧 Criando sessão do portal do cliente...');
    const session = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/assinatura-gestao`
    );

    console.log('✅ Sessão do portal criada:', { url: session.url });

    return NextResponse.json({ 
      success: true, 
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Erro ao criar portal do cliente:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 