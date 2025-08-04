import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    console.log('🔍 Company Profile Direct API: Iniciando busca do perfil');
    
    // Tentar obter o token de autorização do header
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    console.log('🔍 Company Profile Direct API: Authorization header:', authorization ? 'Presente' : 'Ausente');
    
    // Se não há token de autorização, tentar usar o cliente normal
    if (!authorization) {
      console.log('🔍 Company Profile Direct API: Tentando autenticação via cookies');
      
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Company Profile Direct API: Falha na autenticação via cookies:', authError);
        return NextResponse.json({ 
          error: 'Não autorizado - faça login novamente',
          details: authError?.message || 'Usuário não autenticado'
        }, { status: 401 });
      }
      
      console.log('✅ Company Profile Direct API: Usuário autenticado via cookies:', user.email);
      
      const { data: profile, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Company Profile Direct API: Erro ao buscar perfil:', error);
        return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
      }

      console.log('✅ Company Profile Direct API: Perfil encontrado via cookies');
      return NextResponse.json({ data: profile });
    }
    
    // Se há token de autorização, extrair o user_id do token
    // (Esta é uma implementação simplificada - em produção você deve validar o JWT)
    const token = authorization.replace('Bearer ', '');
    
    // Por enquanto, vamos retornar um erro informando que precisa implementar validação de JWT
    console.log('🔍 Company Profile Direct API: Token de autorização detectado (não implementado)');
    return NextResponse.json({ 
      error: 'Autenticação via token não implementada',
      details: 'Use autenticação via cookies'
    }, { status: 501 });
    
  } catch (error) {
    console.error('❌ Company Profile Direct API: Erro inesperado:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 