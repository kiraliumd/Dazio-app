import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test Resend: Iniciando teste...');
    console.log(
      '🔍 Test Resend: API Key presente:',
      !!process.env.RESEND_API_KEY
    );

    // Teste simples com HTML básico
    const { data, error } = await resend.emails.send({
      from: 'Dazio <onboarding@resend.dev>',
      to: ['test@example.com'],
      subject: 'Teste Resend - Dazio',
      html: '<h1>Teste de Email</h1><p>Este é um teste do Resend.</p>',
    });

    if (error) {
      console.error('❌ Test Resend: Erro:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Erro desconhecido',
          details: error,
        },
        { status: 500 }
      );
    }

    console.log('✅ Test Resend: Sucesso:', data);

    return NextResponse.json({
      success: true,
      message: 'Teste realizado com sucesso',
      data: data,
    });
  } catch (error) {
    console.error('❌ Test Resend: Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error,
      },
      { status: 500 }
    );
  }
}
