import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que devem ser sempre acessíveis
const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/auth/reset-password',
  '/auth/reset-password/confirm',
  '/auth/confirm',
  '/unsubscribe',
  '/landing',
  '/'
];

// Rotas que devem ser acessíveis mesmo com trial expirado
const SUBSCRIPTION_ROUTES = [
  '/assinatura-gestao',
  '/api/subscription',
  '/api/stripe',
  '/api/stripe/webhook'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
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

  // Se não há sessão, permitir acesso apenas a rotas públicas
  if (!session) {
    if (PUBLIC_ROUTES.includes(pathname)) {
      return response;
    }
    
    // Redirecionar para login se tentar acessar rota protegida
    console.log('Middleware: Usuário não autenticado, redirecionando para login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Verificar status do trial para usuários autenticados
  try {
    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('trial_end, status')
      .eq('user_id', session.user.id)
      .single();

    if (error || !profile) {
      console.log('Middleware: Perfil não encontrado, redirecionando para assinatura');
      return NextResponse.redirect(new URL('/assinatura-gestao', req.url));
    }

    const now = new Date();
    const trialEndDate = new Date(profile.trial_end);
    const isTrialExpired = now > trialEndDate;
    const isTrialStatus = profile.status === 'trial';

    // Se o trial expirou e o status ainda é 'trial'
    if (isTrialExpired && isTrialStatus) {
      // Permitir acesso apenas a rotas de assinatura
      if (SUBSCRIPTION_ROUTES.includes(pathname)) {
        return response;
      }
      
      // Bloquear acesso a todas as outras rotas
      console.log('Middleware: Trial expirado, redirecionando para assinatura-gestao');
      return NextResponse.redirect(new URL('/assinatura-gestao', req.url));
    }

    // Se o status é 'cancelled' ou 'expired', redirecionar para assinatura
    if (['cancelled', 'expired'].includes(profile.status)) {
      if (!SUBSCRIPTION_ROUTES.includes(pathname)) {
        console.log('Middleware: Assinatura cancelada/expirada, redirecionando para assinatura-gestao');
        return NextResponse.redirect(new URL('/assinatura-gestao', req.url));
      }
    }

    // Se tem assinatura ativa ou trial ativo, permitir acesso
    if (profile.status === 'active' || (!isTrialExpired && isTrialStatus)) {
      return response;
    }

  } catch (error) {
    console.error('Middleware: Erro ao verificar trial:', error);
    // Em caso de erro, redirecionar para assinatura por segurança
    if (!SUBSCRIPTION_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/assinatura-gestao', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 