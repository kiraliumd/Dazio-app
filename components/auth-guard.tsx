'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedOnce, setHasCheckedOnce] = React.useState(false);

  useEffect(() => {
    if (!loading && !user) {
      console.log(
        'AuthGuard: Usuário não autenticado, redirecionando para login'
      );
      router.replace('/login');
    }
    if (!loading) setHasCheckedOnce(true);
  }, [user, loading]);

  if (loading && !hasCheckedOnce) {
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-10 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
