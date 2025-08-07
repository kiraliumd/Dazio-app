import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { addContactToAudience } from '@/lib/resend-contacts';

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

    const supabase = createAdminClient();
    
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

    // Adicionar contato à audiência do Resend
    const audienceResult = await addContactToAudience({
      email: email,
      firstName: '', // Pode ser expandido para incluir nome se disponível
      lastName: '',
      unsubscribed: false
    });

    if (!audienceResult.success) {
      console.warn('⚠️ Signup API: Erro ao adicionar à audiência:', audienceResult.error);
      // Não falha o cadastro se não conseguir adicionar à audiência
    } else {
      console.log('✅ Signup API: Contato adicionado à audiência:', audienceResult.contactId);
    }

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

    // Enviar email de confirmação via nova API
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          token: confirmationToken,
          type: 'confirmation'
        })
      });

      const emailResult = await emailResponse.json();
      
      if (emailResult.success) {
        console.log('✅ Signup API: Email de confirmação enviado com sucesso');
      } else {
        console.error('❌ Signup API: Erro ao enviar email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Signup API: Erro ao enviar email:', emailError);
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