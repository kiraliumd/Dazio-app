import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Auth Callback: Parâmetros recebidos:', {
      code,
      token,
      type,
      next,
    });
    console.log('🔍 Auth Callback: URL completa:', request.url);
  }

  // Se há um token de recovery (reset de senha) - PRIORIDADE ALTA
  if (token && type === 'recovery') {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🔍 Auth Callback: Processando token de recovery (reset de senha)'
      );
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            '❌ Auth Callback: Erro na verificação de recovery:',
            error
          );
        }
        return NextResponse.redirect(
          `${origin}/auth/reset-password/confirm?error=auth_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '✅ Auth Callback: Token de recovery verificado com sucesso'
        );
      }

      // Usar o parâmetro next se disponível, senão ir para reset-password/confirm
      const redirectUrl =
        next && next !== '/dashboard' ? next : '/auth/reset-password/confirm';
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Auth Callback: Redirecionando para:', redirectUrl);
      }

      return NextResponse.redirect(
        `${origin}${redirectUrl}?token=${token}&type=${type}`
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Auth Callback: Erro inesperado no recovery:', error);
      }
      return NextResponse.redirect(
        `${origin}/auth/reset-password/confirm?error=auth_failed&message=Erro inesperado`
      );
    }
  }

  // Se há um token de confirmação de email
  if (token && type === 'signup') {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth Callback: Processando confirmação de email');
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Auth Callback: Erro na verificação:', error);
        }
        return NextResponse.redirect(
          `${origin}/cadastro/confirmacao?error=auth_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Auth Callback: Email confirmado com sucesso');
      }
      return NextResponse.redirect(
        `${origin}/cadastro/confirmacao?success=true&token=${token}&type=${type}`
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Auth Callback: Erro inesperado:', error);
      }
      return NextResponse.redirect(
        `${origin}/cadastro/confirmacao?error=auth_failed&message=Erro inesperado`
      );
    }
  }

  // Se há um código de autorização (fluxo OAuth)
  if (code) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth Callback: Processando código de autorização');
    }

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Auth Callback: Erro no exchange:', error);
        }
        return NextResponse.redirect(
          `${origin}/cadastro/confirmacao?error=auth_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Auth Callback: Sessão criada com sucesso');
      }
      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Auth Callback: Erro inesperado no exchange:', error);
      }
      return NextResponse.redirect(
        `${origin}/cadastro/confirmacao?error=auth_failed&message=Erro inesperado`
      );
    }
  }

  // Se não há nem token nem code
  if (process.env.NODE_ENV === 'development') {
    console.log('❌ Auth Callback: Nenhum token ou código encontrado');
  }
  return NextResponse.redirect(
    `${origin}/cadastro/confirmacao?error=auth_failed&message=Parâmetros inválidos`
  );
}

// Sincroniza os eventos de autenticação do cliente com o servidor (cookies)
export async function POST(request: NextRequest) {
  try {
    const { event, session } = await request.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth Callback (POST): Evento recebido:', event);
      console.log('🔍 Auth Callback (POST): Sessão recebida:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? 'presente' : 'ausente',
        refreshToken: session?.refresh_token ? 'presente' : 'ausente'
      });
    }

    // Cria cliente do servidor com suporte a cookies (setAll)
    const supabase = await createServerSupabaseClient();

    if (
      event === 'SIGNED_IN' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'INITIAL_SESSION'
    ) {
      if (session) {
        try {
          const { error } = await supabase.auth.setSession(session);
          if (error) {
            console.error('❌ Auth Callback: Erro ao definir sessão:', error);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Auth Callback: Sessão definida com sucesso');
              
              // Verificar se a sessão foi realmente definida
              const { data: currentSession } = await supabase.auth.getSession();
              console.log('🔍 Auth Callback: Sessão atual após setSession:', {
                hasSession: !!currentSession.session,
                userEmail: currentSession.session?.user?.email
              });
            }
          }
        } catch (setSessionError) {
          console.error('❌ Auth Callback: Erro inesperado ao definir sessão:', setSessionError);
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('❌ Auth Callback: Erro ao fazer logout:', error);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Auth Callback: Logout realizado com sucesso');
          }
        }
      } catch (signOutError) {
        console.error('❌ Auth Callback: Erro inesperado ao fazer logout:', signOutError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Auth Callback (POST): Erro inesperado:', error);
    }
    return NextResponse.json(
      { ok: false, error: 'Erro inesperado' },
      { status: 500 }
    );
  }
}
