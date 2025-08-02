import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Sucesso na autenticação - redirecionar para dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Erro na autenticação - redirecionar para página de confirmação com erro
  return NextResponse.redirect(`${origin}/cadastro/confirmacao?error=auth_failed`);
} 