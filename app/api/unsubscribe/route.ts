import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeContactFromAudience } from '@/lib/resend-contacts';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('🔍 Unsubscribe API: Desinscrevendo email:', email);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email é obrigatório',
        },
        { status: 400 }
      );
    }

    // Desinscrever da audiência do Resend
    const result = await unsubscribeContactFromAudience(email);

    if (!result.success) {
      console.error('❌ Unsubscribe API: Erro ao desinscrever:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao processar desinscrição',
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ Unsubscribe API: Email desinscrito com sucesso:', email);

    return NextResponse.json({
      success: true,
      message: 'Email desinscrito com sucesso da nossa lista de contatos.',
      contactId: result.contactId,
    });
  } catch (error) {
    console.error('❌ Unsubscribe API: Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
