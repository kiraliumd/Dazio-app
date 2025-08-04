import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Middleware otimizado - apenas redirecionamentos essenciais
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

  // 1. Se está autenticado e tentando acessar login/cadastro, redirecionar para dashboard
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/cadastro')) {
    console.log('Middleware: Usuário autenticado, redirecionando para dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 2. Se está autenticado e tentando acessar rotas protegidas, verificar trial
  if (session) {
    const protectedRoutes = [
      '/dashboard',
      '/clientes',
      '/equipamentos',
      '/orcamentos',
      '/locacoes',
      '/locacoes-recorrentes',
      '/agenda',
      '/relatorios',
      '/configuracoes',
      '/assinatura-gestao'
    ];

    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
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
            // Trial expirou, redirecionar para página de assinatura
            console.log('Middleware: Trial expirado, redirecionando para assinatura');
            return NextResponse.redirect(new URL('/assinatura', req.url));
          }
        }
      } catch (error) {
        console.error('Middleware: Erro ao verificar trial:', error);
        // Em caso de erro, deixa o AuthGuard lidar
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apenas rotas de autenticação - deixar as outras para o AuthGuard
    // Excluir rotas da API para evitar interferência
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/login',
    '/cadastro/:path*',
    '/dashboard/:path*',
    '/clientes/:path*',
    '/equipamentos/:path*',
    '/orcamentos/:path*',
    '/locacoes/:path*',
    '/locacoes-recorrentes/:path*',
    '/agenda/:path*',
    '/relatorios/:path*',
    '/configuracoes/:path*',
  ],
}; 