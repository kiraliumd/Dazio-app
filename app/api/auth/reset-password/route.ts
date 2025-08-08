import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend } from '../../../../lib/resend'
import React from 'react'
import render from '@react-email/render'
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

    // Determinar base URL com fallback
    const requestOrigin = request.headers.get('origin') || ''
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL || ''
    const baseUrl = (envOrigin || requestOrigin || 'https://app.dazio.com.br').replace(/\/$/, '')
    // Redireciona via callback para garantir exchangeCodeForSession e cookies, depois vai para a tela de confirmação
    const redirectTo = `${baseUrl}/auth/callback?next=/auth/reset-password/confirm`

    let actionLink: string | null = null

    // 1) Tenta via Service Role (gera link diretamente) se disponível
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminClient()
        const { data, error } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo }
        })
        if (error) {
          throw error
        }
        actionLink = data?.properties?.action_link || data?.action_link || null
      }
    } catch (adminErr) {
      console.error('Erro ao gerar link (admin.generateLink):', adminErr)
      actionLink = null
    }

    // 2) Fallback: usar cliente anon para solicitar reset (Supabase envia email padrão com link válido)
    if (!actionLink) {
      const supabase = await createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        console.error('Erro ao gerar link de reset:', error)
        return NextResponse.json(
          { error: 'Erro ao processar solicitação', details: error.message },
          { status: 500 }
        )
      }
      // Deixar o Supabase enviar o email padrão (não enviar customizado sem actionLink)
    } else {
      // Enviar email customizado somente quando há actionLink válido
      try {
        const emailHtml = await render(React.createElement(ResetPasswordEmail, { resetUrl: actionLink!, userEmail: email }))
        await resend.emails.send({
          from: 'Dazio <noreply@dazio.com.br>',
          to: [email],
          subject: 'Redefinir sua senha - Dazio',
          html: emailHtml,
        })
      } catch (emailError) {
        console.error('Erro ao enviar email (Resend):', emailError)
        // Segue com 200 mesmo que o email customizado falhe; o fallback do Supabase já foi acionado acima quando não há actionLink
      }
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
