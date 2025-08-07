import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Middleware simplificado - apenas verificação de trial
  // Deixa a proteção de rotas para o AuthGuard
  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Apenas verificar trial para usuários autenticados
  if (session) {
    try {
      // Verificar se o trial expirou
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('trial_end, status')
        .eq('user_id', session.user.id)
        .single();

      if (profile && profile.status === 'trial') {
        const trialEndDate = new Date(profile.trial_end);
        const now = new Date();
        
        if (now > trialEndDate) {
          // Trial expirado, redirecionar para página de assinatura
          console.log('Middleware: Trial expirado, redirecionando para assinatura');
          return NextResponse.redirect(new URL('/assinatura', req.url));
        }
      }
    } catch (error) {
      console.error('Middleware: Erro ao verificar trial:', error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apenas rotas protegidas que precisam de verificação de trial
    // Excluir rotas da API para evitar interferência
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 