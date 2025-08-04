import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/subscription/actions';

export async function POST(request: NextRequest) {
  try {
    const { planType } = await request.json();
    
    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de plano inválido' },
        { status: 400 }
      );
    }

    console.log('🔄 API Test Subscription: Iniciando para', planType);
    
    const result = await createSubscription(planType);
    
    console.log('📋 API Test Subscription: Resultado', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ API Test Subscription: Erro', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
} 