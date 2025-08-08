import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { resend } from '../../../../lib/resend'
import { render } from '@react-email/components'
import ResetPasswordEmail from '../../../../emails/reset-password-email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)
    
    if (userError || !user.user) {
      // Não revelar se o email existe ou não por segurança
      return NextResponse.json(
        { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' },
        { status: 200 }
      )
    }

    // Gerar link de reset de senha
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`,
    })

    if (error) {
      console.error('Erro ao gerar link de reset:', error)
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
      )
    }

    // Enviar email personalizado
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`
      const emailHtml = render(ResetPasswordEmail({ resetUrl, userEmail: email }))
      
      await resend.emails.send({
        from: 'Dazio <noreply@dazio.com.br>',
        to: [email],
        subject: 'Redefinir sua senha - Dazio',
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Não falhar se o email não for enviado, pois o Supabase já enviou o email padrão
    }

    return NextResponse.json(
      { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro na API de reset de senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
