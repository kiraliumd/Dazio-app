import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    console.log('🔍 Confirm Email Resend API: Processando confirmação com token:', token);

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token é obrigatório' 
      }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Buscar token no banco de dados
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ Confirm Email Resend API: Token inválido ou não encontrado');
      return NextResponse.json({ 
        success: false, 
        error: 'Token inválido ou expirado' 
      }, { status: 400 });
    }

    // Verificar se o token não expirou
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error('❌ Confirm Email Resend API: Token expirado');
      return NextResponse.json({ 
        success: false, 
        error: 'Token expirado' 
      }, { status: 400 });
    }

    // Buscar usuário
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(tokenData.user_id);

    if (userError || !userData.user) {
      console.error('❌ Confirm Email Resend API: Usuário não encontrado');
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 400 });
    }

    // Confirmar email do usuário
    const { error: confirmError } = await supabase.auth.admin.updateUserById(tokenData.user_id, {
      email_confirm: true
    });

    if (confirmError) {
      console.error('❌ Confirm Email Resend API: Erro ao confirmar email:', confirmError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao confirmar email' 
      }, { status: 500 });
    }

    // Marcar token como usado
    await supabase
      .from('email_confirmation_tokens')
      .update({ used: true })
      .eq('token', token);

    console.log('✅ Confirm Email Resend API: Email confirmado com sucesso');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email confirmado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Confirm Email Resend API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// Rota para reenviar email de confirmação
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    console.log('🔍 Resend Email API: Reenviando email para:', email);

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Buscar usuário pelo email usando a função correta do Supabase
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Resend Email API: Erro ao buscar usuário:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar usuário' 
      }, { status: 500 });
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ Resend Email API: Usuário não encontrado');
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      console.log('✅ Resend Email API: Email já confirmado');
      return NextResponse.json({ 
        success: true, 
        message: 'Email já foi confirmado' 
      });
    }

    // Gerar novo token
    const confirmationToken = randomBytes(32).toString('hex');
    
    // Salvar novo token
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: user.id,
        email: email,
        token: confirmationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        used: false
      });

    if (tokenError) {
      console.error('❌ Resend Email API: Erro ao salvar token:', tokenError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao gerar token' 
      }, { status: 500 });
    }

    // Enviar email via nova API
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
        console.log('✅ Resend Email API: Email reenviado com sucesso');
      } else {
        console.error('❌ Resend Email API: Erro ao enviar email:', emailResult.error);
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao enviar email' 
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('❌ Resend Email API: Erro ao enviar email:', emailError);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email reenviado com sucesso' 
    });

  } catch (error) {
    console.error('❌ Resend Email API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 