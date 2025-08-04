import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Subscription API: Iniciando busca da assinatura');
    
    const supabase = await createClient();
    console.log('🔍 Subscription API: Cliente Supabase criado');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Subscription API: Resultado da autenticação:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message || null
    });
    
    if (authError) {
      console.error('❌ Subscription API: Erro de autenticação:', authError);
      return NextResponse.json({ 
        error: 'Erro de autenticação', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('❌ Subscription API: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar company_id do usuário
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!companyProfile) {
      console.log('❌ Subscription API: Perfil da empresa não encontrado para usuário:', user.id);
      return NextResponse.json({ data: null });
    }

    console.log('🔍 Subscription API: Buscando assinatura para empresa:', companyProfile.id);
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyProfile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Subscription API: Erro ao buscar assinatura:', error);
      return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }

    console.log('✅ Subscription API: Assinatura encontrada:', subscription);
    return NextResponse.json({ data: subscription || null });
  } catch (error) {
    console.error('❌ Subscription API: Erro inesperado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 