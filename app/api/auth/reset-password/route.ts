import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    // Solicitar reset de senha diretamente (não revela existência do email)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`,
    })

    if (error) {
      console.error('Erro ao gerar link de reset:', error)
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
      )
    }

    // Enviar email personalizado (opcional). Se falhar, não impedimos a resposta de sucesso
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
      console.error('Erro ao enviar email (Resend):', emailError)
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
