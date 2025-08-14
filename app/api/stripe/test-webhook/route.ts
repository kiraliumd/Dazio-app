import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  const body = await req.text();
  
  console.log('🧪 Test Webhook: Requisição POST recebida');
  console.log('🧪 Test Webhook: Headers:', Object.fromEntries(req.headers.entries()));
  console.log('🧪 Test Webhook: Body:', body);
  
  return NextResponse.json({
    message: 'Test webhook POST received',
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries()),
    body: body
  });
}
