import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType } = body;

    console.log('🔄 API Test: Recebida requisição', { planType });

    // Simular uma resposta de teste
    const testResponse = {
      success: true,
      message: 'API funcionando corretamente',
      planType,
      timestamp: new Date().toISOString(),
      environment: {
        stripeSecretKey: process.env.STRIPE_SECRET_KEY
          ? 'Configurada'
          : 'Não configurada',
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          ? 'Configurada'
          : 'Não configurada',
        monthlyPriceId:
          process.env.STRIPE_MONTHLY_PRICE_ID || 'Não configurado',
        annualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'Não configurado',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Não configurado',
      },
    };

    console.log('✅ API Test: Enviando resposta', testResponse);

    return NextResponse.json(testResponse);
  } catch (error) {
    console.error('❌ API Test: Erro', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
