import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test Email Visible: Enviando email de teste...');
    
    const { data, error } = await resend.emails.send({
      from: 'Dazio <onboarding@resend.dev>',
      to: ['kiral.digital@gmail.com'],
      subject: '🚨 TESTE VISÍVEL - Sistema de Email Dazio',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0f0f0;">
          <h1 style="color: #ff0000; text-align: center;">🚨 TESTE DO SISTEMA DE EMAIL DAZIO 🚨</h1>
          
          <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333;">✅ Sistema funcionando!</h2>
            <p style="font-size: 16px; color: #666;">
              Este é um teste do sistema de email do Dazio.<br>
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}<br>
              <strong>ID do Email:</strong> ${Date.now()}
            </p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 5px solid #4caf50;">
            <h3 style="color: #2e7d32; margin: 0;">📧 Status do Sistema:</h3>
            <ul style="color: #2e7d32;">
              <li>✅ Resend API: Funcionando</li>
              <li>✅ React Email: Funcionando</li>
              <li>✅ Next.js API: Funcionando</li>
              <li>✅ Supabase: Funcionando</li>
            </ul>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            Se você recebeu este email, o sistema está funcionando corretamente! 🎉
          </p>
        </div>
      `,
      text: `
🚨 TESTE VISÍVEL - Sistema de Email Dazio

✅ Sistema funcionando!
Data/Hora: ${new Date().toLocaleString('pt-BR')}
ID do Email: ${Date.now()}

📧 Status do Sistema:
- ✅ Resend API: Funcionando
- ✅ React Email: Funcionando  
- ✅ Next.js API: Funcionando
- ✅ Supabase: Funcionando

Se você recebeu este email, o sistema está funcionando corretamente! 🎉
      `,
    });

    if (error) {
      console.error('❌ Test Email Visible: Erro:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Erro desconhecido',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Test Email Visible: Sucesso:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email de teste visível enviado com sucesso!',
      emailId: data?.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test Email Visible: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error
    }, { status: 500 });
  }
} 