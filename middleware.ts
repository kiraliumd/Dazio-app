import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Função helper para criar cliente Supabase no middleware
function createMiddlewareClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Middleware: Cookies encontrados:', cookies.map(c => c.name));
          }
          return cookies;
        },
        setAll(cookiesToSet) {
          // No middleware, não precisamos definir cookies, apenas ler
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Middleware: setAll chamado (ignorado no middleware)');
          }
        },
      },
    }
  );
}

// Rotas que devem ser sempre acessíveis
const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/cadastro/confirmacao',
  '/auth/reset-password',
  '/auth/reset-password/confirm',
  '/auth/confirm',
  '/auth/callback',
  '/unsubscribe',
  '/landing',
  '/',
];

// Rotas que devem ser acessíveis mesmo com trial expirado
const SUBSCRIPTION_ROUTES = [
  '/assinatura-gestao',
  '/api/subscription',
  '/api/stripe',
  '/api/stripe/webhook',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Debug em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware: Iniciando para:', pathname);
    console.log('🔍 Middleware: Cookies disponíveis:', req.cookies.getAll().map(c => c.name));
  }

  // Sempre permitir rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Middleware: Rota pública, permitindo acesso');
    }
    return NextResponse.next();
  }

  // Para rotas protegidas, verificar autenticação
  const supabase = createMiddlewareClient(req);

  // Verificar sessão
  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Middleware: Erro ao obter sessão:', error);
      }
    }
    session = data.session;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Middleware: Resultado getSession:', {
        hasData: !!data,
        hasSession: !!session,
        userEmail: session?.user?.email,
        error: error?.message
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Middleware: Erro inesperado ao obter sessão:', error);
    }
  }

  // Se não há sessão, redirecionar para login
  if (!session) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Middleware: Sem sessão, redirecionando para /login');
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se tem sessão, permitir acesso
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Middleware: Sessão válida, permitindo acesso para:', pathname);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ignorar:
    // - arquivos estáticos (imagens, CSS, JS, etc.)
    // - rotas internas do Next (_next)
    // - rotas de API (api)
    // - favicon e outros arquivos de sistema
    '/((?!_next|api|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|map|woff|woff2|ttf|eot)$).*)',
  ],
};
