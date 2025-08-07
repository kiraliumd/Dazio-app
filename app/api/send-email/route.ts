import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import SimpleConfirmationEmail from '@/emails/simple-confirmation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, token, type } = await request.json();
    
    console.log('🔍 Send Email API: Enviando email para:', email, 'tipo:', type);

    if (!email || !token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e token são obrigatórios' 
      }, { status: 400 });
    }

    let subject = '';
    let emailHtml = '';

    if (type === 'confirmation') {
      const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`;
      
      // Renderizar o template React Email
      const emailComponent = SimpleConfirmationEmail({
        userEmail: email,
        confirmationUrl: confirmationUrl,
      });
      
      emailHtml = await render(emailComponent);
      
      // Verificar se o HTML foi renderizado corretamente
      console.log('🔍 Send Email API: Tipo do HTML:', typeof emailHtml);
      console.log('🔍 Send Email API: HTML renderizado:', emailHtml.substring(0, 200) + '...');
      
      if (typeof emailHtml !== 'string') {
        console.error('❌ Send Email API: HTML não é uma string:', emailHtml);
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao renderizar template de email' 
        }, { status: 500 });
      }
      
      subject = 'Confirme seu email - Dazio';
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de email inválido' 
      }, { status: 400 });
    }

    // Enviar email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Dazio <transacional@dazio.com.br>',
      to: [email], // Enviar para o email real do usuário
      subject: subject,
      html: emailHtml,
      text: emailHtml.replace(/<[^>]*>/g, ''), // Versão texto simples
    });

    if (error) {
      console.error('❌ Send Email API: Erro ao enviar email:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Send Email API: Email enviado com sucesso:', data?.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      emailId: data?.id,
      originalEmail: email
    });

  } catch (error) {
    console.error('❌ Send Email API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 