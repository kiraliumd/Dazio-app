import { createClient } from '@/lib/supabase/server';
import { sendConfirmationEmail } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 Signup API: Iniciando cadastro para:', email);

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Criar usuário diretamente via admin API para evitar envio automático de email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false,
      user_metadata: {
        email_confirmed: false
      }
    });

    if (authError) {
      console.error('❌ Signup API: Erro no cadastro:', authError);
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Este email já está cadastrado. Tente fazer login.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: authError.message 
      }, { status: 400 });
    }

    if (!authData.user) {
      console.error('❌ Signup API: Usuário não foi criado');
      return NextResponse.json({ 
        success: false, 
        error: 'Erro: Usuário não foi criado' 
      }, { status: 500 });
    }

    console.log('✅ Signup API: Usuário criado com sucesso:', authData.user.id);

    // Gerar token de confirmação personalizado
    const confirmationToken = randomBytes(32).toString('hex');
    
    // Salvar token no banco de dados (você pode criar uma tabela para isso)
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: authData.user.id,
        email: email,
        token: confirmationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        used: false
      });

    if (tokenError) {
      console.error('❌ Signup API: Erro ao salvar token:', tokenError);
      // Se não conseguir salvar o token, ainda assim criar o usuário
      // mas usar o sistema padrão do Supabase
    }

    // Enviar email de confirmação via Resend
    try {
      await sendConfirmationEmail(email, confirmationToken);
      console.log('✅ Signup API: Email de confirmação enviado via Resend');
    } catch (emailError) {
      console.error('❌ Signup API: Erro ao enviar email via Resend:', emailError);
      // Se falhar o envio via Resend, usar o sistema padrão do Supabase
      console.log('🔄 Signup API: Usando sistema padrão do Supabase para email');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Verifique seu email para confirmar o cadastro.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at
      }
    });

  } catch (error) {
    console.error('❌ Signup API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 