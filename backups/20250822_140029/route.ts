import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Configurado' : 'Não configurado',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Não configurado'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    if (process.env.NODE_ENV === "development") { console.log('🔍 Test Webhook - POST recebido:'); }
    if (process.env.NODE_ENV === "development") { console.log('📅 Timestamp:', new Date().toISOString());
    if (process.env.NODE_ENV === "development") { console.log('🌐 URL:', request.url); }
    if (process.env.NODE_ENV === "development") { console.log('📋 Method:', request.method); }
    if (process.env.NODE_ENV === "development") { console.log('📊 Headers:', JSON.stringify(headers, null, 2));
    if (process.env.NODE_ENV === "development") { console.log('📝 Body (primeiros 500 chars):', body.substring(0, 500));
    if (process.env.NODE_ENV === "development") { console.log('📏 Body length:', body.length); }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook test POST recebido e logado',
      timestamp: new Date().toISOString(),
      received: {
        method: request.method,
        url: request.url,
        headersCount: Object.keys(headers).length,
        bodyLength: body.length,
        hasStripeSignature: !!headers['stripe-signature']
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('❌ Erro no test webhook:', error); }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
