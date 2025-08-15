import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe';
import { NextResponse } from 'next/server';

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

    // Buscar assinatura do usuário
    console.log('🔍 Buscando assinatura para usuário:', user.id);
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('🔍 Resultado da busca de assinatura:', { subscription, subError });

    if (subError || !subscription?.stripe_customer_id) {
      console.error('❌ Assinatura não encontrada:', { subError, subscription });
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
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
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 