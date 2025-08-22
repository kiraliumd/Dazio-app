export const runtime = 'nodejs';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCustomerPortalSession } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usar createAdminClient para busca de dados (bypass RLS)
    const adminSupabase = await createAdminClient();

    // Buscar assinatura do usuário - tentar múltiplas abordagens
    let { data: subscription, error: subError } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Se não encontrar por user_id, tentar buscar por company_id
    if (subError || !subscription?.stripe_customer_id) {
      // Buscar company_id do usuário
      const { data: userProfile, error: profileError } = await adminSupabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (userProfile?.company_id) {
        // Buscar assinatura por company_id
        const { data: companySubscription, error: companySubError } =
          await adminSupabase
            .from('subscriptions')
            .select('stripe_customer_id, stripe_subscription_id, status')
            .eq('company_id', userProfile.company_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (companySubscription?.stripe_customer_id) {
          subscription = companySubscription;
          subError = null;
        }
      }
    }

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    // Criar sessão do portal do cliente
    const session = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/assinatura-gestao`
    );

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Erro ao criar portal do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
