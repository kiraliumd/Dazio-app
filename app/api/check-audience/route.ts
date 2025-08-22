import { NextRequest, NextResponse } from 'next/server';
import { checkContactInAudience } from '@/lib/resend-contacts';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('🔍 Check Audience API: Verificando email:', email);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email é obrigatório',
        },
        { status: 400 }
      );
    }

    // Verificar se o contato está na audiência
    const result = await checkContactInAudience(email);

    if (!result.success) {
      console.error('❌ Check Audience API: Erro ao verificar:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar contato',
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ Check Audience API: Verificação concluída:', {
      email,
      exists: result.exists,
      contactId: result.contact?.id,
    });

    return NextResponse.json({
      success: true,
      exists: result.exists,
      contact: result.contact,
    });
  } catch (error) {
    console.error('❌ Check Audience API: Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
