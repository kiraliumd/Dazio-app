import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

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

  console.log('🔍 Auth Callback: Parâmetros recebidos:', { code, token, type, next });

  // Se há um token de confirmação de email
  if (token && type === 'signup') {
    console.log('🔍 Auth Callback: Processando confirmação de email');
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        console.error('❌ Auth Callback: Erro na verificação:', error);
        return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed&message=${encodeURIComponent(error.message)}`);
      }

      console.log('✅ Auth Callback: Email confirmado com sucesso');
      return NextResponse.redirect(`${origin}/cadastro/confirmacao?success=true&token=${token}&type=${type}`);
    } catch (error) {
      console.error('❌ Auth Callback: Erro inesperado:', error);
      return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed&message=Erro inesperado`);
    }
  }

  // Se há um código de autorização (fluxo OAuth)
  if (code) {
    console.log('🔍 Auth Callback: Processando código de autorização');
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Auth Callback: Erro no exchange:', error);
        return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed&message=${encodeURIComponent(error.message)}`);
      }

      console.log('✅ Auth Callback: Sessão criada com sucesso');
      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error('❌ Auth Callback: Erro inesperado no exchange:', error);
      return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed&message=Erro inesperado`);
    }
  }

  // Se não há nem token nem code
  console.log('❌ Auth Callback: Nenhum token ou código encontrado');
  return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed&message=Parâmetros inválidos`);
} 

// Sincroniza os eventos de autenticação do cliente com o servidor (cookies)
export async function POST(request: NextRequest) {
  try {
    const { event, session } = await request.json();

    // Cria cliente do servidor com suporte a cookies (setAll)
    const supabase = await createServerSupabaseClient();

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      if (session) {
        await supabase.auth.setSession(session);
      }
    }

    if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Auth Callback (POST): Erro inesperado:', error);
    return NextResponse.json({ ok: false, error: 'Erro inesperado' }, { status: 500 });
  }
}