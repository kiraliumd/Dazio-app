import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test Signup Flow: Iniciando teste...');
    
    // Simular o que a API de signup faz
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';
    
    console.log('🔍 Test Signup Flow: Chamando API de email...');
    
    // Chamar a API de envio de email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        token: testToken,
        type: 'confirmation'
      })
    });

    const emailResult = await emailResponse.json();
    
    console.log('🔍 Test Signup Flow: Resposta da API de email:', emailResult);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste do fluxo de cadastro realizado',
      emailResult: emailResult,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    });

  } catch (error) {
    console.error('❌ Test Signup Flow: Erro:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro no teste',
      details: error
    }, { status: 500 });
  }
} 