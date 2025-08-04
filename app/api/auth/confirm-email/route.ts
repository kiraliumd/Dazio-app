import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json();
    
    console.log('🔍 Confirm Email API: Processando confirmação', { token, type });

    if (!token || type !== 'signup') {
      return NextResponse.json({ 
        success: false, 
        error: 'Token ou tipo inválido' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Verificar o token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });

    if (error) {
      console.error('❌ Confirm Email API: Erro na verificação:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 });
    }

    // Se chegou aqui, a verificação foi bem-sucedida
    console.log('✅ Confirm Email API: Email confirmado com sucesso');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email confirmado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Confirm Email API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 