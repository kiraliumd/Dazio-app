import { NextRequest, NextResponse } from 'next/server';
import { addContactToAudience } from '@/lib/resend-contacts';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('🔍 Resubscribe API: Re-inscrevendo email:', email);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email é obrigatório',
        },
        { status: 400 }
      );
    }

    // Re-adicionar à audiência do Resend
    const result = await addContactToAudience({
      email: email,
      firstName: '',
      lastName: '',
      unsubscribed: false,
    });

    if (!result.success) {
      console.error('❌ Resubscribe API: Erro ao re-inscrever:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao processar re-inscrição',
          details: result.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ Resubscribe API: Email re-inscrito com sucesso:', email);

    return NextResponse.json({
      success: true,
      message: 'Email re-inscrito com sucesso na nossa lista de contatos.',
      contactId: result.contactId,
    });
  } catch (error) {
    console.error('❌ Resubscribe API: Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
