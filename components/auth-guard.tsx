'use client';

import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect } from 'react';
import { useStableNavigation } from '../hooks/use-stable-navigation';
import { useAuth } from '../lib/auth-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, session } = useAuth();
  const { replace } = useStableNavigation();
  const [hasCheckedOnce, setHasCheckedOnce] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);
  const [authStatus, setAuthStatus] = React.useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  // Cache do status de autenticação para evitar re-renders desnecessários
  const authCache = React.useRef<{
    user: string | null;
    session: string | null;
    timestamp: number;
  }>({ user: null, session: null, timestamp: 0 });

  useEffect(() => {
    // Evitar verificações desnecessárias durante Fast Refresh
    const now = Date.now();
    const cacheValid = now - authCache.current.timestamp < 1000; // 1 segundo de cache
    
    if (cacheValid && authCache.current.user === user?.id && authCache.current.session === session?.access_token) {
      return;
    }

    // Atualizar cache
    authCache.current = {
      user: user?.id || null,
      session: session?.access_token || null,
      timestamp: now
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AuthGuard:', {
        loading,
        hasUser: !!user,
        hasSession: !!session,
        userEmail: user?.email,
        pathname: window.location.pathname,
        hasCheckedOnce,
        redirecting,
        authStatus
      });
    }

    // Só verificar após o loading terminar
    if (!loading) {
      setHasCheckedOnce(true);
      
      // Se tem usuário e sessão, permitir acesso
      if (user && session) {
        setAuthStatus('authenticated');
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ AuthGuard: Usuário autenticado, permitindo acesso');
        }
        return;
      }
      
      // Se não tem usuário e já verificou, redirecionar
      if (!user && hasCheckedOnce && !redirecting) {
        setAuthStatus('unauthenticated');
        setRedirecting(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ AuthGuard: Usuário não autenticado, redirecionando para login');
        }
        
        // Usar setTimeout para evitar múltiplos redirecionamentos
        setTimeout(() => {
          replace('/login');
        }, 100);
      }
    }
  }, [user, loading, session, hasCheckedOnce, redirecting, replace, authStatus]);

  // Loading state
  if (loading || !hasCheckedOnce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-40 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Se não tem usuário, mostrar loading até redirecionar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-40 mx-auto" />
          <div className="text-center text-muted-foreground">
            Redirecionando para login...
          </div>
        </div>
      </div>
    );
  }

  // Usuário autenticado, renderizar children
  return <>{children}</>;
}