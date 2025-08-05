import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }
    
    console.log('🔍 Test Email Real: Enviando para:', email);
    
    const { data, error } = await resend.emails.send({
      from: 'Dazio <transacional@dazio.com.br>',
      to: [email],
      subject: '🧪 Teste de Email - Dazio',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #333;">🧪 Teste de Email - Dazio</h1>
          <p>Este é um teste para verificar se o email está chegando no endereço correto.</p>
          <p><strong>Email de destino:</strong> ${email}</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p>Se você recebeu este email, o sistema está funcionando corretamente! 🎉</p>
        </div>
      `,
      text: `
🧪 Teste de Email - Dazio

Este é um teste para verificar se o email está chegando no endereço correto.

Email de destino: ${email}
Data/Hora: ${new Date().toLocaleString('pt-BR')}

Se você recebeu este email, o sistema está funcionando corretamente! 🎉
      `,
    });

    if (error) {
      console.error('❌ Test Email Real: Erro:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Erro desconhecido',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Test Email Real: Sucesso:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email de teste enviado com sucesso!',
      emailId: data?.id,
      sentTo: email
    });

  } catch (error) {
    console.error('❌ Test Email Real: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error
    }, { status: 500 });
  }
} 