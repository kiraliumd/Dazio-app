import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Company Profile API: Iniciando busca do perfil');
    
    const supabase = await createClient();
    console.log('🔍 Company Profile API: Cliente Supabase criado');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔍 Company Profile API: Resultado da autenticação:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message || null
    });
    
    if (authError) {
      console.error('❌ Company Profile API: Erro de autenticação:', authError);
      return NextResponse.json({ 
        error: 'Erro de autenticação', 
        details: authError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('❌ Company Profile API: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔍 Company Profile API: Buscando perfil para usuário:', user.id);
    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('❌ Company Profile API: Erro ao buscar perfil da empresa:', error);
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
    }

    console.log('✅ Company Profile API: Perfil encontrado:', profile);
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('❌ Company Profile API: Erro inesperado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 