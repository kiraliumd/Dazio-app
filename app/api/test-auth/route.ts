import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Test Auth API: Iniciando teste de autenticação');

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔍 Test Auth API: Resultado da autenticação:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message || null,
    });

    if (authError) {
      console.error('❌ Test Auth API: Erro de autenticação:', authError);
      return NextResponse.json(
        {
          error: 'Erro de autenticação',
          details: authError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('❌ Test Auth API: Usuário não autenticado');
      return NextResponse.json(
        {
          error: 'Usuário não autenticado',
        },
        { status: 401 }
      );
    }

    console.log('✅ Test Auth API: Usuário autenticado com sucesso');
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      message: 'Autenticação funcionando corretamente',
    });
  } catch (error) {
    console.error('❌ Test Auth API: Erro inesperado:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
