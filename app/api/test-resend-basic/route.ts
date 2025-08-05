import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test Resend Basic: Iniciando teste...');
    console.log('🔍 Test Resend Basic: API Key presente:', !!process.env.RESEND_API_KEY);
    console.log('🔍 Test Resend Basic: API Key (primeiros 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    
    // Teste mais básico possível
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['kiral.digital@gmail.com'],
      subject: 'Teste Básico - Dazio',
      html: '<p>Teste do Resend funcionando!</p>',
    });

    if (error) {
      console.error('❌ Test Resend Basic: Erro:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Erro desconhecido',
        details: error,
        apiKeyPresent: !!process.env.RESEND_API_KEY
      }, { status: 500 });
    }

    console.log('✅ Test Resend Basic: Sucesso:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste básico realizado com sucesso',
      data: data
    });

  } catch (error) {
    console.error('❌ Test Resend Basic: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error,
      apiKeyPresent: !!process.env.RESEND_API_KEY
    }, { status: 500 });
  }
} 